import { describe, expect, it } from "vitest";

import {
  createPresentationCacheKey,
  createPresentationJobInputs,
  normalizePresentationGenerationPlan,
} from "./presentation-plan";

describe("normalizePresentationGenerationPlan()", () => {
  it("defaults to a 20-page Claude text plan with a pending visual provider", () => {
    expect(
      normalizePresentationGenerationPlan({
        topicNodeId: "brain-topic-1",
        title: "Карта пробуждения",
      })
    ).toMatchObject({
      topicNodeId: "brain-topic-1",
      title: "Карта пробуждения",
      pageCount: 20,
      textProvider: "anthropic_claude",
      visualProvider: "visual_ai_pending",
    });
  });

  it("accepts the requested 20-25 page range", () => {
    expect(
      normalizePresentationGenerationPlan({
        topicNodeId: "brain-topic-1",
        title: "20 pages",
        pageCount: 20,
      }).pageCount
    ).toBe(20);

    expect(
      normalizePresentationGenerationPlan({
        topicNodeId: "brain-topic-1",
        title: "25 pages",
        pageCount: 25,
      }).pageCount
    ).toBe(25);
  });

  it("rejects presentations outside 20-25 pages", () => {
    expect(() =>
      normalizePresentationGenerationPlan({
        topicNodeId: "brain-topic-1",
        title: "Too short",
        pageCount: 19,
      })
    ).toThrow();

    expect(() =>
      normalizePresentationGenerationPlan({
        topicNodeId: "brain-topic-1",
        title: "Too long",
        pageCount: 26,
      })
    ).toThrow();
  });
});

describe("createPresentationCacheKey()", () => {
  it("creates stable keys so existing PDFs can be reused instead of regenerated", () => {
    const input = {
      topicNodeId: "brain-topic-1",
      title: "Карта пробуждения",
      pageCount: 22,
      promptTemplateVersion: 3,
      textProvider: "anthropic_claude",
      visualProvider: "visual_ai_pending",
    };

    expect(createPresentationCacheKey(input)).toBe(createPresentationCacheKey(input));
    expect(createPresentationCacheKey(input)).toContain("presentation_pdf:brain-topic-1");
    expect(createPresentationCacheKey(input)).toContain("prompt-v3");
    expect(createPresentationCacheKey(input)).toContain("pages-22");
  });

  it("changes the key when provider strategy changes", () => {
    const baseInput = {
      topicNodeId: "brain-topic-1",
      title: "Карта пробуждения",
    };

    expect(createPresentationCacheKey(baseInput)).not.toBe(
      createPresentationCacheKey({
        ...baseInput,
        visualProvider: "design_ai_v2",
      })
    );
  });
});

describe("createPresentationJobInputs()", () => {
  it("splits text and visual generation into separate provider jobs", () => {
    expect(
      createPresentationJobInputs({
        topicNodeId: "brain-topic-1",
        title: "Карта пробуждения",
        pageCount: 24,
        promptTemplateVersion: 2,
        textProvider: "anthropic_claude",
        textModel: "claude-configured-in-env",
        visualProvider: "visual_ai_pending",
      })
    ).toEqual([
      {
        job_type: "presentation_text_generation",
        topic_node_id: "brain-topic-1",
        provider: "anthropic_claude",
        model: "claude-configured-in-env",
        input: {
          cache_key:
            "presentation_pdf:brain-topic-1:prompt-v2:pages-24:text-anthropic_claude:visual-visual_ai_pending",
          page_count: 24,
          prompt_template_version: 2,
          title: "Карта пробуждения",
        },
      },
      {
        job_type: "presentation_visual_generation",
        topic_node_id: "brain-topic-1",
        provider: "visual_ai_pending",
        model: null,
        input: {
          cache_key:
            "presentation_pdf:brain-topic-1:prompt-v2:pages-24:text-anthropic_claude:visual-visual_ai_pending",
          page_count: 24,
          prompt_template_version: 2,
          title: "Карта пробуждения",
        },
      },
    ]);
  });
});
