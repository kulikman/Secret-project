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

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import {
  approveAwakeningTopicSuggestion,
  getAwakeningTopicSuggestion,
  listAwakeningTopicSuggestions,
  mergeAwakeningTopicSuggestion,
  rejectAwakeningTopicSuggestion,
} from "./moderation";

const suggestionId = "11111111-1111-4111-8111-111111111111";
const reviewerId = "22222222-2222-4222-8222-222222222222";
const projectionId = "33333333-3333-4333-8333-333333333333";

const suggestionRow = {
  created_at: "2026-06-19T08:00:00.000Z",
  decision_reason: null,
  description: "Развернутая заявка на добавление темы в карту пробуждения.",
  id: suggestionId,
  promoted_node_projection_id: null,
  related_node_refs: [{ nodeId: "brain-topic-1", relation: "related_to" }],
  reviewed_at: null,
  reviewed_by: null,
  slug: "awakening-map",
  source_refs: [{ nodeId: "source-1", title: "Источник" }],
  status: "pending",
  suggested_by: null,
  summary: "Тема для проверки редактором.",
  title: "Карта пробуждения",
  updated_at: "2026-06-19T08:00:00.000Z",
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
    insert: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.limit.mockResolvedValue(responses.limit);
  query.maybeSingle.mockResolvedValue(responses.maybeSingle);
  query.single.mockResolvedValue(responses.single);

  return query;
}

