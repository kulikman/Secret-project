import { z } from "zod";

import { sourceRefSchema, type SourceRef } from "@/lib/source-refs";
import type { Json, TablesInsert } from "@/types/database";

const liveResearchSearchResultSchema = z.object({
  snippet: z.string().nullable(),
  title: z.string().nullable(),
  url: z.string().url(),
});

export const liveResearchDraftInputSchema = z.object({
  citations: z.array(z.string().url()).default([]),
  content: z.string().trim().min(1),
  generatedAt: z.string().datetime(),
  model: z.string().trim().min(1),
  provider: z.literal("perplexity"),
  searchResults: z.array(liveResearchSearchResultSchema).default([]),
});

export type LiveResearchDraftInput = z.input<typeof liveResearchDraftInputSchema>;

function createSourceRefs(input: z.infer<typeof liveResearchDraftInputSchema>): SourceRef[] {
  const byUrl = new Map<string, SourceRef>();

  for (const result of input.searchResults) {
    byUrl.set(result.url, {
      nodeId: result.url,
      title: result.title ?? result.url,
      url: result.url,
    });
  }

  for (const url of input.citations) {
    if (!byUrl.has(url)) {
      byUrl.set(url, { nodeId: url, title: url, url });
    }
  }

  return Array.from(byUrl.values()).map((sourceRef) => sourceRefSchema.parse(sourceRef));
}

export function createDossierDraftFromLiveResearch(input: {
  createdBy: string;
  research: LiveResearchDraftInput;
  title: string;
  topicNodeId: string;
}): TablesInsert<"dossiers"> {
  const research = liveResearchDraftInputSchema.parse(input.research);
  const sourceRefs = createSourceRefs(research);
  const rawOutput = {
    blocks: [
      {
        content: research.content,
        kind: "live_research",
        source_refs: sourceRefs,
        title: `Live research: ${input.title}`,
      },
    ],
    source_refs: sourceRefs,
    title: input.title,
    metadata: {
      generatedAt: research.generatedAt,
      model: research.model,
      provider: research.provider,
    },
  };

  return {
    created_by: input.createdBy,
    edited_content: {},
    raw_output: rawOutput as Json,
    source_refs: sourceRefs as Json,
    status: "draft",
    topic_node_id: input.topicNodeId,
  };
}
