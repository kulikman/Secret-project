import { z } from "zod";

import { archiveNodeTypes, type ArchiveNode } from "@/lib/brain/types";
import { sourceRefSchema } from "@/lib/source-refs";

export { sourceRefSchema };
export type { SourceRef } from "@/lib/source-refs";

export const nodeProjectionStatuses = ["draft", "review", "published", "archived"] as const;
export const sourceCredibilityValues = ["A", "B", "C", "D"] as const;
export const claimStatusValues = [
  "supported",
  "disputed",
  "weak",
  "unknown",
  "needs_source",
] as const;

export const nodeProjectionNodeTypeFilterLimit = archiveNodeTypes.length;
export const nodeProjectionNodeTypeSchema = z.enum(archiveNodeTypes);
export const nodeProjectionStatusSchema = z.enum(nodeProjectionStatuses);
export const sourceCredibilitySchema = z.enum(sourceCredibilityValues);
export const claimStatusSchema = z.enum(claimStatusValues);

export const nodeProjectionUpsertSchema = z
  .object({
    brain_node_id: z.string().min(1),
    node_type: nodeProjectionNodeTypeSchema,
    slug: z.string().min(1).nullable().optional(),
    title: z.string().min(1),
    summary: z.string().nullable().optional(),
    content: z.record(z.string(), z.unknown()).default({}),
    status: nodeProjectionStatusSchema.default("draft"),
    credibility: sourceCredibilitySchema.nullable().optional(),
    claim_status: claimStatusSchema.nullable().optional(),
    source_refs: z.array(sourceRefSchema).default([]),
    is_stale: z.boolean().default(false),
    published_at: z.string().datetime().nullable().optional(),
  })
  .superRefine((projection, ctx) => {
    if (
      projection.status === "published" &&
      (projection.node_type === "topic" || projection.node_type === "source") &&
      !projection.slug
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: "Published topic/source projections require a slug.",
      });
    }
  });

export type NodeProjectionStatus = z.infer<typeof nodeProjectionStatusSchema>;
export type SourceCredibility = z.infer<typeof sourceCredibilitySchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type NodeProjectionUpsert = z.infer<typeof nodeProjectionUpsertSchema>;

export function createDraftProjectionFromArchiveNode(
  node: ArchiveNode,
  overrides: Partial<Omit<NodeProjectionUpsert, "brain_node_id" | "node_type" | "title">> = {}
): NodeProjectionUpsert {
  const nodeType = nodeProjectionNodeTypeSchema.safeParse(node.category);

  if (!nodeType.success) {
    throw new Error(`Cannot project unsupported Brain node category "${node.category}".`);
  }

  return nodeProjectionUpsertSchema.parse({
    brain_node_id: node.id,
    node_type: nodeType.data,
    title: node.label,
    summary: node.summary,
    content: {
      summary: node.summary,
      facts: node.facts ?? [],
    },
    status: "draft",
    source_refs: [],
    ...overrides,
  });
}

export function assertProjectionPublishable(input: NodeProjectionUpsert): NodeProjectionUpsert {
  const projection = nodeProjectionUpsertSchema.parse(input);

  if (projection.status === "published" && projection.node_type === "claim") {
    if (projection.source_refs.length === 0) {
      throw new Error("Published claim projections require at least one source reference.");
    }
  }

  return projection;
}
