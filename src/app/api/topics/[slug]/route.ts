import { NextResponse, type NextRequest } from "next/server";

import { getPublishedTopicBySlug } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const { slug } = await context.params;

  if (!slug) {
    return apiValidationError("Topic slug is required", { status: 422 }, apiContext);
  }

  try {
    const topic = await getPublishedTopicBySlug(slug);

    if (!topic) {
      return apiError("Topic not found", { status: 404 }, apiContext);
    }

    return apiOk({ topic }, undefined, apiContext);
  } catch {
    return apiError("Could not load topic", { status: 500 }, apiContext);
  }
}
