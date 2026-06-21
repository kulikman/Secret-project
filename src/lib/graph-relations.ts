import { z } from "zod";

export const graphRelationTypes = [
  "related_to",
  "supported_by",
  "disputed_by",
  "mentions",
  "authored_by",
  "participated_in",
  "occurred_at",
  "belongs_to",
  "derived_from",
  "contradicts",
  "expands",
] as const;

export const graphRelationTypeSchema = z.enum(graphRelationTypes);

export type GraphRelationType = z.infer<typeof graphRelationTypeSchema>;

export function normalizeGraphRelationType(
  value: string | null | undefined,
  fallback: GraphRelationType = "related_to"
): GraphRelationType {
  const parsed = graphRelationTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
