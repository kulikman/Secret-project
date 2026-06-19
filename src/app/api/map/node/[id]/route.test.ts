import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublishedMapNode: vi.fn(),
}));

vi.mock("@/features/knowledge", () => ({
  getPublishedMapNode: mocks.getPublishedMapNode,
}));

import { GET } from "./route";

describe("GET /api/map/node/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns one published map node", async () => {
    mocks.getPublishedMapNode.mockResolvedValueOnce({
      id: "brain-topic-1",
      isProjected: true,
      title: "Tesla",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/map/node/brain-topic-1", {
        headers: { "x-request-id": "map-node-1" },
      }),
      {
        params: Promise.resolve({ id: "brain-topic-1" }),
      }
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "map-node-1",
      data: {
        node: {
          id: "brain-topic-1",
          isProjected: true,
          title: "Tesla",
        },
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.getPublishedMapNode).toHaveBeenCalledWith({ id: "brain-topic-1" });
  });

  it("returns 404 when the map node is missing", async () => {
    mocks.getPublishedMapNode.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest("http://localhost/api/map/node/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Map node not found",
    });
    expect(response.status).toBe(404);
  });
});
