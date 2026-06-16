import { describe, expect, it } from "vitest";

import {
  SourceFirstValidationError,
  assertCanPublishGeneratedContent,
  createRegenerationDraft,
  getSourceFirstIssues,
} from "./source-first";

const SOURCE_REF = {
  nodeId: "source-node-1",
  title: "Архивный источник",
};

const VALID_DOCUMENT = {
  title: "Досье",
  source_refs: [SOURCE_REF],
  blocks: [
    {
      kind: "summary",
      title: "Кратко",
      content: "Содержательный блок",
      source_refs: [SOURCE_REF],
    },
  ],
};

describe("source-first validators", () => {
  it("accepts generated documents when every block has source_refs", () => {
    expect(assertCanPublishGeneratedContent(VALID_DOCUMENT)).toMatchObject({
      title: "Досье",
      blocks: [{ kind: "summary" }],
    });
  });

  it("blocks publishing when any generated block has no source_refs", () => {
    expect(() =>
      assertCanPublishGeneratedContent({
        ...VALID_DOCUMENT,
        blocks: [{ kind: "summary", content: "Нет источников", source_refs: [] }],
      })
    ).toThrow(SourceFirstValidationError);
  });

  it("returns readable source-first issues for review UI", () => {
    expect(
      getSourceFirstIssues({
        title: "Черновик",
        source_refs: [],
        blocks: [],
      })
    ).toEqual([
      "blocks: Generated document requires at least one block.",
      "source_refs: Generated document requires source_refs.",
    ]);
  });

  it("creates regeneration drafts as a new version linked to the previous one", () => {
    expect(
      createRegenerationDraft({
        previousVersionId: "dossier-v1",
        topicNodeId: "topic-node-1",
        rawOutput: VALID_DOCUMENT,
        createdBy: "user-1",
      })
    ).toMatchObject({
      topic_node_id: "topic-node-1",
      status: "draft",
      parent_version: "dossier-v1",
      created_by: "user-1",
      source_refs: [SOURCE_REF],
    });
  });
});
