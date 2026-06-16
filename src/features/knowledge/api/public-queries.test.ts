import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  getPublishedSourceById,
  getPublishedTopicBySlug,
  listPublishedTopics,
} from "./public-queries";

function publishedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    brain_node_id: "brain-topic-1",
    node_type: "topic",
    slug: "hyperborea",
    title: "Гиперборея",
    summary: "Архивная тема",
    content: {},
    source_refs: [],
    published_at: "2026-06-15T00:00:00.000Z",
    updated_at: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("public knowledge queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists published topics from node_projection only", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [publishedRow()],
      error: null,
      count: 1,
    });
    const order = vi.fn(() => ({ range }));
    const eqNodeType = vi.fn(() => ({ order }));
    const eqStatus = vi.fn(() => ({ eq: eqNodeType }));
    const select = vi.fn(() => ({ eq: eqStatus }));
    const from = vi.fn(() => ({ select }));

    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(listPublishedTopics({ page: 1, limit: 10 })).resolves.toMatchObject({
      items: [{ title: "Гиперборея" }],
      pagination: { page: 1, limit: 10, total: 1, hasMore: false },
    });

    expect(from).toHaveBeenCalledWith("node_projection");
    expect(eqStatus).toHaveBeenCalledWith("status", "published");
    expect(eqNodeType).toHaveBeenCalledWith("node_type", "topic");
    expect(range).toHaveBeenCalledWith(0, 9);
  });

  it("loads one published topic by slug", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: publishedRow(),
      error: null,
    });
    const eqSlug = vi.fn(() => ({ maybeSingle }));
    const eqNodeType = vi.fn(() => ({ eq: eqSlug }));
    const eqStatus = vi.fn(() => ({ eq: eqNodeType }));
    const select = vi.fn(() => ({ eq: eqStatus }));
    const from = vi.fn(() => ({ select }));

    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(getPublishedTopicBySlug("hyperborea")).resolves.toMatchObject({
      slug: "hyperborea",
      title: "Гиперборея",
    });

    expect(eqSlug).toHaveBeenCalledWith("slug", "hyperborea");
  });

  it("loads sources by Brain node id when the id is not a UUID", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: publishedRow({ brain_node_id: "brain-source-1", node_type: "source" }),
      error: null,
    });
    const eqId = vi.fn(() => ({ maybeSingle }));
    const eqNodeType = vi.fn(() => ({ eq: eqId }));
    const eqStatus = vi.fn(() => ({ eq: eqNodeType }));
    const select = vi.fn(() => ({ eq: eqStatus }));
    const from = vi.fn(() => ({ select }));

    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(getPublishedSourceById("brain-source-1")).resolves.toMatchObject({
      brain_node_id: "brain-source-1",
      node_type: "source",
    });

    expect(eqId).toHaveBeenCalledWith("brain_node_id", "brain-source-1");
  });
});
