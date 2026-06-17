import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  requireAdminRole: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  APPLICATION_MODERATION_ROLES: ["super_admin", "admin", "curator"],
  requireAdminRole: mocks.requireAdminRole,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  changeApplicationStatus,
  getApplicationForModeration,
  listApplicationsForModeration,
} from "./moderation";

const applicationId = "11111111-1111-4111-8111-111111111111";
const cityId = "22222222-2222-4222-8222-222222222222";
const eventId = "33333333-3333-4333-8333-333333333333";
const reviewerId = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";

const applicationRow = {
  city_id: cityId,
  created_at: "2026-06-17T08:00:00.000Z",
  email: "ivan@example.com",
  event_id: eventId,
  full_name: "Иван Иванов",
  id: applicationId,
  motivation: "Хочу участвовать",
  reviewed_at: null,
  reviewed_by: null,
  selected_topic: "Гиперборея",
  status: "new",
  telegram: "@ivan",
  updated_at: "2026-06-17T08:00:00.000Z",
  user_id: userId,
};

function createQuery(response: unknown) {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    lte: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.limit.mockResolvedValue(response);
  query.maybeSingle.mockResolvedValue(response);
  query.single.mockResolvedValue(response);

  return query;
}

describe("application moderation backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ role: "curator", userId: reviewerId });
  });

  it("lists applications through the RLS client after admin role verification", async () => {
    const query = createQuery({ data: [applicationRow], error: null });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValue({ from });

    await expect(
      listApplicationsForModeration({
        cityId,
        createdFrom: "2026-06-01T00:00:00.000Z",
        createdTo: "2026-06-30T23:59:59.000Z",
        eventId,
        limit: 25,
        selectedTopic: "  Гиперборея  ",
        status: "new",
      })
    ).resolves.toEqual([applicationRow]);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith(["super_admin", "admin", "curator"]);
    expect(from).toHaveBeenCalledWith("applications");
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("full_name"));
    expect(query.eq).toHaveBeenCalledWith("status", "new");
    expect(query.eq).toHaveBeenCalledWith("city_id", cityId);
    expect(query.eq).toHaveBeenCalledWith("event_id", eventId);
    expect(query.eq).toHaveBeenCalledWith("selected_topic", "Гиперборея");
    expect(query.gte).toHaveBeenCalledWith("created_at", "2026-06-01T00:00:00.000Z");
    expect(query.lte).toHaveBeenCalledWith("created_at", "2026-06-30T23:59:59.000Z");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(25);
  });

  it("reads one application detail through the RLS client", async () => {
    const query = createQuery({ data: applicationRow, error: null });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValue({ from });

    await expect(getApplicationForModeration(applicationId)).resolves.toEqual(applicationRow);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith(["super_admin", "admin", "curator"]);
    expect(from).toHaveBeenCalledWith("applications");
    expect(query.eq).toHaveBeenCalledWith("id", applicationId);
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("updates application status through service-role client and writes audit log", async () => {
    const readQuery = createQuery({
      data: { id: applicationId, status: "new", user_id: userId },
      error: null,
    });
    const updatedRow = {
      ...applicationRow,
      reviewed_at: "2026-06-17T09:00:00.000Z",
      reviewed_by: reviewerId,
      status: "approved",
    };
    const updateQuery = createQuery({ data: updatedRow, error: null });
    const from = vi
      .fn()
      .mockImplementationOnce(() => readQuery)
      .mockImplementationOnce(() => updateQuery);
    mocks.createAdminClient.mockReturnValue({ from });

    await expect(
      changeApplicationStatus({
        applicationId,
        decisionReason: "  Подходит под первую волну  ",
        status: "approved",
      })
    ).resolves.toEqual(updatedRow);

    expect(mocks.requireAdminRole).toHaveBeenCalledWith(["super_admin", "admin", "curator"]);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).toHaveBeenCalledTimes(1);
    expect(readQuery.select).toHaveBeenCalledWith("id,user_id,status");
    expect(readQuery.eq).toHaveBeenCalledWith("id", applicationId);
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewed_by: reviewerId,
        status: "approved",
      })
    );
    expect(updateQuery.eq).toHaveBeenCalledWith("id", applicationId);
    expect(updateQuery.select).toHaveBeenCalledWith(expect.stringContaining("motivation"));
    expect(mocks.writeAuditLog).toHaveBeenCalledWith({
      action: "admin.application_status_changed",
      metadata: {
        decisionReason: "Подходит под первую волну",
        nextStatus: "approved",
        previousStatus: "new",
        targetUserId: userId,
      },
      resource: `application:${applicationId}`,
      userId: reviewerId,
    });
  });

  it("does not touch Supabase when role verification fails", async () => {
    mocks.requireAdminRole.mockRejectedValueOnce(new Error("Admin access denied"));

    await expect(
      changeApplicationStatus({
        applicationId,
        status: "rejected",
      })
    ).rejects.toThrow("Admin access denied");

    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
