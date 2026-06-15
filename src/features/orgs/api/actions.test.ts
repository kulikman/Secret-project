import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrg: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("../lib/org", () => ({
  createOrg: mocks.createOrg,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { createOrgAction } from "./actions";

describe("createOrgAction()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "server-user-id" });
  });

  it("derives userId from the server session instead of client input", async () => {
    await expect(
      createOrgAction({
        name: "Acme",
        slug: "acme",
      })
    ).resolves.toEqual({ ok: true });

    expect(mocks.requireUser).toHaveBeenCalledTimes(1);
    expect(mocks.createOrg).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      userId: "server-user-id",
    });
  });

  it("rejects invalid input before creating an organization", async () => {
    await expect(createOrgAction({ name: "", slug: "x" })).resolves.toEqual({
      ok: false,
      error: "Name must be 1–100 characters.",
    });

    expect(mocks.createOrg).not.toHaveBeenCalled();
  });
});
