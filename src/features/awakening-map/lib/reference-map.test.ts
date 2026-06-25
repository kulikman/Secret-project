import { describe, expect, it } from "vitest";

import type { AwakeningAtlasGraph } from "./atlas-layout";
import {
  awakeningReferenceClusters,
  awakeningReferenceClusterSchema,
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
    {
      id: "topic-4",
      isProjected: true,
      nodeType: "topic",
      slug: "great-awakening",
      summary: "Central awakening narrative",
      title: "Great Awakening",
    },
    {
      id: "topic-5",
      isProjected: true,
      nodeType: "topic",
      slug: "inner-earth-civilizations",
      summary: "Hidden underground civilizations",
      title: "Inner Earth Civilizations",
    },
    {
      id: "topic-6",
      isProjected: true,
      nodeType: "topic",
      slug: "crystals",
      summary: "Energy body practices",
      title: "Crystals and Cymatics",
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

    expect(awakeningReferenceClusters.length).toBeGreaterThanOrEqual(20);
    expect(cluster?.keyTopics).toContain("Great Solar Flash");
    expect(cluster?.relatedClusterIds).toContain("secret-space-program");
  });

  it("keeps cluster schema, ids, and related bridges valid", () => {
    const clusterIds = new Set(awakeningReferenceClusters.map((cluster) => cluster.id));

    expect(clusterIds.size).toBe(awakeningReferenceClusters.length);

    for (const cluster of awakeningReferenceClusters) {
      expect(() => awakeningReferenceClusterSchema.parse(cluster)).not.toThrow();
      expect(cluster.bounds.x + cluster.bounds.width).toBeLessThanOrEqual(1);
      expect(cluster.bounds.y + cluster.bounds.height).toBeLessThanOrEqual(1);

      for (const relatedClusterId of cluster.relatedClusterIds) {
        expect(clusterIds.has(relatedClusterId)).toBe(true);
      }
    }
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
    expect(
      matches.find((entry) => entry.cluster.id === "great-awakening-core")?.matchedNodeIds
    ).toEqual(["topic-4"]);
    expect(
      matches.find((entry) => entry.cluster.id === "inner-earth-civilizations")?.matchedNodeIds
    ).toEqual(["topic-5"]);
    expect(
      matches.find((entry) => entry.cluster.id === "crystals-cymatics")?.matchedNodeIds
    ).toEqual(["topic-6"]);
  });
});
