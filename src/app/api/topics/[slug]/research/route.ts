import { NextResponse, type NextRequest } from "next/server";

import { getPublishedTopicBySlug } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";
import {
  createPerplexityTopicResearch,
  PerplexityApiError,
  PerplexityNotConfiguredError,
} from "@/lib/perplexity/client";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const { slug } = await context.params;

  if (!slug) {
    return apiValidationError("Topic slug is required", { status: 422 }, apiContext);
  }

  try {
    const topic = await getPublishedTopicBySlug(slug);
    if (!topic) return apiError("Topic not found", { status: 404 }, apiContext);

    const research = await createPerplexityTopicResearch({
      slug,
      summary: topic.summary,
      title: topic.title,
    });

    return apiOk({ research }, undefined, apiContext);
  } catch (error) {
    if (error instanceof PerplexityNotConfiguredError) {
      return apiOk({ research: null, status: "not_configured" }, undefined, apiContext);
    }

    if (error instanceof PerplexityApiError) {
      return apiError("Perplexity research failed", { status: error.status ?? 502 }, apiContext);
    }

    return apiError("Could not generate topic research", { status: 500 }, apiContext);
  }
}
