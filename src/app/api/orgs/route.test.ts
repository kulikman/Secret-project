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

    const response = await GET(new NextRequest("http://localhost/api/orgs"));

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: "Unauthorized",
    });
    expect(response.status).toBe(401);
    expect(mocks.getUserOrgs).not.toHaveBeenCalled();
  });

  it("lists orgs in the standard API envelope", async () => {
    mocks.getUserOrgs.mockResolvedValueOnce([{ orgId: "org-1", orgName: "Бюро", role: "owner" }]);

    const response = await GET(
      new NextRequest("http://localhost/api/orgs", {
        headers: { "x-request-id": "org-list-1" },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "org-list-1",
      data: {
        orgs: [{ orgId: "org-1", orgName: "Бюро", role: "owner" }],
      },
    });
    expect(response.headers.get("X-Request-Id")).toBe("org-list-1");
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
      requestId: expect.any(String),
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
      requestId: expect.any(String),
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
        headers: { "x-request-id": "org-create-fail-1" },
        body: JSON.stringify({ name: "Бюро", slug: "bureau" }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      requestId: "org-create-fail-1",
      error: "That slug is already taken.",
    });
    expect(response.status).toBe(409);
    expect(mocks.logger.error).toHaveBeenCalledWith("org create failed", error, {
      requestId: "org-create-fail-1",
    });
  });
});
