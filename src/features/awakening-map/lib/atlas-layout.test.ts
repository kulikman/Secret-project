import { describe, expect, it } from "vitest";

import {
  createAwakeningAtlasLayout,
  getDefaultAtlasNodeId,
  type AwakeningAtlasGraph,
} from "./atlas-layout";

const graph: AwakeningAtlasGraph = {
  edges: [
    {
      id: "topic-person",
      kind: "related",
      reason: "Ключевая фигура",
      relation: "related_to",
      resolved: true,
      sourceId: "topic-1",
      targetId: "person-1",
    },
    {
      id: "topic-tail",
      kind: "related",
      reason: null,
      relation: "mentions",
      resolved: false,
      sourceId: "topic-1",
      targetId: "tail-1",
    },
  ],
  nodes: [
    {
      id: "tail-1",
      isProjected: false,
      nodeType: "reference",
      summary: null,
      title: "Неразобранный хвост",
    },
    {
      id: "person-1",
      isProjected: true,
      nodeType: "person",
      summary: null,
      title: "Исследователь",
    },
    {
      id: "topic-1",
      isProjected: true,
      nodeType: "topic",
      summary: "Центральная тема",
      title: "Карта пробуждения",
    },
  ],
};

describe("awakening atlas layout", () => {
  it("prefers projected topic nodes as the default focus", () => {
    expect(getDefaultAtlasNodeId(graph)).toBe("topic-1");
  });

  it("places selected node in the center and unresolved refs on the outer orbit", () => {
    const layout = createAwakeningAtlasLayout(graph, "topic-1", { height: 740, width: 1120 });
    const selected = layout.nodes.find((node) => node.id === "topic-1");
    const tail = layout.nodes.find((node) => node.id === "tail-1");

    expect(selected).toMatchObject({
      isSelected: true,
      orbit: 0,
      x: 560,
      y: 370,
    });
    expect(tail).toMatchObject({
      isProjected: false,
      isNeighbor: true,
    });
  });

  it("only returns edges with visible layout endpoints", () => {
    const layout = createAwakeningAtlasLayout(
      {
        edges: [
          ...graph.edges,
          {
            id: "missing",
            kind: "related",
            reason: null,
            relation: "mentions",
            resolved: false,
            sourceId: "topic-1",
            targetId: "missing-node",
          },
        ],
        nodes: graph.nodes,
      },
      "topic-1"
    );

    expect(layout.edges.map((edge) => edge.id)).toEqual(["topic-person", "topic-tail"]);
  });
});
