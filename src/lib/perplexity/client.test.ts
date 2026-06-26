import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createPerplexityConfigFromEnv,
  createPerplexityTopicResearch,
  PerplexityApiError,
  PerplexityNotConfiguredError,
} from "./client";
import type { ServerEnv } from "@/lib/env";

const BASE_ENV = {
  BRAIN_API_URL: "https://brain.example.com/",
  NEXT_PUBLIC_APP_NAME: "Тайное Бюро",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NODE_ENV: "test",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
} satisfies Partial<ServerEnv>;

describe("createPerplexityTopicResearch()", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails explicitly when PERPLEXITY_API_KEY is missing", async () => {
    expect(() => createPerplexityConfigFromEnv(BASE_ENV as ServerEnv)).toThrow(
      PerplexityNotConfiguredError
    );
  });

  it("calls Perplexity without exposing the API key in the URL", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        choices: [{ message: { content: "Краткое исследование с осторожными формулировками." } }],
        citations: ["https://example.com/source"],
        search_results: [{ title: "Source", url: "https://example.com/source" }],
      })
    );

    const result = await createPerplexityTopicResearch(
      {
        slug: "ancient-builder-race",
        summary: "Кластер карты.",
        title: "Ancient Builder Race",
      },
      { apiKey: "pplx-secret", fetcher: fetcher as typeof fetch, model: "sonar" }
    );

    const [url, init] = fetcher.mock.calls[0] as [RequestInfo | URL, RequestInit];
    expect(url).toBe("https://api.perplexity.ai/v1/sonar");
    expect(url).not.toContain("pplx-secret");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer pplx-secret");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "sonar" });
    expect(result).toMatchObject({
      citations: ["https://example.com/source"],
      content: "Краткое исследование с осторожными формулировками.",
      provider: "perplexity",
    });
  });

  it("maps non-2xx responses to PerplexityApiError", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response("bad gateway", { status: 502 });
    });

    await expect(
      createPerplexityTopicResearch(
        {
          slug: "ancient-builder-race",
          summary: null,
          title: "Ancient Builder Race",
        },
        { apiKey: "pplx-secret", fetcher: fetcher as typeof fetch }
      )
    ).rejects.toMatchObject(new PerplexityApiError("Perplexity research request failed.", 502));
  });

  it("maps timed-out requests to a 504 provider error", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      await new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

      return Response.json({});
    });

    await expect(
      createPerplexityTopicResearch(
        {
          slug: "ancient-builder-race",
          summary: null,
          title: "Ancient Builder Race",
        },
        { apiKey: "pplx-secret", fetcher: fetcher as typeof fetch, timeoutMs: 1 }
      )
    ).rejects.toMatchObject(new PerplexityApiError("Perplexity research request timed out.", 504));
  });
});
