import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  requireAdminRole: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  AWAKENING_MAP_REVIEW_ROLES: ["super_admin", "admin", "editor", "curator"],
  requireAdminRole: mocks.requireAdminRole,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import {
  createAwakeningGraphEdge,
  listAwakeningGraphEdges,
  updateAwakeningGraphEdge,
} from "./graph-edges";

const reviewerId = "22222222-2222-4222-8222-222222222222";
const edgeId = "44444444-4444-4444-8444-444444444444";
const fromProjectionId = "11111111-1111-4111-8111-111111111111";
const toProjectionId = "33333333-3333-4333-8333-333333333333";

const edgeRow = {
  created_at: "2026-06-21T08:00:00.000Z",
  from_node_id: fromProjectionId,
  id: edgeId,
  relation_type: "related_to",
  source_refs: [{ nodeId: "source-1", title: "Источник" }],
  status: "review",
  strength: "0.65",
  to_node_id: toProjectionId,
  updated_at: "2026-06-21T08:00:00.000Z",
};

const fromNodeRow = {
  brain_node_id: "brain-topic-1",
  id: fromProjectionId,
  node_type: "topic",
  slug: "topic-one",
  status: "published",
  title: "Тема один",
};

const toNodeRow = {
  brain_node_id: "brain-topic-2",
  id: toProjectionId,
  node_type: "topic",
  slug: "topic-two",
  status: "published",
  title: "Тема два",
};

function createQuery(
  response:
    | unknown
    | {
        limit?: unknown;
        maybeSingle?: unknown;
        single?: unknown;
      }
) {
  const responses =
    response &&
    typeof response === "object" &&
    ("limit" in response || "maybeSingle" in response || "single" in response)
      ? (response as { limit?: unknown; maybeSingle?: unknown; single?: unknown })
      : {
          limit: response,
          maybeSingle: response,
          single: response,
        };

  const query = {
    eq: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.limit.mockResolvedValue(responses.limit);
  query.maybeSingle.mockResolvedValue(responses.maybeSingle);
  query.single.mockResolvedValue(responses.single);

  return query;
}

describe("awakening graph edge admin backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ role: "editor", userId: reviewerId });
  });

  it("lists graph edges with endpoint projection labels", async () => {
    const edgeQuery = createQuery({
      limit: { data: [edgeRow], error: null },
    });
    const nodeQuery = createQuery({
      limit: { data: [fromNodeRow, toNodeRow], error: null },
    });
    const from = vi.fn().mockReturnValueOnce(edgeQuery).mockReturnValueOnce(nodeQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(listAwakeningGraphEdges({ limit: 10, status: "review" })).resolves.toEqual([
      expect.objectContaining({
        fromNode: expect.objectContaining({ title: "Тема один" }),
        relationType: "related_to",
        status: "review",
        strength: 0.65,
        toNode: expect.objectContaining({ title: "Тема два" }),
      }),
    ]);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith([
      "super_admin",
      "admin",
      "editor",
      "curator",
    ]);
    expect(from).toHaveBeenNthCalledWith(1, "graph_edges");
    expect(from).toHaveBeenNthCalledWith(2, "node_projection");
    expect(edgeQuery.eq).toHaveBeenCalledWith("status", "review");
    expect(nodeQuery.in).toHaveBeenCalledWith("id", [fromProjectionId, toProjectionId]);
  });

  it("returns an empty list when graph_edges is not migrated yet", async () => {
    const edgeQuery = createQuery({
      limit: {
        data: null,
        error: {
          code: "42P01",
          message: 'relation "public.graph_edges" does not exist',
        },
      },
    });
    const from = vi.fn().mockReturnValueOnce(edgeQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(listAwakeningGraphEdges()).resolves.toEqual([]);

    expect(from).toHaveBeenCalledTimes(1);
  });

  it("creates graph edges after validating endpoint projections and writes audit", async () => {
    const nodeQuery = createQuery({
      limit: { data: [fromNodeRow, toNodeRow], error: null },
    });
    const insertQuery = createQuery({
      single: { data: edgeRow, error: null },
    });
    const from = vi.fn().mockReturnValueOnce(nodeQuery).mockReturnValueOnce(insertQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      createAwakeningGraphEdge({
        fromNodeProjectionId: fromProjectionId,
        relationType: "related_to",
        sourceRefs: [{ nodeId: "source-1", title: "Источник" }],
        status: "review",
        strength: 0.65,
        toNodeProjectionId: toProjectionId,
      })
    ).resolves.toMatchObject({
      id: edgeId,
      relationType: "related_to",
    });

    expect(from).toHaveBeenNthCalledWith(1, "node_projection");
    expect(from).toHaveBeenNthCalledWith(2, "graph_edges");
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_node_id: fromProjectionId,
        relation_type: "related_to",
        status: "review",
        to_node_id: toProjectionId,
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_graph_edge_created",
        resource: `awakening-graph-edge:${edgeId}`,
        userId: reviewerId,
      })
    );
  });

  it("blocks publishing an edge when either endpoint is not published", async () => {
    const nodeQuery = createQuery({
      limit: {
        data: [fromNodeRow, { ...toNodeRow, status: "review" }],
        error: null,
      },
    });
    const from = vi.fn().mockReturnValueOnce(nodeQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      createAwakeningGraphEdge({
        fromNodeProjectionId: fromProjectionId,
        relationType: "related_to",
        status: "published",
        strength: 1,
        toNodeProjectionId: toProjectionId,
      })
    ).rejects.toThrow("Only edges between published projections can be published.");

    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("updates graph edge relation, status, strength, source refs and writes audit", async () => {
    const updatedEdgeRow = {
      ...edgeRow,
      relation_type: "contradicts",
      status: "published",
      strength: 0.9,
    };
    const readQuery = createQuery({
      maybeSingle: { data: edgeRow, error: null },
    });
    const nodeQuery = createQuery({
      limit: { data: [fromNodeRow, toNodeRow], error: null },
    });
    const updateQuery = createQuery({
      single: { data: updatedEdgeRow, error: null },
    });
    const from = vi
      .fn()
      .mockReturnValueOnce(readQuery)
      .mockReturnValueOnce(nodeQuery)
      .mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningGraphEdge({
        edgeId,
        relationType: "contradicts",
        sourceRefs: [{ nodeId: "source-1", title: "Источник" }],
        status: "published",
        strength: 0.9,
      })
    ).resolves.toMatchObject({
      relationType: "contradicts",
      status: "published",
      strength: 0.9,
    });

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        relation_type: "contradicts",
        status: "published",
        strength: 0.9,
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_graph_edge_updated",
        resource: `awakening-graph-edge:${edgeId}`,
        userId: reviewerId,
      })
    );
  });
});
