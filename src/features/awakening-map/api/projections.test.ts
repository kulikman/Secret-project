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

import { listAwakeningMapProjections, updateAwakeningMapProjection } from "./projections";

const reviewerId = "22222222-2222-4222-8222-222222222222";
const projectionId = "11111111-1111-4111-8111-111111111111";

const projectionRow = {
  brain_node_id: "seed:topic:awakening-map",
  created_at: "2026-06-21T08:00:00.000Z",
  id: projectionId,
  is_stale: false,
  node_type: "topic",
  published_at: null,
  slug: "awakening-map",
  source_refs: [{ nodeId: "source-1", title: "Источник" }],
  status: "review",
  summary: "Черновое описание карты",
  title: "Карта пробуждения",
  updated_at: "2026-06-21T08:00:00.000Z",
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
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.limit.mockResolvedValue(responses.limit);
  query.maybeSingle.mockResolvedValue(responses.maybeSingle);
  query.single.mockResolvedValue(responses.single);

  return query;
}

describe("awakening map projection admin backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ role: "editor", userId: reviewerId });
  });

  it("lists map projections for reviewers", async () => {
    const projectionQuery = createQuery({
      limit: { data: [projectionRow], error: null },
    });
    const from = vi.fn().mockReturnValueOnce(projectionQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(listAwakeningMapProjections({ limit: 10, status: "review" })).resolves.toEqual([
      expect.objectContaining({
        brainNodeId: "seed:topic:awakening-map",
        id: projectionId,
        status: "review",
        title: "Карта пробуждения",
      }),
    ]);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith([
      "super_admin",
      "admin",
      "editor",
      "curator",
    ]);
    expect(from).toHaveBeenCalledWith("node_projection");
    expect(projectionQuery.eq).toHaveBeenCalledWith("status", "review");
  });

  it("updates editable projection fields and writes audit", async () => {
    const updatedRow = {
      ...projectionRow,
      published_at: "2026-06-21T09:00:00.000Z",
      status: "published",
      summary: "Публичное описание карты",
    };
    const readQuery = createQuery({
      maybeSingle: { data: projectionRow, error: null },
    });
    const updateQuery = createQuery({
      single: { data: updatedRow, error: null },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery).mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningMapProjection({
        projectionId,
        slug: "awakening-map",
        sourceRefs: [{ nodeId: "source-1", title: "Источник" }],
        status: "published",
        summary: "Публичное описание карты",
        title: "Карта пробуждения",
      })
    ).resolves.toMatchObject({
      publishedAt: "2026-06-21T09:00:00.000Z",
      status: "published",
      summary: "Публичное описание карты",
    });

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "awakening-map",
        status: "published",
        summary: "Публичное описание карты",
        title: "Карта пробуждения",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_projection_updated",
        resource: `awakening-map-projection:${projectionId}`,
        userId: reviewerId,
      })
    );
  });

  it("blocks publishing topic/source projections without a slug", async () => {
    const readQuery = createQuery({
      maybeSingle: { data: projectionRow, error: null },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningMapProjection({
        projectionId,
        slug: null,
        sourceRefs: [{ nodeId: "source-1", title: "Источник" }],
        status: "published",
        title: "Карта пробуждения",
      })
    ).rejects.toThrow("Published topic/source projections require a slug.");

    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("blocks publishing claim projections without source refs", async () => {
    const readQuery = createQuery({
      maybeSingle: {
        data: {
          ...projectionRow,
          node_type: "claim",
          slug: null,
          source_refs: [],
        },
        error: null,
      },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningMapProjection({
        projectionId,
        slug: null,
        sourceRefs: [],
        status: "published",
        title: "Source-first проверка",
      })
    ).rejects.toThrow("Published claim projections require at least one source reference.");

    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("archives projections without requiring a slug", async () => {
    const archivedRow = {
      ...projectionRow,
      published_at: null,
      slug: null,
      status: "archived",
    };
    const readQuery = createQuery({
      maybeSingle: { data: projectionRow, error: null },
    });
    const updateQuery = createQuery({
      single: { data: archivedRow, error: null },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery).mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningMapProjection({
        projectionId,
        slug: null,
        sourceRefs: [],
        status: "archived",
        title: "Карта пробуждения",
      })
    ).resolves.toMatchObject({
      slug: null,
      status: "archived",
    });

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: null,
        status: "archived",
      })
    );
  });
});
