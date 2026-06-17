import { describe, expect, it } from "vitest";

import {
  awakeningTopicSuggestionStatusSchema,
  createAwakeningTopicReview,
  createAwakeningTopicSuggestionDraft,
} from "./topic-suggestions";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const PROJECTION_ID = "00000000-0000-4000-8000-000000000002";

describe("createAwakeningTopicSuggestionDraft()", () => {
  it("keeps the moderated status vocabulary explicit", () => {
    expect(awakeningTopicSuggestionStatusSchema.parse("pending")).toBe("pending");
    expect(() => awakeningTopicSuggestionStatusSchema.parse("published")).toThrow();
  });

  it("creates a pending topic suggestion that still requires admin verification", () => {
    expect(
      createAwakeningTopicSuggestionDraft(
        {
          title: "Карта пробуждения",
          summary: "Связи тем, источников и соседних смыслов для публичной карты.",
          related_node_refs: [{ nodeId: "brain-topic-1", relation: "neighbor" }],
          source_refs: [{ nodeId: "source-1", title: "Архивный источник" }],
        },
        USER_ID
      )
    ).toEqual({
      title: "Карта пробуждения",
      summary: "Связи тем, источников и соседних смыслов для публичной карты.",
      related_node_refs: [{ nodeId: "brain-topic-1", relation: "neighbor" }],
      source_refs: [{ nodeId: "source-1", title: "Архивный источник" }],
      status: "pending",
      suggested_by: USER_ID,
    });
  });

  it("rejects empty ideas without summary, description, or source refs", () => {
    expect(() =>
      createAwakeningTopicSuggestionDraft({
        title: "Тема без контекста",
      })
    ).toThrow("Add a summary, description, or source reference before suggesting a topic.");
  });

  it("keeps optional public slugs lowercase and predictable", () => {
    expect(() =>
      createAwakeningTopicSuggestionDraft({
        title: "Гиперборея",
        slug: "HyperBorea",
        summary: "Тема с некорректным публичным slug.",
      })
    ).toThrow("Slug must be lowercase kebab-case.");
  });
});

describe("createAwakeningTopicReview()", () => {
  it("requires merged suggestions to point at the promoted projection row", () => {
    expect(() =>
      createAwakeningTopicReview({
        status: "merged",
        reviewedBy: USER_ID,
        decisionReason: "Тема объединена с существующим узлом.",
      })
    ).toThrow("Merged suggestions must reference the promoted projection row.");
  });

  it("creates an auditable review payload for admin approval", () => {
    expect(
      createAwakeningTopicReview({
        status: "merged",
        reviewedBy: USER_ID,
        decisionReason: "Тема проверена и добавлена в карту.",
        promotedNodeProjectionId: PROJECTION_ID,
        reviewedAt: "2026-06-17T10:00:00.000Z",
      })
    ).toEqual({
      status: "merged",
      reviewed_by: USER_ID,
      reviewed_at: "2026-06-17T10:00:00.000Z",
      decision_reason: "Тема проверена и добавлена в карту.",
      promoted_node_projection_id: PROJECTION_ID,
    });
  });
});
