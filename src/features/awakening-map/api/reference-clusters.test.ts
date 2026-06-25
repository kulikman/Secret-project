import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
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

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import {
  listAdminAwakeningReferenceClusters,
  listPublishedAwakeningReferenceClusters,
  updateAwakeningReferenceCluster,
} from "./reference-clusters";

const reviewerId = "22222222-2222-4222-8222-222222222222";

const clusterRow = {
  bounds: { height: 0.18, width: 0.26, x: 0.34, y: 0.31 },
  created_at: "2026-06-25T03:00:00.000Z",
  group_id: "metaphysics",
  id: "great-awakening-core",
  key_topics: ["Great Awakening", "Optimal Timeline Reality"],
  keywords: ["great awakening", "optimal timeline"],
  label: "Great Awakening Core",
  matcher: {
    slugExact: ["great-awakening"],
    titleIncludes: ["great awakening"],
  },
  related_cluster_ids: ["solar-flash"],
  status: "published",
  summary: "Центральный нарратив карты.",
  updated_at: "2026-06-25T03:00:00.000Z",
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

describe("awakening reference cluster registry backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ role: "editor", userId: reviewerId });
  });

  it("lists published DB clusters for the public map", async () => {
    const query = createQuery({
      limit: { data: [clusterRow], error: null },
    });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

    await expect(listPublishedAwakeningReferenceClusters()).resolves.toEqual([
      expect.objectContaining({
        id: "great-awakening-core",
        label: "Great Awakening Core",
      }),
    ]);

    expect(query.eq).toHaveBeenCalledWith("status", "published");
  });

  it("falls back to static clusters when the DB table is unavailable", async () => {
    const query = createQuery({
      limit: {
        data: null,
        error: { message: "Could not find table awakening_reference_clusters" },
      },
    });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

    await expect(listPublishedAwakeningReferenceClusters()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "great-awakening-core",
        }),
      ])
    );
  });

  it("lists admin clusters after RBAC", async () => {
    const query = createQuery({
      limit: { data: [clusterRow], error: null },
    });
    mocks.createAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    await expect(listAdminAwakeningReferenceClusters({ limit: 10 })).resolves.toEqual([
      expect.objectContaining({
        id: "great-awakening-core",
        status: "published",
      }),
    ]);

    expect(mocks.requireAdminRole).toHaveBeenCalled();
  });

  it("updates clusters and writes audit", async () => {
    const query = createQuery({
      maybeSingle: { data: clusterRow, error: null },
      single: {
        data: {
          ...clusterRow,
          label: "Great Awakening Core Updated",
          status: "review",
        },
        error: null,
      },
    });
    const from = vi.fn().mockReturnValue(query);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      updateAwakeningReferenceCluster({
        bounds: clusterRow.bounds,
        clusterId: clusterRow.id,
        groupId: "metaphysics",
        keyTopics: clusterRow.key_topics,
        keywords: clusterRow.keywords,
        label: "Great Awakening Core Updated",
        matcher: clusterRow.matcher,
        relatedClusterIds: clusterRow.related_cluster_ids,
        status: "review",
        summary: clusterRow.summary,
      })
    ).resolves.toMatchObject({
      label: "Great Awakening Core Updated",
      status: "review",
    });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Great Awakening Core Updated",
        status: "review",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_reference_cluster_updated",
        resource: "awakening-reference-cluster:great-awakening-core",
        userId: reviewerId,
      })
    );
  });
});
