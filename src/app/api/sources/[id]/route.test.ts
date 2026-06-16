import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getPublishedSourceById: vi.fn(),
}));

vi.mock("@/features/knowledge", () => ({
  getPublishedSourceById: mocks.getPublishedSourceById,
}));

import { GET } from "./route";

describe("GET /api/sources/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a published source projection", async () => {
    mocks.getPublishedSourceById.mockResolvedValueOnce({
      id: "source-1",
      brain_node_id: "brain-source-1",
      title: "Архивный документ",
    });

    const response = await GET(new NextRequest("http://localhost/api/sources/brain-source-1"), {
      params: Promise.resolve({ id: "brain-source-1" }),
    });

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        source: {
          id: "source-1",
          brain_node_id: "brain-source-1",
          title: "Архивный документ",
        },
      },
    });
    expect(response.status).toBe(200);
  });
});
