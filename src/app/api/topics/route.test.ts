import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  listPublishedTopics: vi.fn(),
}));

vi.mock("@/features/knowledge", () => ({
  listPublishedTopics: mocks.listPublishedTopics,
}));

import { GET } from "./route";

describe("GET /api/topics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns published topic projections", async () => {
    mocks.listPublishedTopics.mockResolvedValueOnce({
      items: [{ id: "topic-1", title: "Гиперборея" }],
      pagination: { page: 1, limit: 20, total: 1, hasMore: false },
    });

    const response = await GET(
      new NextRequest("http://localhost/api/topics?page=1&limit=20", {
        headers: { "x-request-id": "topics-list-1" },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "topics-list-1",
      data: {
        items: [{ id: "topic-1", title: "Гиперборея" }],
        pagination: { page: 1, limit: 20, total: 1, hasMore: false },
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("topics-list-1");
  });

  it("passes a search query to the public topics list", async () => {
    mocks.listPublishedTopics.mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, hasMore: false },
    });

    await GET(new NextRequest("http://localhost/api/topics?page=1&limit=20&q=tesla"));

    expect(mocks.listPublishedTopics).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: "tesla",
    });
  });
});
