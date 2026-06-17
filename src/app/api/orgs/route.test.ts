import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createOrgForUser: vi.fn(),
  getApiUser: vi.fn(),
  getCreateOrgErrorResponse: vi.fn(),
  getUserOrgs: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: mocks.getApiUser,
}));

vi.mock("@/features/orgs", () => ({
  createOrgForUser: mocks.createOrgForUser,
  getCreateOrgErrorResponse: mocks.getCreateOrgErrorResponse,
  getUserOrgs: mocks.getUserOrgs,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

import { GET, POST } from "./route";

describe("/api/orgs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getApiUser.mockResolvedValue({ id: "user-1" });
  });

  it("returns JSON 401 instead of redirecting when unauthenticated", async () => {
    mocks.getApiUser.mockResolvedValueOnce(null);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ ok: false, error: "Unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.getUserOrgs).not.toHaveBeenCalled();
  });

  it("lists orgs in the standard API envelope", async () => {
    mocks.getUserOrgs.mockResolvedValueOnce([{ orgId: "org-1", orgName: "Бюро", role: "owner" }]);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        orgs: [{ orgId: "org-1", orgName: "Бюро", role: "owner" }],
      },
    });
  });

  it("creates an org for the current API user", async () => {
    mocks.createOrgForUser.mockResolvedValueOnce({ id: "org-1", slug: "bureau" });

    const response = await POST(
      new NextRequest("http://localhost/api/orgs", {
        method: "POST",
        body: JSON.stringify({ name: "Бюро", slug: "bureau" }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { org: { id: "org-1", slug: "bureau" } },
    });
    expect(response.status).toBe(201);
    expect(mocks.createOrgForUser).toHaveBeenCalledWith({
      name: "Бюро",
      slug: "bureau",
      userId: "user-1",
    });
  });

  it("returns validation errors in the standard API envelope", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/orgs", {
        method: "POST",
        body: JSON.stringify({ name: "", slug: "x" }),
      })
    );

    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      error: expect.any(String),
      issues: expect.arrayContaining([expect.any(String)]),
    });
    expect(response.status).toBe(422);
    expect(mocks.createOrgForUser).not.toHaveBeenCalled();
  });

  it("normalizes create failures", async () => {
    const error = new Error("duplicate");
    mocks.createOrgForUser.mockRejectedValueOnce(error);
    mocks.getCreateOrgErrorResponse.mockReturnValueOnce({
      error: "That slug is already taken.",
      status: 409,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/orgs", {
        method: "POST",
        body: JSON.stringify({ name: "Бюро", slug: "bureau" }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "That slug is already taken.",
    });
    expect(response.status).toBe(409);
  });
});
