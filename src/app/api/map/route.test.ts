import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  listPublishedMapGraph: vi.fn(),
}));

vi.mock("@/features/knowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/knowledge")>();
  return {
    ...actual,
    listPublishedMapGraph: mocks.listPublishedMapGraph,
  };
});

import { GET } from "./route";

describe("GET /api/map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the published map graph", async () => {
    mocks.listPublishedMapGraph.mockResolvedValueOnce({
      edges: [],
      nodes: [{ id: "brain-topic-1", title: "Tesla" }],
    });

    const response = await GET(
      new NextRequest("http://localhost/api/map?limit=10&nodeTypes=topic,person&q=tesla", {
        headers: { "x-request-id": "map-root-1" },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "map-root-1",
      data: {
        graph: {
          edges: [],
          nodes: [{ id: "brain-topic-1", title: "Tesla" }],
        },
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("map-root-1");
    expect(mocks.listPublishedMapGraph).toHaveBeenCalledWith({
      limit: 10,
      nodeTypes: ["topic", "person"],
      q: "tesla",
    });
  });

  it("returns validation errors for invalid node types", async () => {
    const response = await GET(new NextRequest("http://localhost/api/map?nodeTypes=unknown"));

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: expect.any(String),
      issues: expect.any(Array),
    });
    expect(response.status).toBe(422);
    expect(mocks.listPublishedMapGraph).not.toHaveBeenCalled();
  });
});
