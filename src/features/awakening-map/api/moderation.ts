import "server-only";

import { z } from "zod";

import { AWAKENING_MAP_REVIEW_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";
import {
  awakeningTopicSuggestionStatusSchema,
  createAwakeningTopicReview,
} from "../lib/topic-suggestions";

const AWAKENING_TOPIC_SUGGESTION_SELECT =
  "id,title,slug,summary,description,related_node_refs,source_refs,status,suggested_by,reviewed_by,reviewed_at,decision_reason,promoted_node_projection_id,created_at,updated_at" as const;

export const listAwakeningTopicSuggestionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  status: awakeningTopicSuggestionStatusSchema.optional(),
});

export const getAwakeningTopicSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
});

export const reviewAwakeningTopicSuggestionSchema = z.object({
  decisionReason: z.string().trim().min(3).max(1000),
  promotedNodeProjectionId: z.string().uuid().optional(),
  suggestionId: z.string().uuid(),
});

export type AwakeningTopicSuggestionStatus = z.infer<typeof awakeningTopicSuggestionStatusSchema>;
export type ListAwakeningTopicSuggestionsInput = z.input<
  typeof listAwakeningTopicSuggestionsSchema
>;
export type ReviewAwakeningTopicSuggestionInput = z.input<
  typeof reviewAwakeningTopicSuggestionSchema
>;

type SuggestionRow = Tables<"awakening_topic_suggestions">;

export type AwakeningTopicSuggestion = Pick<
  SuggestionRow,
  | "created_at"
  | "decision_reason"
  | "description"
  | "id"
  | "promoted_node_projection_id"
  | "reviewed_at"
  | "reviewed_by"
  | "slug"
  | "suggested_by"
  | "summary"
  | "title"
  | "updated_at"
> & {
  related_node_refs: Json;
  source_refs: Json;
  status: AwakeningTopicSuggestionStatus;
};

export class AwakeningMapModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AwakeningMapModerationError";
  }
}

function toAwakeningTopicSuggestion(row: SuggestionRow): AwakeningTopicSuggestion {
  return {
    created_at: row.created_at,
    decision_reason: row.decision_reason,
    description: row.description,
    id: row.id,
    promoted_node_projection_id: row.promoted_node_projection_id,
    related_node_refs: row.related_node_refs,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    slug: row.slug,
    source_refs: row.source_refs,
    status: awakeningTopicSuggestionStatusSchema.parse(row.status),
    suggested_by: row.suggested_by,
    summary: row.summary,
    title: row.title,
    updated_at: row.updated_at,
  };
}

function ensurePendingSuggestion(row: Pick<SuggestionRow, "status">): void {
  if (row.status !== "pending") {
    throw new AwakeningMapModerationError("Only pending suggestions can be reviewed.");
  }
}

function createProjectionInsertFromSuggestion(
  suggestion: SuggestionRow
): TablesInsert<"node_projection"> {
  return {
    brain_node_id: `awakening-suggestion:${suggestion.id}`,
    content: {
      description: suggestion.description,
      origin_suggestion_id: suggestion.id,
      related_node_refs: suggestion.related_node_refs,
      source_refs: suggestion.source_refs,
    },
    node_type: "topic",
    slug: suggestion.slug,
    source_refs: suggestion.source_refs,
    status: "review",
    summary: suggestion.summary,
    title: suggestion.title,
  };
}

function createReviewUpdate(input: {
  actorUserId: string;
  decisionReason: string;
  promotedNodeProjectionId?: string | null;
  status: "approved" | "rejected" | "merged";
}): TablesUpdate<"awakening_topic_suggestions"> {
  const review = createAwakeningTopicReview({
    status: input.status,
    reviewedBy: input.actorUserId,
    decisionReason: input.decisionReason,
    promotedNodeProjectionId: input.promotedNodeProjectionId,
  });

  return {
    decision_reason: review.decision_reason,
    promoted_node_projection_id: review.promoted_node_projection_id,
    reviewed_at: review.reviewed_at,
    reviewed_by: review.reviewed_by,
    status: review.status,
  };
}

async function writeSuggestionReviewAudit(input: {
  actorUserId: string;
  createdProjectionId?: string | null;
  decisionReason: string;
  nextStatus: "approved" | "rejected" | "merged";
  previousStatus: string;
  promotedNodeProjectionId?: string | null;
  suggestion: Pick<SuggestionRow, "id" | "slug" | "suggested_by" | "title">;
}): Promise<void> {
  await writeAuditLog({
    action: "admin.awakening_topic_reviewed",
    metadata: {
      createdProjectionId: input.createdProjectionId ?? null,
      decisionReason: input.decisionReason,
      nextStatus: input.nextStatus,
      previousStatus: input.previousStatus,
      promotedNodeProjectionId: input.promotedNodeProjectionId ?? null,
      slug: input.suggestion.slug,
      suggestedBy: input.suggestion.suggested_by,
      title: input.suggestion.title,
    },
    resource: `awakening-topic-suggestion:${input.suggestion.id}`,
    userId: input.actorUserId,
  });
}

export async function listAwakeningTopicSuggestions(
  input: ListAwakeningTopicSuggestionsInput = {}
): Promise<AwakeningTopicSuggestion[]> {
  const filters = listAwakeningTopicSuggestionsSchema.parse(input);
  await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);

  const supabase = await createClient();
  let query = supabase
    .from("awakening_topic_suggestions")
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(filters.limit);

  if (error) {
    throw new AwakeningMapModerationError(
      `Failed to list awakening topic suggestions: ${error.message}`
    );
  }

  return (data ?? []).map((row) => toAwakeningTopicSuggestion(row as SuggestionRow));
}

