import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  logger: {
    warn: vi.fn(),
  },
  runScheduledCleanup: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

vi.mock("@/features/maintenance", () => ({
  runScheduledCleanup: mocks.runScheduledCleanup,
}));

import { GET } from "./route";

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerEnv.mockReturnValue({ CRON_SECRET: "secret" });
  });

  it("rejects unauthorized requests before cleanup work", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/cleanup", {
        headers: { "x-request-id": "cron-denied-1" },
      }) as unknown as NextRequest
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      requestId: "cron-denied-1",
      error: "Unauthorized",
    });
    expect(response.status).toBe(401);
    expect(mocks.logger.warn).toHaveBeenCalledWith("cron/cleanup: unauthorized request", {
      requestId: "cron-denied-1",
    });
    expect(mocks.runScheduledCleanup).not.toHaveBeenCalled();
  });

  it("runs cleanup for authorized cron requests", async () => {
    mocks.runScheduledCleanup.mockResolvedValueOnce({
      notificationsDeleted: 2,
      expiredInvitesDeleted: 1,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/cleanup", {
        headers: { authorization: "Bearer secret", "x-request-id": "cron-cleanup-1" },
      }) as unknown as NextRequest
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "cron-cleanup-1",
      data: {
        notificationsDeleted: 2,
        expiredInvitesDeleted: 1,
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("cron-cleanup-1");
    expect(mocks.runScheduledCleanup).toHaveBeenCalledTimes(1);
  });
});
