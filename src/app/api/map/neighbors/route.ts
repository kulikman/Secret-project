import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getPublishedMapNeighbors } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";

const neighborsQuerySchema = z.object({
  id: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const parsed = neighborsQuerySchema.safeParse({
    id: request.nextUrl.searchParams.get("id") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return apiValidationError(parsed.error, { status: 422 }, apiContext);
  }

  try {
    const graph = await getPublishedMapNeighbors(parsed.data);

    if (!graph) {
      return apiError("Map node not found", { status: 404 }, apiContext);
    }

    return apiOk({ graph }, undefined, apiContext);
  } catch {
    return apiError("Could not load map neighbors", { status: 500 }, apiContext);
  }
}