describe("awakening map moderation backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ role: "editor", userId: reviewerId });
  });

  it("lists topic suggestions through the RLS client after role verification", async () => {
    const query = createQuery({ data: [suggestionRow], error: null });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValue({ from });

    await expect(
      listAwakeningTopicSuggestions({
        limit: 25,
        status: "pending",
      })
    ).resolves.toEqual([suggestionRow]);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith([
      "super_admin",
      "admin",
      "editor",
      "curator",
    ]);
    expect(from).toHaveBeenCalledWith("awakening_topic_suggestions");
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("related_node_refs"));
    expect(query.eq).toHaveBeenCalledWith("status", "pending");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(25);
  });

  it("reads one topic suggestion detail through the RLS client", async () => {
    const query = createQuery({ data: suggestionRow, error: null });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValue({ from });

    await expect(getAwakeningTopicSuggestion(suggestionId)).resolves.toEqual(suggestionRow);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith([
      "super_admin",
      "admin",
      "editor",
      "curator",
    ]);
    expect(from).toHaveBeenCalledWith("awakening_topic_suggestions");
    expect(query.eq).toHaveBeenCalledWith("id", suggestionId);
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("does not touch Supabase when role verification fails", async () => {
    mocks.requireAdminRole.mockRejectedValueOnce(new Error("Admin access denied"));

    await expect(listAwakeningTopicSuggestions()).rejects.toThrow("Admin access denied");

    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("approves a pending suggestion into node_projection and audits the decision", async () => {
    const approvedRow = {
      ...suggestionRow,
      decision_reason: "Источники проверены редактором.",
      promoted_node_projection_id: projectionId,
      reviewed_at: "2026-06-19T09:00:00.000Z",
      reviewed_by: reviewerId,
      status: "approved",
    };
    const readQuery = createQuery({
      maybeSingle: { data: suggestionRow, error: null },
    });
    const projectionQuery = createQuery({
      single: { data: { id: projectionId }, error: null },
    });
    const updateQuery = createQuery({
      single: { data: approvedRow, error: null },
    });
    const from = vi
      .fn()
      .mockReturnValueOnce(readQuery)
      .mockReturnValueOnce(projectionQuery)
      .mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      approveAwakeningTopicSuggestion({
        decisionReason: "Источники проверены редактором.",
        suggestionId,
      })
    ).resolves.toMatchObject({
      promoted_node_projection_id: projectionId,
      status: "approved",
    });

    expect(from).toHaveBeenNthCalledWith(1, "awakening_topic_suggestions");
    expect(from).toHaveBeenNthCalledWith(2, "node_projection");
    expect(from).toHaveBeenNthCalledWith(3, "awakening_topic_suggestions");
    expect(projectionQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        brain_node_id: `awakening-suggestion:${suggestionId}`,
        node_type: "topic",
        slug: "awakening-map",
        source_refs: suggestionRow.source_refs,
        status: "review",
        title: "Карта пробуждения",
      })
    );
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        decision_reason: "Источники проверены редактором.",
        promoted_node_projection_id: projectionId,
        reviewed_by: reviewerId,
        status: "approved",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_topic_reviewed",
        resource: `awakening-topic-suggestion:${suggestionId}`,
        userId: reviewerId,
      })
    );
  });

  it("rejects a pending suggestion without creating a projection", async () => {
    const rejectedRow = {
      ...suggestionRow,
      decision_reason: "Недостаточно проверяемых источников.",
      reviewed_at: "2026-06-19T09:00:00.000Z",
      reviewed_by: reviewerId,
      status: "rejected",
    };
    const readQuery = createQuery({
      maybeSingle: { data: suggestionRow, error: null },
    });
    const updateQuery = createQuery({
      single: { data: rejectedRow, error: null },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery).mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      rejectAwakeningTopicSuggestion({
        decisionReason: "Недостаточно проверяемых источников.",
        suggestionId,
      })
    ).resolves.toMatchObject({
      promoted_node_projection_id: null,
      status: "rejected",
    });

    expect(from).toHaveBeenCalledTimes(2);
    expect(from).not.toHaveBeenCalledWith("node_projection");
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        decision_reason: "Недостаточно проверяемых источников.",
        promoted_node_projection_id: null,
        reviewed_by: reviewerId,
        status: "rejected",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_topic_reviewed",
        resource: `awakening-topic-suggestion:${suggestionId}`,
        userId: reviewerId,
      })
    );
  });

  it("merges a pending suggestion into an existing topic projection", async () => {
    const mergedRow = {
      ...suggestionRow,
      decision_reason: "Дубль существующей темы.",
      promoted_node_projection_id: projectionId,
      reviewed_at: "2026-06-19T09:00:00.000Z",
      reviewed_by: reviewerId,
      status: "merged",
    };
    const readQuery = createQuery({
      maybeSingle: { data: suggestionRow, error: null },
    });
    const targetQuery = createQuery({
      maybeSingle: {
        data: {
          id: projectionId,
          node_type: "topic",
          status: "published",
          title: "Карта пробуждения",
        },
        error: null,
      },
    });
    const updateQuery = createQuery({
      single: { data: mergedRow, error: null },
    });
    const from = vi
      .fn()
      .mockReturnValueOnce(readQuery)
      .mockReturnValueOnce(targetQuery)
      .mockReturnValueOnce(updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      mergeAwakeningTopicSuggestion({
        decisionReason: "Дубль существующей темы.",
        promotedNodeProjectionId: projectionId,
        suggestionId,
      })
    ).resolves.toMatchObject({
      promoted_node_projection_id: projectionId,
      status: "merged",
    });

    expect(from).toHaveBeenNthCalledWith(2, "node_projection");
    expect(targetQuery.eq).toHaveBeenCalledWith("id", projectionId);
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        decision_reason: "Дубль существующей темы.",
        promoted_node_projection_id: projectionId,
        reviewed_by: reviewerId,
        status: "merged",
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.awakening_topic_reviewed",
        resource: `awakening-topic-suggestion:${suggestionId}`,
        userId: reviewerId,
      })
    );
  });

  it("blocks review actions for suggestions that are no longer pending", async () => {
    const readQuery = createQuery({
      maybeSingle: {
        data: {
          ...suggestionRow,
          status: "approved",
        },
        error: null,
      },
    });
    const from = vi.fn().mockReturnValueOnce(readQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      rejectAwakeningTopicSuggestion({
        decisionReason: "Повторное решение.",
        suggestionId,
      })
    ).rejects.toThrow("Only pending suggestions can be reviewed.");

    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
