import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mocks.maybeSingle,
        })),
      })),
    })),
  })),
}));

import {
  AdminAccessDeniedError,
  APPLICATION_MODERATION_ROLES,
  PROMPT_TEMPLATE_EDITOR_ROLES,
  assertAdminRole,
  getUserAdminRole,
  hasAdminRole,
  requireAdminRole,
} from "./admin-auth";

describe("admin role helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies regular authenticated users with no admin assignment", () => {
    expect(hasAdminRole(null, APPLICATION_MODERATION_ROLES)).toBe(false);
    expect(() => assertAdminRole(null)).toThrow(AdminAccessDeniedError);
  });

  it("keeps moderation and prompt permissions separate", () => {
    expect(hasAdminRole("curator", APPLICATION_MODERATION_ROLES)).toBe(true);
    expect(hasAdminRole("curator", PROMPT_TEMPLATE_EDITOR_ROLES)).toBe(false);
    expect(hasAdminRole("editor", PROMPT_TEMPLATE_EDITOR_ROLES)).toBe(true);
    expect(hasAdminRole("viewer", APPLICATION_MODERATION_ROLES)).toBe(false);
  });

  it("reads the current user's admin role from the RBAC table", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

    await expect(getUserAdminRole("user-1")).resolves.toBe("admin");
  });

  it("requires a valid admin role after the session is revalidated", async () => {
    mocks.requireUser.mockResolvedValueOnce({ id: "user-1" });
    mocks.maybeSingle.mockResolvedValueOnce({ data: { role: "viewer" }, error: null });

    await expect(requireAdminRole()).resolves.toEqual({
      userId: "user-1",
      role: "viewer",
    });

    expect(mocks.requireUser).toHaveBeenCalledTimes(1);
  });

  it("rejects users who have no assignment in admin_role_assignments", async () => {
    mocks.requireUser.mockResolvedValueOnce({ id: "user-1" });
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(requireAdminRole()).rejects.toBeInstanceOf(AdminAccessDeniedError);
  });
});
