import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  getPublishedMapNeighbors,
  getPublishedMapNode,
  listPublishedMapGraph,
  searchPublishedMapNodes,
} from "./map-queries";

function projectionRow(overrides: Record<string, unknown> = {}) {
  return {
    brain_node_id: "brain-topic-1",
    content: {},
    id: "11111111-1111-4111-8111-111111111111",
    node_type: "topic",
    published_at: "2026-06-15T00:00:00.000Z",
    slug: "tesla",
    source_refs: [],
    summary: "Архивная тема",
    title: "Nikola Tesla",
    updated_at: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

function createQuery(response: { limit?: unknown; maybeSingle?: unknown; range?: unknown }) {
  const query = {
    eq: vi.fn(),
    in: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.limit.mockResolvedValue(response.limit);
  query.maybeSingle.mockResolvedValue(response.maybeSingle);
  query.range.mockResolvedValue(response.range);

  return query;
}

describe("published map graph queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds graph nodes and edges from published projection refs", async () => {
    const topicRow = projectionRow({
      content: {
        related_node_refs: [
          { nodeId: "brain-person-1", relation: "researched_by", reason: "Ключевая фигура" },
          { nodeId: "missing-node", relation: "mentions", title: "Неразобранный хвост" },
        ],
      },
      source_refs: [{ nodeId: "brain-source-1", title: "Archive source" }],
    });
    const personRow = projectionRow({
      brain_node_id: "brain-person-1",
      id: "22222222-2222-4222-8222-222222222222",
      node_type: "person",
      slug: null,
      title: "Исследователь",
    });
    const sourceRow = projectionRow({
      brain_node_id: "brain-source-1",
      id: "33333333-3333-4333-8333-333333333333",
      node_type: "source",
      slug: "archive-source",
      title: "Archive source",
    });
    const query = createQuery({
      range: {
        data: [topicRow, personRow, sourceRow],
        error: null,
      },
    });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(listPublishedMapGraph({ limit: 25 })).resolves.toMatchObject({
      edges: expect.arrayContaining([
        expect.objectContaining({
          kind: "related",
          relation: "researched_by",
          resolved: true,
          sourceId: "brain-topic-1",
          targetId: "brain-person-1",
        }),
        expect.objectContaining({
          kind: "source",
          relation: "source",
          resolved: true,
          sourceId: "brain-topic-1",
          targetId: "brain-source-1",
        }),
        expect.objectContaining({
          kind: "related",
          relation: "mentions",
          resolved: false,
          targetId: "missing-node",
        }),
      ]),
      nodes: expect.arrayContaining([
        expect.objectContaining({ id: "brain-topic-1", isProjected: true }),
        expect.objectContaining({ id: "brain-person-1", isProjected: true }),
        expect.objectContaining({ id: "brain-source-1", isProjected: true }),
        expect.objectContaining({
          id: "missing-node",
          isProjected: false,
          nodeType: "reference",
          title: "Неразобранный хвост",
        }),
      ]),
    });

    expect(from).toHaveBeenCalledWith("node_projection");
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.range).toHaveBeenCalledWith(0, 24);
  });

  it("applies query text and node type filters", async () => {
    const query = createQuery({
      range: {
        data: [],
        error: null,
      },
    });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValueOnce({ from });

    await listPublishedMapGraph({
      limit: 10,
      nodeTypes: ["topic"],
      q: "tesla,grid",
    });

    expect(query.in).toHaveBeenCalledWith("node_type", ["topic"]);
    expect(query.or).toHaveBeenCalledWith(
      "title.ilike.%tesla\\,grid%,summary.ilike.%tesla\\,grid%,slug.ilike.%tesla\\,grid%"
    );
    expect(query.range).toHaveBeenCalledWith(0, 9);
  });

  it("loads a map node by projection id and falls back to brain node id for UUID values", async () => {
    const firstQuery = createQuery({
      maybeSingle: {
        data: null,
        error: null,
      },
    });
    const secondQuery = createQuery({
      maybeSingle: {
        data: projectionRow({ brain_node_id: "11111111-1111-4111-8111-111111111111" }),
        error: null,
      },
    });
    const from = vi.fn().mockReturnValueOnce(firstQuery).mockReturnValueOnce(secondQuery);
    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(
      getPublishedMapNode({ id: "11111111-1111-4111-8111-111111111111" })
    ).resolves.toMatchObject({
      brainNodeId: "11111111-1111-4111-8111-111111111111",
      isProjected: true,
    });

    expect(firstQuery.eq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
    expect(secondQuery.eq).toHaveBeenCalledWith(
      "brain_node_id",
      "11111111-1111-4111-8111-111111111111"
    );
  });

  it("returns a direct-neighbor graph for one root node", async () => {
    const rootRow = projectionRow({
      content: {
        related_node_refs: [{ nodeId: "brain-person-1", relation: "connected_to" }],
      },
      source_refs: [{ nodeId: "missing-source", title: "Pending source" }],
    });
    const personRow = projectionRow({
      brain_node_id: "brain-person-1",
      id: "22222222-2222-4222-8222-222222222222",
      node_type: "person",
      title: "Связанная персона",
    });
    const rootQuery = createQuery({
      maybeSingle: {
        data: rootRow,
        error: null,
      },
    });
    const identifiersQuery = createQuery({
      limit: {
        data: [personRow],
        error: null,
      },
    });
    mocks.createClient
      .mockResolvedValueOnce({ from: vi.fn(() => rootQuery) })
      .mockResolvedValueOnce({ from: vi.fn(() => identifiersQuery) });

    await expect(
      getPublishedMapNeighbors({ id: "brain-topic-1", limit: 10 })
    ).resolves.toMatchObject({
      edges: expect.arrayContaining([
        expect.objectContaining({
          relation: "connected_to",
          sourceId: "brain-topic-1",
          targetId: "brain-person-1",
        }),
        expect.objectContaining({
          kind: "source",
          sourceId: "brain-topic-1",
          targetId: "missing-source",
        }),
      ]),
      nodes: expect.arrayContaining([
        expect.objectContaining({ id: "brain-topic-1", isProjected: true }),
        expect.objectContaining({ id: "brain-person-1", isProjected: true }),
        expect.objectContaining({ id: "missing-source", isProjected: false }),
      ]),
    });

    expect(identifiersQuery.in).toHaveBeenCalledWith("brain_node_id", [
      "brain-person-1",
      "missing-source",
    ]);
    expect(identifiersQuery.limit).toHaveBeenCalledWith(2);
  });

  it("searches projected map nodes without reference placeholders", async () => {
    const query = createQuery({
      range: {
        data: [projectionRow()],
        error: null,
      },
    });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValueOnce({ from });

    await expect(searchPublishedMapNodes({ limit: 5, q: "tesla" })).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: "brain-topic-1",
          isProjected: true,
          title: "Nikola Tesla",
        }),
      ],
    });

    expect(query.or).toHaveBeenCalledWith(
      "title.ilike.%tesla%,summary.ilike.%tesla%,slug.ilike.%tesla%"
    );
    expect(query.range).toHaveBeenCalledWith(0, 4);
  });
});
