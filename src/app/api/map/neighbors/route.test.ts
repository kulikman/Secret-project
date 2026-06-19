import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublishedMapNeighbors: vi.fn(),
}));

vi.mock("@/features/knowledge", () => ({
  getPublishedMapNeighbors: mocks.getPublishedMapNeighbors,
}));

import { GET } from "./route";

describe("GET /api/map/neighbors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns direct neighbors for a map node", async () => {
    mocks.getPublishedMapNeighbors.mockResolvedValueOnce({
      edges: [{ sourceId: "brain-topic-1", targetId: "brain-person-1" }],
      nodes: [{ id: "brain-topic-1" }, { id: "brain-person-1" }],
    });

    const response = await GET(
      new NextRequest("http://localhost/api/map/neighbors?id=brain-topic-1&limit=10", {
        headers: { "x-request-id": "map-neighbors-1" },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "map-neighbors-1",
      data: {
        graph: {
          edges: [{ sourceId: "brain-topic-1", targetId: "brain-person-1" }],
          nodes: [{ id: "brain-topic-1" }, { id: "brain-person-1" }],
        },
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.getPublishedMapNeighbors).toHaveBeenCalledWith({
      id: "brain-topic-1",
      limit: 10,
    });
  });

  it("requires an id query param", async () => {
    const response = await GET(new NextRequest("http://localhost/api/map/neighbors"));

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      issues: expect.any(Array),
    });
    expect(response.status).toBe(422);
    expect(mocks.getPublishedMapNeighbors).not.toHaveBeenCalled();
  });
});
