import { z } from "zod";

import { graphRelationTypeSchema } from "@/lib/graph-relations";
import { sourceRefSchema } from "@/lib/source-refs";

export const awakeningTopicSuggestionStatuses = [
  "pending",
  "approved",
  "rejected",
  "merged",
] as const;

export const awakeningTopicSuggestionStatusSchema = z.enum(awakeningTopicSuggestionStatuses);

export const awakeningRelatedNodeRefSchema = z.object({
  nodeId: z.string().min(1),
  relation: graphRelationTypeSchema.default("related_to"),
  reason: z.string().trim().min(1).max(500).optional(),
});

export const awakeningTopicSuggestionInputSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case.")
      .optional(),
    summary: z.string().trim().min(10).max(500).optional(),
    description: z.string().trim().min(20).max(4000).optional(),
    related_node_refs: z.array(awakeningRelatedNodeRefSchema).max(25).default([]),
    source_refs: z.array(sourceRefSchema).max(25).default([]),
  })
  .superRefine((suggestion, ctx) => {
    if (!suggestion.summary && !suggestion.description && suggestion.source_refs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
        message: "Add a summary, description, or source reference before suggesting a topic.",
      });
    }
  });

export const awakeningTopicSuggestionDraftSchema = awakeningTopicSuggestionInputSchema.extend({
  status: z.literal("pending").default("pending"),
  suggested_by: z.string().uuid().nullable().optional(),
});

export const awakeningTopicSuggestionReviewSchema = z
  .object({
    status: z.enum(["approved", "rejected", "merged"]),
    reviewed_by: z.string().uuid(),
    reviewed_at: z.string().datetime(),
    decision_reason: z.string().trim().min(3).max(1000),
    promoted_node_projection_id: z.string().uuid().nullable().optional(),
  })
  .superRefine((review, ctx) => {
    if (review.status === "merged" && !review.promoted_node_projection_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoted_node_projection_id"],
        message: "Merged suggestions must reference the promoted projection row.",
      });
    }
  });

export type AwakeningTopicSuggestionInput = z.input<typeof awakeningTopicSuggestionInputSchema>;
export type AwakeningTopicSuggestionDraft = z.infer<typeof awakeningTopicSuggestionDraftSchema>;
export type AwakeningTopicSuggestionReview = z.infer<typeof awakeningTopicSuggestionReviewSchema>;

export function createAwakeningTopicSuggestionDraft(
  input: AwakeningTopicSuggestionInput,
  suggestedBy: string | null = null
): AwakeningTopicSuggestionDraft {
  return awakeningTopicSuggestionDraftSchema.parse({
    ...input,
    status: "pending",
    suggested_by: suggestedBy,
  });
}

export function createAwakeningTopicReview(input: {
  status: "approved" | "rejected" | "merged";
  reviewedBy: string;
  decisionReason: string;
  promotedNodeProjectionId?: string | null;
  reviewedAt?: string;
}): AwakeningTopicSuggestionReview {
  return awakeningTopicSuggestionReviewSchema.parse({
    status: input.status,
    reviewed_by: input.reviewedBy,
    reviewed_at: input.reviewedAt ?? new Date().toISOString(),
    decision_reason: input.decisionReason,
    promoted_node_projection_id: input.promotedNodeProjectionId ?? null,
  });
}
