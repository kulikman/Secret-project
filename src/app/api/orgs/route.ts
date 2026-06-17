import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  apiError,
  apiOk,
  apiUnauthorized,
  apiValidationError,
  createApiRequestContext,
} from "@/lib/api-response";
import { getApiUser } from "@/lib/api-auth";
import { createOrgForUser, getCreateOrgErrorResponse, getUserOrgs } from "@/features/orgs";
import { logger } from "@/lib/logger";

const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

/** GET /api/orgs — list the current user's organizations. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const user = await getApiUser();
  if (!user) return apiUnauthorized("Unauthorized", apiContext);

  const orgs = await getUserOrgs();
  return apiOk({ orgs }, undefined, apiContext);
}

/** POST /api/orgs — create a new organization. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const user = await getApiUser();
  if (!user) return apiUnauthorized("Unauthorized", apiContext);

  const body = await request.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error, { status: 422 }, apiContext);
  }

  try {
    const org = await createOrgForUser({ ...parsed.data, userId: user.id });
    return apiOk({ org }, { status: 201 }, apiContext);
  } catch (error) {
    logger.error("org create failed", error, { requestId: apiContext.requestId });
    const response = getCreateOrgErrorResponse(error);
    return apiError(response.error, { status: response.status }, apiContext);
  }
}
