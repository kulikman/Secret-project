import { describe, expect, it } from "vitest";

import {
  assertProjectionPublishable,
  createDraftProjectionFromArchiveNode,
  nodeProjectionUpsertSchema,
} from "./projection";
import type { ArchiveNode } from "@/lib/brain/types";

const TOPIC_NODE = {
  id: "brain-topic-1",
  projectId: "secret-bureau-public-archive",
  label: "Гиперборея",
  type: "emergent",
  category: "topic",
  summary: "Архивная тема",
  status: "active",
  createdAt: "2026-06-15T00:00:00.000Z",
  updatedAt: "2026-06-15T00:00:00.000Z",
} satisfies ArchiveNode;

describe("createDraftProjectionFromArchiveNode()", () => {
  it("maps a reviewed Brain archive node into a draft App DB projection", () => {
    expect(createDraftProjectionFromArchiveNode(TOPIC_NODE)).toEqual({
      brain_node_id: "brain-topic-1",
      node_type: "topic",
      title: "Гиперборея",
      summary: "Архивная тема",
      content: {
        summary: "Архивная тема",
        facts: [],
      },
      status: "draft",
      source_refs: [],
      is_stale: false,
    });
  });

  it("does not invent projection types for unknown Brain categories", () => {
    expect(() =>
      createDraftProjectionFromArchiveNode({
        ...TOPIC_NODE,
        category: "unsupported",
      })
    ).toThrow('Cannot project unsupported Brain node category "unsupported".');
  });
});

describe("nodeProjectionUpsertSchema", () => {
  it("requires a slug for published public topic/source projections", () => {
    expect(() =>
      nodeProjectionUpsertSchema.parse({
        brain_node_id: "brain-topic-1",
        node_type: "topic",
        title: "Гиперборея",
        status: "published",
      })
    ).toThrow("Published topic/source projections require a slug.");
  });

  it("accepts a published topic with a slug", () => {
    expect(
      nodeProjectionUpsertSchema.parse({
        brain_node_id: "brain-topic-1",
        node_type: "topic",
        title: "Гиперборея",
        slug: "hyperborea",
        status: "published",
      })
    ).toMatchObject({
      node_type: "topic",
      slug: "hyperborea",
      status: "published",
    });
  });
});

describe("assertProjectionPublishable()", () => {
  it("blocks published claims without source refs", () => {
    expect(() =>
      assertProjectionPublishable({
        brain_node_id: "brain-claim-1",
        node_type: "claim",
        title: "Claim",
        status: "published",
        content: {},
        source_refs: [],
        is_stale: false,
      })
    ).toThrow("Published claim projections require at least one source reference.");
  });
});
