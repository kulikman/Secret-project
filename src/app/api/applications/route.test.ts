import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  getClientIpFromHeaders: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  limit: mocks.limit,
}));

vi.mock("@/lib/request-ip", () => ({
  getClientIpFromHeaders: mocks.getClientIpFromHeaders,
}));

import { POST } from "./route";

function createDuplicateQuery(response: unknown) {
  const query = {
    eq: vi.fn(),
    is: vi.fn(),
    limit: vi.fn(),
    select: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.limit.mockResolvedValue(response);

  return query;
}

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientIpFromHeaders.mockReturnValue("203.0.113.10");
    mocks.limit.mockResolvedValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60_000,
    });
  });

  it("validates and inserts a public application through the RLS client", async () => {
    const duplicateQuery = createDuplicateQuery({ data: [], error: null });
    const adminFrom = vi.fn(() => duplicateQuery);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    mocks.createAdminClient.mockReturnValueOnce({ from: adminFrom });
    mocks.createClient.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/applications", {
        method: "POST",
        headers: { "x-request-id": "app-create-1" },
        body: JSON.stringify({
          fullName: "Иван Иванов",
          email: "ivan@example.com",
          motivation: "Хочу участвовать",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true, requestId: "app-create-1" });
    expect(response.status).toBe(201);
    expect(response.headers.get("X-Request-Id")).toBe("app-create-1");
    expect(mocks.limit).toHaveBeenCalledWith("applications:203.0.113.10:ivan@example.com", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    expect(adminFrom).toHaveBeenCalledWith("applications");
    expect(duplicateQuery.select).toHaveBeenCalledWith("id");
    expect(duplicateQuery.eq).toHaveBeenCalledWith("email", "ivan@example.com");
    expect(duplicateQuery.is).toHaveBeenCalledWith("city_id", null);
    expect(duplicateQuery.is).toHaveBeenCalledWith("event_id", null);
    expect(duplicateQuery.limit).toHaveBeenCalledWith(1);
    expect(from).toHaveBeenCalledWith("applications");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Иван Иванов",
        email: "ivan@example.com",
        status: "new",
        reviewed_by: null,
      })
    );
  });

  it("rejects invalid payloads before Supabase work", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/applications", {
        method: "POST",
        body: JSON.stringify({ fullName: "A", email: "bad" }),
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: "Invalid application payload",
    });
    expect(response.status).toBe(422);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("rate limits valid application attempts before Supabase work", async () => {
    mocks.limit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/applications", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Иван Иванов",
          email: "ivan@example.com",
        }),
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: "Too many application attempts",
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("treats duplicate email/city/event submissions as successful without inserting again", async () => {
    const duplicateQuery = createDuplicateQuery({
      data: [{ id: "11111111-1111-4111-8111-111111111111" }],
      error: null,
    });
    const adminFrom = vi.fn(() => duplicateQuery);
    mocks.createAdminClient.mockReturnValueOnce({ from: adminFrom });

    const response = await POST(
      new NextRequest("http://localhost/api/applications", {
        method: "POST",
        headers: { "x-request-id": "app-dupe-1" },
        body: JSON.stringify({
          cityId: "22222222-2222-4222-8222-222222222222",
          eventId: "33333333-3333-4333-8333-333333333333",
          fullName: "Иван Иванов",
          email: "Ivan@Example.com",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true, requestId: "app-dupe-1" });
    expect(response.status).toBe(201);
    expect(response.headers.get("X-Request-Id")).toBe("app-dupe-1");
    expect(duplicateQuery.eq).toHaveBeenCalledWith("email", "ivan@example.com");
    expect(duplicateQuery.eq).toHaveBeenCalledWith(
      "city_id",
      "22222222-2222-4222-8222-222222222222"
    );
    expect(duplicateQuery.eq).toHaveBeenCalledWith(
      "event_id",
      "33333333-3333-4333-8333-333333333333"
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
