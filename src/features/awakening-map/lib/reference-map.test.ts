import { describe, expect, it } from "vitest";

import type { AwakeningAtlasGraph } from "./atlas-layout";
import {
  awakeningReferenceClusters,
  getAwakeningMapThemeGroup,
  getAwakeningReferenceCluster,
  getRelatedAwakeningReferenceClusters,
  matchAwakeningReferenceClusters,
} from "./reference-map";

const graph: AwakeningAtlasGraph = {
  edges: [],
  nodes: [
    {
      id: "topic-1",
      isProjected: true,
      nodeType: "topic",
      slug: "great-solar-flash",
      summary: "Solar event",
      title: "Great Solar Flash",
    },
    {
      id: "topic-2",
      isProjected: true,
      nodeType: "topic",
      slug: "law-of-one",
      summary: "Channeling lineage",
      title: "Law of One",
    },
    {
      id: "topic-3",
      isProjected: true,
      nodeType: "topic",
      slug: "vatican",
      summary: "Occult control center",
      title: "Vatican",
    },
  ],
};

describe("awakening reference map", () => {
  it("exposes curated theme groups", () => {
    expect(getAwakeningMapThemeGroup("galactic-federations")?.label).toBe(
      "Galactic Races & Federations"
    );
  });

  it("registers clusters with key topics and bridges", () => {
    const cluster = getAwakeningReferenceCluster("solar-flash");

    expect(awakeningReferenceClusters.length).toBeGreaterThanOrEqual(12);
    expect(cluster?.keyTopics).toContain("Great Solar Flash");
    expect(cluster?.relatedClusterIds).toContain("secret-space-program");
  });

  it("resolves related clusters for dossier bridges", () => {
    const related = getRelatedAwakeningReferenceClusters("solar-flash");

    expect(related.map((cluster) => cluster.id)).toEqual([
      "rainbow-body",
      "galactic-federation",
      "secret-space-program",
    ]);
  });

  it("matches graph nodes to curated clusters", () => {
    const matches = matchAwakeningReferenceClusters(graph);

    expect(matches.find((entry) => entry.cluster.id === "solar-flash")?.matchedNodeIds).toEqual([
      "topic-1",
    ]);
    expect(
      matches.find((entry) => entry.cluster.id === "galactic-federation")?.matchedNodeIds
    ).toEqual(["topic-2"]);
    expect(
      matches.find((entry) => entry.cluster.id === "vatican-occult-control")?.matchedNodeIds
    ).toEqual(["topic-3"]);
  });
});
