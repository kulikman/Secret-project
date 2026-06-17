import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getPublishedTopicBySlug: vi.fn(),
}));

vi.mock("@/features/knowledge", () => ({
  getPublishedTopicBySlug: mocks.getPublishedTopicBySlug,
}));

import { GET } from "./route";

describe("GET /api/topics/:slug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a published topic projection", async () => {
    mocks.getPublishedTopicBySlug.mockResolvedValueOnce({
      id: "topic-1",
      slug: "hyperborea",
      title: "Гиперборея",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/topics/hyperborea", {
        headers: { "x-request-id": "topic-detail-1" },
      }),
      {
        params: Promise.resolve({ slug: "hyperborea" }),
      }
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "topic-detail-1",
      data: {
        topic: {
          id: "topic-1",
          slug: "hyperborea",
          title: "Гиперборея",
        },
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("topic-detail-1");
  });

  it("returns 404 for missing topics", async () => {
    mocks.getPublishedTopicBySlug.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest("http://localhost/api/topics/missing"), {
      params: Promise.resolve({ slug: "missing" }),
    });

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: "Topic not found",
    });
    expect(response.status).toBe(404);
  });
});
