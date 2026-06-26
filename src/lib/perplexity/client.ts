import "server-only";

import { z } from "zod";

import { getServerEnv, type ServerEnv } from "@/lib/env";

export const DEFAULT_PERPLEXITY_MODEL = "sonar";
export const PERPLEXITY_API_URL = "https://api.perplexity.ai/v1/sonar";

const perplexityCitationSchema = z.string().url();

const perplexitySearchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().url().optional(),
    snippet: z.string().optional(),
  })
  .catchall(z.unknown());

const perplexityResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                content: z.string().min(1),
              })
              .catchall(z.unknown()),
          })
          .catchall(z.unknown())
      )
      .min(1),
    citations: z.array(perplexityCitationSchema).nullish(),
    search_results: z.array(perplexitySearchResultSchema).nullish(),
  })
  .catchall(z.unknown());

export interface PerplexityTopicResearchInput {
  slug: string;
  summary: string | null;
  title: string;
}

export interface PerplexityTopicResearchResult {
  citations: string[];
  content: string;
  generatedAt: string;
  model: string;
  provider: "perplexity";
  searchResults: Array<{
    snippet: string | null;
    title: string | null;
    url: string;
  }>;
}

interface PerplexityTopicResearchOptions {
  apiKey?: string;
  env?: ServerEnv;
  fetcher?: typeof fetch;
  model?: string;
}

export class PerplexityNotConfiguredError extends Error {
  constructor() {
    super("PERPLEXITY_API_KEY is not configured.");
    this.name = "PerplexityNotConfiguredError";
  }
}

export class PerplexityApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "PerplexityApiError";
  }
}

export function createPerplexityConfigFromEnv(env: ServerEnv = getServerEnv()): {
  apiKey: string;
  model: string;
} {
  if (!env.PERPLEXITY_API_KEY) throw new PerplexityNotConfiguredError();

  return {
    apiKey: env.PERPLEXITY_API_KEY,
    model: env.PERPLEXITY_MODEL ?? DEFAULT_PERPLEXITY_MODEL,
  };
}

function buildTopicResearchPrompt(input: PerplexityTopicResearchInput): string {
  return [
    `Тема: ${input.title}`,
    `Slug: ${input.slug}`,
    input.summary ? `Краткое описание из projection: ${input.summary}` : null,
    "",
    "Собери краткое исследование на русском языке для карточки темы Тайного Бюро.",
    "Структура ответа:",
    "1. Что это за тема и в каком контексте она обсуждается.",
    "2. Какие утверждения требуют осторожности или проверки.",
    "3. Какие источники стоит читать в первую очередь.",
    "",
    "Не представляй спорные утверждения как доказанный факт. Указывай, где данные являются интерпретациями, легендами, гипотезами или популярными нарративами.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeSearchResults(
  searchResults: z.infer<typeof perplexitySearchResultSchema>[] | undefined,
  citations: string[]
): PerplexityTopicResearchResult["searchResults"] {
  const byUrl = new Map<string, PerplexityTopicResearchResult["searchResults"][number]>();

  for (const result of searchResults ?? []) {
    if (!result.url) continue;
    byUrl.set(result.url, {
      snippet: result.snippet ?? null,
      title: result.title ?? null,
      url: result.url,
    });
  }

  for (const url of citations) {
    if (!byUrl.has(url)) {
      byUrl.set(url, { snippet: null, title: null, url });
    }
  }

  return Array.from(byUrl.values());
}

export async function createPerplexityTopicResearch(
  input: PerplexityTopicResearchInput,
  options: PerplexityTopicResearchOptions = {}
): Promise<PerplexityTopicResearchResult> {
  const config = options.apiKey
    ? { apiKey: options.apiKey, model: options.model ?? DEFAULT_PERPLEXITY_MODEL }
    : createPerplexityConfigFromEnv(options.env);
  const model = options.model ?? config.model;
  const fetcher = options.fetcher ?? fetch;

  const response = await fetcher(PERPLEXITY_API_URL, {
    body: JSON.stringify({
      messages: [
        {
          content:
            "Ты аккуратный исследователь. Отвечай на русском, отделяй подтвержденные сведения от гипотез и всегда опирайся на найденные источники.",
          role: "system",
        },
        {
          content: buildTopicResearchPrompt(input),
          role: "user",
        },
      ],
      model,
      language_preference: "ru",
      web_search_options: {
        search_mode: "web",
      },
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new PerplexityApiError("Perplexity research request failed.", response.status);
  }

  const parsed = perplexityResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new PerplexityApiError("Perplexity returned an unexpected response shape.");
  }

  const choice = parsed.data.choices[0];
  if (!choice) {
    throw new PerplexityApiError("Perplexity returned an empty response.");
  }

  const citations = parsed.data.citations ?? [];

  return {
    citations,
    content: choice.message.content,
    generatedAt: new Date().toISOString(),
    model,
    provider: "perplexity",
    searchResults: normalizeSearchResults(parsed.data.search_results ?? undefined, citations),
  };
}
