import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createOrg: vi.fn(),
  logger: {
    info: vi.fn(),
  },
  writeAuditLog: vi.fn(),
}));

vi.mock("../lib/org", () => ({
  createOrg: mocks.createOrg,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

import { createOrgForUser, getCreateOrgErrorResponse } from "./create-org";

describe("createOrgForUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an org and records audit/log context outside the route handler", async () => {
    mocks.createOrg.mockResolvedValueOnce({ id: "org-1", slug: "acme" });

    await expect(
      createOrgForUser({ name: "Acme", slug: "acme", userId: "user-1" })
    ).resolves.toEqual({
      id: "org-1",
      slug: "acme",
    });

    expect(mocks.createOrg).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      userId: "user-1",
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith({
      userId: "user-1",
      action: "profile.updated",
      resource: "organization:org-1",
      metadata: { event: "org_created", slug: "acme" },
    });
    expect(mocks.logger.info).toHaveBeenCalledWith("org created", {
      orgId: "org-1",
      userId: "user-1",
    });
  });
});

describe("getCreateOrgErrorResponse()", () => {
  it("normalizes duplicate slug errors", () => {
    expect(getCreateOrgErrorResponse(new Error("duplicate key value violates unique"))).toEqual({
      error: "That slug is already taken.",
      status: 409,
    });
  });

  it("keeps unknown create failures visible", () => {
    expect(getCreateOrgErrorResponse(new Error("database unavailable"))).toEqual({
      error: "database unavailable",
      status: 500,
    });
  });
});
