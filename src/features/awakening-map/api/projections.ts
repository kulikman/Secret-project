import "server-only";

import { z } from "zod";

import { AWAKENING_MAP_REVIEW_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";
import { sourceRefSchema } from "@/lib/source-refs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/types/database";

const MAP_PROJECTION_SELECT =
  "id,brain_node_id,node_type,slug,title,summary,status,source_refs,is_stale,published_at,created_at,updated_at" as const;

export const awakeningMapProjectionStatusSchema = z.enum([
  "draft",
  "review",
  "published",
  "archived",
]);

export const listAwakeningMapProjectionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  status: awakeningMapProjectionStatusSchema.optional(),
});

export const updateAwakeningMapProjectionSchema = z.object({
  projectionId: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  sourceRefs: z.array(sourceRefSchema).max(25).default([]),
  status: awakeningMapProjectionStatusSchema,
  summary: z.string().trim().max(2000).nullable().optional(),
  title: z.string().trim().min(1).max(240),
});

export type AwakeningMapProjectionStatus = z.infer<typeof awakeningMapProjectionStatusSchema>;
export type ListAwakeningMapProjectionsInput = z.input<typeof listAwakeningMapProjectionsSchema>;
export type UpdateAwakeningMapProjectionInput = z.input<typeof updateAwakeningMapProjectionSchema>;

type ProjectionRow = Pick<
  Tables<"node_projection">,
  | "brain_node_id"
  | "created_at"
  | "id"
  | "is_stale"
  | "node_type"
  | "published_at"
  | "slug"
  | "source_refs"
  | "status"
  | "summary"
  | "title"
  | "updated_at"
>;

export interface AwakeningMapProjection {
  brainNodeId: string;
  createdAt: string;
  id: string;
  isStale: boolean;
  nodeType: string;
  publishedAt: string | null;
  slug: string | null;
  sourceRefs: Json;
  status: AwakeningMapProjectionStatus;
  summary: string | null;
  title: string;
  updatedAt: string;
}

export class AwakeningMapProjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AwakeningMapProjectionError";
  }
}

function toAwakeningMapProjection(row: ProjectionRow): AwakeningMapProjection {
  return {
    brainNodeId: row.brain_node_id,
    createdAt: row.created_at,
    id: row.id,
    isStale: row.is_stale,
    nodeType: row.node_type,
    publishedAt: row.published_at,
    slug: row.slug,
    sourceRefs: row.source_refs,
    status: awakeningMapProjectionStatusSchema.parse(row.status),
    summary: row.summary,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function assertProjectionCanUseStatus(input: {
  nodeType: string;
  slug: string | null;
  sourceRefs: unknown[];
  status: AwakeningMapProjectionStatus;
}): void {
  if (input.status !== "published") return;

  if ((input.nodeType === "topic" || input.nodeType === "source") && !input.slug) {
    throw new AwakeningMapProjectionError("Published topic/source projections require a slug.");
  }

  if (input.nodeType === "claim" && input.sourceRefs.length === 0) {
    throw new AwakeningMapProjectionError(
      "Published claim projections require at least one source reference."
    );
  }
}

export async function listAwakeningMapProjections(
  input: ListAwakeningMapProjectionsInput = {}
): Promise<AwakeningMapProjection[]> {
  const filters = listAwakeningMapProjectionsSchema.parse(input);
  await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);

  const supabase = createAdminClient();
  let query = supabase.from("node_projection").select(MAP_PROJECTION_SELECT);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(filters.limit);

  if (error) {
    throw new AwakeningMapProjectionError(`Failed to list map projections: ${error.message}`);
  }

  return ((data ?? []) as ProjectionRow[]).map((row) => toAwakeningMapProjection(row));
}

export async function updateAwakeningMapProjection(
  input: UpdateAwakeningMapProjectionInput
): Promise<AwakeningMapProjection> {
  const parsed = updateAwakeningMapProjectionSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("node_projection")
    .select(MAP_PROJECTION_SELECT)
    .eq("id", parsed.projectionId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningMapProjectionError(`Failed to read map projection: ${readError.message}`);
  }

  if (!current) throw new AwakeningMapProjectionError("Map projection not found.");

  const currentRow = current as ProjectionRow;
  const nextSlug = parsed.slug ?? null;
  const nextSourceRefs = parsed.sourceRefs;

  assertProjectionCanUseStatus({
    nodeType: currentRow.node_type,
    slug: nextSlug,
    sourceRefs: nextSourceRefs,
    status: parsed.status,
  });

  const { data, error } = await supabase
    .from("node_projection")
    .update({
      published_at:
        parsed.status === "published" && !currentRow.published_at
          ? new Date().toISOString()
          : currentRow.published_at,
      slug: nextSlug,
      source_refs: nextSourceRefs as Json,
      status: parsed.status,
      summary: parsed.summary ?? null,
      title: parsed.title,
    })
    .eq("id", parsed.projectionId)
    .select(MAP_PROJECTION_SELECT)
    .single();

  if (error) {
    throw new AwakeningMapProjectionError(`Failed to update map projection: ${error.message}`);
  }

  if (!data) throw new AwakeningMapProjectionError("Updated map projection was not returned.");

  await writeAuditLog({
    action: "admin.awakening_projection_updated",
    metadata: {
      nextSlug,
      nextStatus: parsed.status,
      previousSlug: currentRow.slug,
      previousStatus: currentRow.status,
      title: parsed.title,
    },
    resource: `awakening-map-projection:${parsed.projectionId}`,
    userId: actor.userId,
  });

  return toAwakeningMapProjection(data as ProjectionRow);
}
