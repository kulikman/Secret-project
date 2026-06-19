import "server-only";

import { z } from "zod";

import { AWAKENING_MAP_REVIEW_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";
import { awakeningTopicSuggestionStatusSchema } from "../lib/topic-suggestions";

const AWAKENING_TOPIC_SUGGESTION_SELECT =
  "id,title,slug,summary,description,related_node_refs,source_refs,status,suggested_by,reviewed_by,reviewed_at,decision_reason,promoted_node_projection_id,created_at,updated_at" as const;

export const listAwakeningTopicSuggestionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  status: awakeningTopicSuggestionStatusSchema.optional(),
});

export const getAwakeningTopicSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
});

export type AwakeningTopicSuggestionStatus = z.infer<typeof awakeningTopicSuggestionStatusSchema>;
export type ListAwakeningTopicSuggestionsInput = z.input<
  typeof listAwakeningTopicSuggestionsSchema
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
