import { z } from "zod";

import { sourceRefSchema, type SourceRef } from "@/lib/source-refs";

export class SourceFirstValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Source-first validation failed: ${issues.join("; ")}`);
    this.name = "SourceFirstValidationError";
  }
}

export const generatedBlockSchema = z.object({
  id: z.string().min(1).optional(),
  kind: z.string().min(1),
  title: z.string().min(1).optional(),
  content: z.unknown(),
  source_refs: z.array(sourceRefSchema).min(1, "Every generated block requires source_refs."),
});

export const generatedDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  blocks: z.array(generatedBlockSchema).min(1, "Generated document requires at least one block."),
  source_refs: z.array(sourceRefSchema).min(1, "Generated document requires source_refs."),
});

export type GeneratedBlock = z.infer<typeof generatedBlockSchema>;
export type GeneratedDocument = z.infer<typeof generatedDocumentSchema>;

export interface DossierVersionDraft {
  topic_node_id: string;
  status: "draft";
  raw_output: GeneratedDocument;
  edited_content: Record<string, never>;
  source_refs: SourceRef[];
  parent_version: string | null;
  created_by?: string | null;
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

export function getSourceFirstIssues(input: unknown): string[] {
  const result = generatedDocumentSchema.safeParse(input);
  return result.success ? [] : formatIssues(result.error);
}

export function assertCanPublishGeneratedContent(input: unknown): GeneratedDocument {
  const result = generatedDocumentSchema.safeParse(input);

  if (!result.success) {
    throw new SourceFirstValidationError(formatIssues(result.error));
  }

  return result.data;
}

export function createRegenerationDraft(input: {
  createdBy?: string | null;
  previousVersionId: string;
  rawOutput: unknown;
  topicNodeId: string;
}): DossierVersionDraft {
  const rawOutput = assertCanPublishGeneratedContent(input.rawOutput);

  return {
    topic_node_id: input.topicNodeId,
    status: "draft",
    raw_output: rawOutput,
    edited_content: {},
    source_refs: rawOutput.source_refs,
    parent_version: input.previousVersionId,
    created_by: input.createdBy ?? null,
  };
}
