import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireAdminRole: vi.fn(),
  getServerEnv: vi.fn(),
  writeAuditLog: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: mocks.requireAdminRole,
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

import { deleteArchivedBrainProjects } from "./brain-projects";

describe("deleteArchivedBrainProjects()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);

    mocks.requireAdminRole.mockResolvedValue({ userId: "user-1", role: "admin" });
    mocks.getServerEnv.mockReturnValue({
      BRAIN_API_URL: "https://brain.example.com",
      BRAIN_ADMIN_API_KEY: "brain-founder-key",
      BRAIN_PROJECT_DELETE_ENDPOINT_TEMPLATE: "/api/v1/projects/{projectRef}",
    });
  });

  it("accepts full project URLs and deletes each resolved slug", async () => {
    mocks.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          deletedProject: { slug: "qa-smoke-2026-05-28t20-07-38", name: "QA Smoke" },
        }),
        { status: 200 }
      )
    );

    const result = await deleteArchivedBrainProjects({
      refs: "https://os.elaurion.com/projects/qa-smoke-2026-05-28t20-07-38",
      confirmation: "DELETE",
    });

    expect(result).toEqual({
      ok: true,
      deletedCount: 1,
      failedCount: 0,
      items: [
        {
          ref: "https://os.elaurion.com/projects/qa-smoke-2026-05-28t20-07-38",
          projectRef: "qa-smoke-2026-05-28t20-07-38",
          ok: true,
          message:
            'Brain accepted deletion for project "QA Smoke". Verify cascade cleanup in Brain/OS.',
        },
      ],
    });
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://brain.example.com/api/v1/projects/qa-smoke-2026-05-28t20-07-38",
      expect.objectContaining({
        method: "DELETE",
        headers: { "x-api-key": "brain-founder-key" },
      })
    );
    expect(mocks.writeAuditLog).toHaveBeenCalledTimes(1);
  });

  it("returns a failed item when Brain API rejects deletion", async () => {
    mocks.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Founder scope required" }), { status: 403 })
    );

    const result = await deleteArchivedBrainProjects({
      refs: "qa-prod-wide-2026-05-29t06-30-09-272z",
      confirmation: "DELETE",
    });

    expect(result.ok).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      projectRef: "qa-prod-wide-2026-05-29t06-30-09-272z",
      ok: false,
      message: "Founder scope required",
    });
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("requires explicit DELETE confirmation", async () => {
    await expect(
      deleteArchivedBrainProjects({
        refs: "qa-prod-narrow-2026-05-29t06-30-09-272z",
        confirmation: "nope",
      })
    ).rejects.toThrow();
  });

  it("does not call a guessed project delete endpoint when the contract is missing", async () => {
    mocks.getServerEnv.mockReturnValue({
      BRAIN_API_URL: "https://brain.example.com",
      BRAIN_ADMIN_API_KEY: "brain-founder-key",
    });

    const result = await deleteArchivedBrainProjects({
      refs: "qa-prod-narrow-2026-05-29t06-30-09-272z",
      confirmation: "DELETE",
    });

    expect(result).toMatchObject({
      ok: false,
      deletedCount: 0,
      failedCount: 1,
      items: [
        {
          projectRef: "qa-prod-narrow-2026-05-29t06-30-09-272z",
          ok: false,
        },
      ],
    });
    expect(result.items[0]?.message).toContain("нет подтвержденного project delete endpoint");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
