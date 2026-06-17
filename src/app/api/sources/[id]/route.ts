import { NextResponse, type NextRequest } from "next/server";

import { getPublishedSourceById } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;

  if (!id) {
    return apiValidationError("Source id is required");
  }

  try {
    const source = await getPublishedSourceById(id);

    if (!source) {
      return apiError("Source not found", { status: 404 });
    }

    return apiOk({ source });
  } catch {
    return apiError("Could not load source", { status: 500 });
  }
}
