import "server-only";

import { z } from "zod";

import { APPLICATION_MODERATION_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

const APPLICATION_SELECT =
  "id,user_id,city_id,event_id,full_name,email,telegram,motivation,selected_topic,status,reviewed_by,reviewed_at,created_at,updated_at" as const;

export const applicationModerationStatuses = [
  "new",
  "in_review",
  "approved",
  "rejected",
  "waitlisted",
] as const;

export const applicationModerationStatusSchema = z.enum(applicationModerationStatuses);

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();

export const listApplicationsForModerationSchema = z.object({
  cityId: z.string().uuid().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  eventId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  selectedTopic: optionalTrimmedString(240),
  status: applicationModerationStatusSchema.optional(),
});

export const changeApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  decisionReason: optionalTrimmedString(2000),
  status: applicationModerationStatusSchema,
});

export type ApplicationModerationStatus = z.infer<typeof applicationModerationStatusSchema>;
export type ListApplicationsForModerationInput = z.input<
  typeof listApplicationsForModerationSchema
>;
export type ChangeApplicationStatusInput = z.input<typeof changeApplicationStatusSchema>;

type ApplicationRow = Tables<"applications">;

type ModerationApplicationBase = Pick<
  ApplicationRow,
  | "city_id"
  | "created_at"
  | "email"
  | "event_id"
  | "full_name"
  | "id"
  | "motivation"
  | "reviewed_at"
  | "reviewed_by"
  | "selected_topic"
  | "telegram"
  | "updated_at"
  | "user_id"
>;

export type ModerationApplication = ModerationApplicationBase & {
  status: ApplicationModerationStatus;
};

export class ApplicationModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationModerationError";
  }
}

function toModerationApplication(row: ModerationApplication): ModerationApplication {
  return {
    city_id: row.city_id,
    created_at: row.created_at,
    email: row.email,
    event_id: row.event_id,
    full_name: row.full_name,
    id: row.id,
    motivation: row.motivation,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    selected_topic: row.selected_topic,
    status: row.status,
    telegram: row.telegram,
    updated_at: row.updated_at,
    user_id: row.user_id,
  };
}

/**
 * @public
 */
export async function listApplicationsForModeration(
  input: ListApplicationsForModerationInput = {}
): Promise<ModerationApplication[]> {
  const filters = listApplicationsForModerationSchema.parse(input);
  await requireAdminRole(APPLICATION_MODERATION_ROLES);

  const supabase = await createClient();
  let query = supabase.from("applications").select(APPLICATION_SELECT);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.cityId) query = query.eq("city_id", filters.cityId);
  if (filters.eventId) query = query.eq("event_id", filters.eventId);
  if (filters.selectedTopic) query = query.eq("selected_topic", filters.selectedTopic);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdTo) query = query.lte("created_at", filters.createdTo);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(filters.limit);

  if (error) {
    throw new ApplicationModerationError(`Failed to list applications: ${error.message}`);
  }

  return (data ?? []).map((row) => toModerationApplication(row as ModerationApplication));
}

/**
 * @public
 */
export async function getApplicationForModeration(
  applicationId: string
): Promise<ModerationApplication | null> {
  const parsedId = z.string().uuid().parse(applicationId);
  await requireAdminRole(APPLICATION_MODERATION_ROLES);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_SELECT)
    .eq("id", parsedId)
    .maybeSingle();

  if (error) {
    throw new ApplicationModerationError(`Failed to read application: ${error.message}`);
  }

  return data ? toModerationApplication(data as ModerationApplication) : null;
}

/**
 * @public
 */
export async function changeApplicationStatus(
  input: ChangeApplicationStatusInput
): Promise<ModerationApplication> {
  const parsed = changeApplicationStatusSchema.parse(input);
  const actor = await requireAdminRole(APPLICATION_MODERATION_ROLES);
  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("applications")
    .select("id,user_id,status")
    .eq("id", parsed.applicationId)
    .maybeSingle();

  if (readError) {
    throw new ApplicationModerationError(`Failed to read application: ${readError.message}`);
  }

  if (!current) {
    throw new ApplicationModerationError("Application not found");
  }

  const update: TablesUpdate<"applications"> = {
    reviewed_at: new Date().toISOString(),
    reviewed_by: actor.userId,
    status: parsed.status,
  };

  const { data, error } = await supabase
    .from("applications")
    .update(update)
    .eq("id", parsed.applicationId)
    .select(APPLICATION_SELECT)
    .single();

  if (error) {
    throw new ApplicationModerationError(`Failed to update application: ${error.message}`);
  }

  await writeAuditLog({
    action: "admin.application_status_changed",
    metadata: {
      decisionReason: parsed.decisionReason ?? null,
      nextStatus: parsed.status,
      previousStatus: current.status,
      targetUserId: current.user_id,
    },
    resource: `application:${parsed.applicationId}`,
    userId: actor.userId,
  });

  return toModerationApplication(data as ModerationApplication);
}
