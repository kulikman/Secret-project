import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { POST } from "./route";

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates and inserts a public application through the RLS client", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    mocks.createClient.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/applications", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Иван Иванов",
          email: "ivan@example.com",
          motivation: "Хочу участвовать",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(201);
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

    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid application payload",
    });
    expect(response.status).toBe(422);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
