import { NextResponse, type NextRequest } from "next/server";

import { getPublishedTopicBySlug } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!slug) {
    return apiValidationError("Topic slug is required");
  }

  try {
    const topic = await getPublishedTopicBySlug(slug);

    if (!topic) {
      return apiError("Topic not found", { status: 404 });
    }

    return apiOk({ topic });
  } catch {
    return apiError("Could not load topic", { status: 500 });
  }
}
