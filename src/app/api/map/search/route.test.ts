import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  searchPublishedMapNodes: vi.fn(),
}));

vi.mock("@/features/knowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/knowledge")>();
  return {
    ...actual,
    searchPublishedMapNodes: mocks.searchPublishedMapNodes,
  };
});

import { GET } from "./route";

describe("GET /api/map/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns projected map node search results", async () => {
    mocks.searchPublishedMapNodes.mockResolvedValueOnce({
      items: [{ id: "brain-topic-1", title: "Tesla" }],
    });

    const response = await GET(
      new NextRequest("http://localhost/api/map/search?q=tesla&limit=5&nodeTypes=topic", {
        headers: { "x-request-id": "map-search-1" },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "map-search-1",
      data: {
        items: [{ id: "brain-topic-1", title: "Tesla" }],
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.searchPublishedMapNodes).toHaveBeenCalledWith({
      limit: 5,
      nodeTypes: ["topic"],
      q: "tesla",
    });
  });

  it("requires a non-empty query", async () => {
    const response = await GET(new NextRequest("http://localhost/api/map/search?q="));

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      issues: expect.any(Array),
    });
    expect(response.status).toBe(422);
    expect(mocks.searchPublishedMapNodes).not.toHaveBeenCalled();
  });
});
