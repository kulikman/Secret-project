import { describe, expect, it } from "vitest";

import type { PublicNodeProjection } from "../api/public-queries";
import { createTopicDossier } from "./topic-dossier";

function topicProjection(overrides: Partial<PublicNodeProjection> = {}): PublicNodeProjection {
  return {
    brain_node_id: "brain-topic-1",
    content: {},
    id: "11111111-1111-4111-8111-111111111111",
    node_type: "topic",
    published_at: "2026-06-19T10:00:00.000Z",
    slug: "tesla",
    source_refs: [],
    summary: "Архивная тема",
    title: "Nikola Tesla",
    updated_at: "2026-06-19T10:00:00.000Z",
    ...overrides,
  };
}

describe("createTopicDossier()", () => {
  it("extracts dossier sections from projection content without inventing data", () => {
    const dossier = createTopicDossier(
      topicProjection({
        content: {
          counter_arguments: [
            { title: "Слабое место", body: "Недостаточно первичных документов." },
          ],
          description: "Описание темы из projection.",
          events: [{ title: "Wardenclyffe", nodeId: "event-1" }],
          facts: ["Факт из projection", { statement: "Формализованный тезис" }],
          organizations: ["Westinghouse"],
          people: [{ title: "Nikola Tesla", nodeId: "person-1" }],
          related_node_refs: [
            { nodeId: "brain-topic-2", relation: "topic", title: "Wireless Power", type: "topic" },
            { nodeId: "tail-1", relation: "mentions", title: "Неразобранный хвост" },
          ],
          timeline: [{ body: "Начало экспериментов.", title: "Патенты", year: 1891 }],
          versions: [{ title: "Инженерная версия", body: "Версия из архивного материала." }],
        },
        source_refs: [
          {
            date: "1901",
            kind: "archive",
            nodeId: "source-1",
            reliability: "B",
            supports: "Финансирование и контекст.",
            title: "Archive memo",
          },
        ],
      })
    );

    expect(dossier).toMatchObject({
      counterarguments: [{ body: "Недостаточно первичных документов.", title: "Слабое место" }],
      description: "Описание темы из projection.",
      events: [{ id: "event-1", kind: "event", title: "Wardenclyffe" }],
      facts: [{ body: "Факт из projection", title: null }, { body: "Формализованный тезис" }],
      organizations: [{ id: null, kind: "organization", title: "Westinghouse" }],
      people: [{ id: "person-1", kind: "person", title: "Nikola Tesla" }],
      relatedTopics: [{ id: "brain-topic-2", kind: "topic", title: "Wireless Power" }],
      sourceRefs: [
        {
          date: "1901",
          kind: "archive",
          nodeId: "source-1",
          reliability: "B",
          supports: "Финансирование и контекст.",
          title: "Archive memo",
        },
      ],
      timeline: [{ body: "Начало экспериментов.", date: "1891", title: "Патенты" }],
      unresolvedRefs: [{ id: "tail-1", kind: null, title: "Неразобранный хвост" }],
      versions: [{ body: "Версия из архивного материала.", title: "Инженерная версия" }],
    });
  });

  it("returns empty arrays for absent sections", () => {
    expect(createTopicDossier(topicProjection())).toMatchObject({
      counterarguments: [],
      description: null,
      events: [],
      facts: [],
      organizations: [],
      people: [],
      relatedTopics: [],
      sourceRefs: [],
      timeline: [],
      unresolvedRefs: [],
      versions: [],
    });
  });
});
