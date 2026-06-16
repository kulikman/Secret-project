import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { BrainHttpClient, createBrainClientConfigFromEnv } from "./client";
import { BrainAdapterError } from "./errors";
import type { ServerEnv } from "@/lib/env";

const BASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "Тайное Бюро",
  NODE_ENV: "test",
  BRAIN_API_URL: "https://brain.example.com/",
} satisfies Partial<ServerEnv>;

describe("BrainHttpClient", () => {
  it("sends project-scoped requests with x-api-key and without leaking token into the URL", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const client = new BrainHttpClient({
      apiKey: "brain-secret",
      baseUrl: "https://brain.example.com/",
      projectId: "secret-bureau-public-archive",
      fetcher: fetcher as typeof fetch,
    });

    await expect(client.projectRequest("/nodes", { method: "GET" })).resolves.toEqual({ ok: true });

    const [url, init] = fetcher.mock.calls[0] as [RequestInfo | URL, RequestInit];
    expect(url).toBe("https://brain.example.com/api/v1/brain/secret-bureau-public-archive/nodes");
    expect(url).not.toContain("brain-secret");
    expect((init.headers as Headers).get("x-api-key")).toBe("brain-secret");
  });

  it("normalizes Brain API errors into typed adapter errors", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response("nope", { status: 503 });
    });
    const client = new BrainHttpClient({
      apiKey: "brain-secret",
      baseUrl: "https://brain.example.com",
      projectId: "project",
      fetcher: fetcher as typeof fetch,
    });

    await expect(client.projectRequest("/graph")).rejects.toMatchObject({
      code: "BRAIN_API_ERROR",
      details: { status: 503 },
    });
  });
});

describe("createBrainClientConfigFromEnv()", () => {
  it("uses project slug when project id is absent", () => {
    expect(
      createBrainClientConfigFromEnv({
        ...BASE_ENV,
        BRAIN_API_KEY: "brain-secret",
        BRAIN_PROJECT_SLUG: "secret-bureau-public-archive",
      } as ServerEnv)
    ).toEqual({
      apiKey: "brain-secret",
      baseUrl: "https://brain.example.com/",
      projectId: "secret-bureau-public-archive",
    });
  });

  it("fails with a typed error when token or project binding is missing", () => {
    expect(() => createBrainClientConfigFromEnv(BASE_ENV as ServerEnv)).toThrow(BrainAdapterError);
  });
});
