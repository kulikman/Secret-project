import { NextResponse, type NextRequest } from "next/server";

import { listPublishedTopics } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = paginationSchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return apiValidationError("Invalid pagination params");
  }

  try {
    const data = await listPublishedTopics(parsed.data);
    return apiOk(data);
  } catch {
    return apiError("Could not load topics", { status: 500 });
  }
}
