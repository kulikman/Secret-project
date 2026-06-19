import { NextResponse, type NextRequest } from "next/server";

import { getPublishedMapNode } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const { id } = await context.params;

  if (!id?.trim()) {
    return apiValidationError("Map node id is required", { status: 422 }, apiContext);
  }

  try {
    const node = await getPublishedMapNode({ id });

    if (!node) {
      return apiError("Map node not found", { status: 404 }, apiContext);
    }

    return apiOk({ node }, undefined, apiContext);
  } catch {
    return apiError("Could not load map node", { status: 500 }, apiContext);
  }
}
