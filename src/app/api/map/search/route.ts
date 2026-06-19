import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { nodeProjectionNodeTypeSchema, searchPublishedMapNodes } from "@/features/knowledge";
import { apiError, apiOk, apiValidationError, createApiRequestContext } from "@/lib/api-response";

const nodeTypesQuerySchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(nodeProjectionNodeTypeSchema).max(7).optional());

const searchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  nodeTypes: nodeTypesQuerySchema,
  q: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const parsed = searchQuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    nodeTypes: request.nextUrl.searchParams.get("nodeTypes") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) {
    return apiValidationError(parsed.error, { status: 422 }, apiContext);
  }

  try {
    const data = await searchPublishedMapNodes(parsed.data);
    return apiOk(data, undefined, apiContext);
  } catch {
    return apiError("Could not search map nodes", { status: 500 }, apiContext);
  }
}
