import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  requireAdminRole: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  AWAKENING_MAP_REVIEW_ROLES: ["super_admin", "admin", "editor", "curator"],
  requireAdminRole: mocks.requireAdminRole,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { getAwakeningTopicSuggestion, listAwakeningTopicSuggestions } from "./moderation";

const suggestionId = "11111111-1111-4111-8111-111111111111";
const reviewerId = "22222222-2222-4222-8222-222222222222";

const suggestionRow = {
  created_at: "2026-06-19T08:00:00.000Z",
  decision_reason: null,
  description: "Развернутая заявка на добавление темы в карту пробуждения.",
  id: suggestionId,
  promoted_node_projection_id: null,
  related_node_refs: [{ nodeId: "brain-topic-1", relation: "neighbor" }],
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

function createQuery(response: unknown) {
  const query = {
    eq: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.limit.mockResolvedValue(response);
  query.maybeSingle.mockResolvedValue(response);

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
});
