import { describe, expect, it } from "vitest";

import { createDossierDraftFromLiveResearch } from "./research-draft";

describe("createDossierDraftFromLiveResearch()", () => {
  it("creates an unpublished dossier draft from live research citations", () => {
    const draft = createDossierDraftFromLiveResearch({
      createdBy: "user-1",
      title: "Ancient Builder Race",
      topicNodeId: "seed:topic:ancient-builder-race",
      research: {
        citations: ["https://example.com/primary"],
        content: "Осторожное резюме с источниками.",
        generatedAt: "2026-06-26T00:00:00.000Z",
        model: "sonar",
        provider: "perplexity",
        searchResults: [
          {
            snippet: "Snippet",
            title: "Primary",
            url: "https://example.com/primary",
          },
        ],
      },
    });

    expect(draft).toMatchObject({
      created_by: "user-1",
      status: "draft",
      topic_node_id: "seed:topic:ancient-builder-race",
    });
    expect(draft.source_refs).toEqual([
      {
        nodeId: "https://example.com/primary",
        title: "Primary",
        url: "https://example.com/primary",
      },
    ]);
    expect(draft.raw_output).toMatchObject({
      blocks: [
        {
          kind: "live_research",
          source_refs: [
            {
              url: "https://example.com/primary",
            },
          ],
        },
      ],
    });
  });
});