export async function getAwakeningTopicSuggestion(
  suggestionId: string
): Promise<AwakeningTopicSuggestion | null> {
  const parsed = getAwakeningTopicSuggestionSchema.parse({ suggestionId });
  await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("awakening_topic_suggestions")
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .eq("id", parsed.suggestionId)
    .maybeSingle();

  if (error) {
    throw new AwakeningMapModerationError(
      `Failed to read awakening topic suggestion: ${error.message}`
    );
  }

  return data ? toAwakeningTopicSuggestion(data as SuggestionRow) : null;
}

export async function approveAwakeningTopicSuggestion(
  input: ReviewAwakeningTopicSuggestionInput
): Promise<AwakeningTopicSuggestion> {
  const parsed = reviewAwakeningTopicSuggestionSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("awakening_topic_suggestions")
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .eq("id", parsed.suggestionId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningMapModerationError(
      `Failed to read awakening topic suggestion: ${readError.message}`
    );
  }

  if (!current) throw new AwakeningMapModerationError("Awakening topic suggestion not found.");
  const suggestion = current as SuggestionRow;
  ensurePendingSuggestion(suggestion);

  const { data: projection, error: projectionError } = await supabase
    .from("node_projection")
    .insert(createProjectionInsertFromSuggestion(suggestion))
    .select("id")
    .single();

  if (projectionError) {
    throw new AwakeningMapModerationError(
      `Failed to create topic projection: ${projectionError.message}`
    );
  }

  const update = createReviewUpdate({
    actorUserId: actor.userId,
    decisionReason: parsed.decisionReason,
    promotedNodeProjectionId: projection.id,
    status: "approved",
  });

  const { data, error } = await supabase
    .from("awakening_topic_suggestions")
    .update(update)
    .eq("id", parsed.suggestionId)
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .single();

  if (error) {
    throw new AwakeningMapModerationError(
      `Failed to approve awakening topic suggestion: ${error.message}`
    );
  }

  await writeSuggestionReviewAudit({
    actorUserId: actor.userId,
    createdProjectionId: projection.id,
    decisionReason: parsed.decisionReason,
    nextStatus: "approved",
    previousStatus: suggestion.status,
    promotedNodeProjectionId: projection.id,
    suggestion,
  });

  return toAwakeningTopicSuggestion(data as SuggestionRow);
}

export async function rejectAwakeningTopicSuggestion(
  input: ReviewAwakeningTopicSuggestionInput
): Promise<AwakeningTopicSuggestion> {
  const parsed = reviewAwakeningTopicSuggestionSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("awakening_topic_suggestions")
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .eq("id", parsed.suggestionId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningMapModerationError(
      `Failed to read awakening topic suggestion: ${readError.message}`
    );
  }

  if (!current) throw new AwakeningMapModerationError("Awakening topic suggestion not found.");
  const suggestion = current as SuggestionRow;
  ensurePendingSuggestion(suggestion);

  const update = createReviewUpdate({
    actorUserId: actor.userId,
    decisionReason: parsed.decisionReason,
    status: "rejected",
  });

  const { data, error } = await supabase
    .from("awakening_topic_suggestions")
    .update(update)
    .eq("id", parsed.suggestionId)
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .single();

  if (error) {
    throw new AwakeningMapModerationError(
      `Failed to reject awakening topic suggestion: ${error.message}`
    );
  }

  await writeSuggestionReviewAudit({
    actorUserId: actor.userId,
    decisionReason: parsed.decisionReason,
    nextStatus: "rejected",
    previousStatus: suggestion.status,
    suggestion,
  });

  return toAwakeningTopicSuggestion(data as SuggestionRow);
}

export async function mergeAwakeningTopicSuggestion(
  input: ReviewAwakeningTopicSuggestionInput
): Promise<AwakeningTopicSuggestion> {
  const parsed = reviewAwakeningTopicSuggestionSchema
    .extend({
      promotedNodeProjectionId: z.string().uuid(),
    })
    .parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();

  const { data: current, error: readError } = await supabase
    .from("awakening_topic_suggestions")
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .eq("id", parsed.suggestionId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningMapModerationError(
      `Failed to read awakening topic suggestion: ${readError.message}`
    );
  }

  if (!current) throw new AwakeningMapModerationError("Awakening topic suggestion not found.");
  const suggestion = current as SuggestionRow;
  ensurePendingSuggestion(suggestion);

  const { data: projection, error: projectionReadError } = await supabase
    .from("node_projection")
    .select("id,node_type,status,title")
    .eq("id", parsed.promotedNodeProjectionId)
    .maybeSingle();

  if (projectionReadError) {
    throw new AwakeningMapModerationError(
      `Failed to read promoted projection: ${projectionReadError.message}`
    );
  }

  if (!projection || projection.node_type !== "topic") {
    throw new AwakeningMapModerationError("Merge target topic projection not found.");
  }

  const update = createReviewUpdate({
    actorUserId: actor.userId,
    decisionReason: parsed.decisionReason,
    promotedNodeProjectionId: parsed.promotedNodeProjectionId,
    status: "merged",
  });

  const { data, error } = await supabase
    .from("awakening_topic_suggestions")
    .update(update)
    .eq("id", parsed.suggestionId)
    .select(AWAKENING_TOPIC_SUGGESTION_SELECT)
    .single();

  if (error) {
    throw new AwakeningMapModerationError(
      `Failed to merge awakening topic suggestion: ${error.message}`
    );
  }

  await writeSuggestionReviewAudit({
    actorUserId: actor.userId,
    decisionReason: parsed.decisionReason,
    nextStatus: "merged",
    previousStatus: suggestion.status,
    promotedNodeProjectionId: parsed.promotedNodeProjectionId,
    suggestion,
  });

  return toAwakeningTopicSuggestion(data as SuggestionRow);
}
