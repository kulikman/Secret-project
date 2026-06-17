import { NextResponse, type NextRequest } from "next/server";

import { getPublishedSourceById } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const { id } = await context.params;

  if (!id) {
    return apiValidationError("Source id is required", { status: 422 }, apiContext);
  }

  try {
    const source = await getPublishedSourceById(id);

    if (!source) {
      return apiError("Source not found", { status: 404 }, apiContext);
    }

    return apiOk({ source }, undefined, apiContext);
  } catch {
    return apiError("Could not load source", { status: 500 }, apiContext);
  }
}
