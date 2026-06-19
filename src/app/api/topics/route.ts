import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { listPublishedTopics } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";

const listTopicsQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const parsed = listTopicsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) {
    return apiValidationError("Invalid pagination params", { status: 422 }, apiContext);
  }

  try {
    const data = await listPublishedTopics(parsed.data);
    return apiOk(data, undefined, apiContext);
  } catch {
    return apiError("Could not load topics", { status: 500 }, apiContext);
  }
}
