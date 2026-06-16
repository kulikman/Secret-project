import "server-only";

import { getServerEnv, type ServerEnv } from "@/lib/env";

import { BrainAdapterError } from "./errors";

export interface BrainClientConfig {
  apiKey: string;
  baseUrl: string;
  projectId: string;
  fetcher?: typeof fetch;
}

export interface BrainProjectClient {
  projectRequest<T>(path: string, init?: RequestInit): Promise<T>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function createBrainClientConfigFromEnv(env: ServerEnv = getServerEnv()): BrainClientConfig {
  const projectId = env.BRAIN_PROJECT_ID ?? env.BRAIN_PROJECT_SLUG;

  if (!env.BRAIN_API_KEY || !projectId) {
    throw new BrainAdapterError(
      "BRAIN_NOT_CONFIGURED",
      "Brain adapter requires BRAIN_API_KEY plus BRAIN_PROJECT_ID or BRAIN_PROJECT_SLUG."
    );
  }

  return {
    apiKey: env.BRAIN_API_KEY,
    baseUrl: env.BRAIN_API_URL,
    projectId,
  };
}

export class BrainHttpClient implements BrainProjectClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly projectId: string;

  constructor(config: BrainClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetcher = config.fetcher ?? fetch;
    this.projectId = config.projectId;
  }

  async projectRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return this.request<T>(
      `/api/v1/brain/${encodeURIComponent(this.projectId)}${normalizedPath}`,
      init
    );
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const headers = new Headers(init.headers);

    headers.set("x-api-key", this.apiKey);
    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetcher(`${this.baseUrl}${normalizedPath}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new BrainAdapterError(
        "BRAIN_API_ERROR",
        `Brain API ${response.status}: ${await response.text()}`,
        {
          path: normalizedPath,
          status: response.status,
        }
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return text.trim() ? (JSON.parse(text) as T) : (undefined as T);
  }
}

export function createBrainHttpClient(
  config: BrainClientConfig = createBrainClientConfigFromEnv()
) {
  return new BrainHttpClient(config);
}
