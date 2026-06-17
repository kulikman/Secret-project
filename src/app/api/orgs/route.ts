import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiOk, apiUnauthorized, apiValidationError } from "@/lib/api-response";
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
export async function GET(): Promise<NextResponse> {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const orgs = await getUserOrgs();
  return apiOk({ orgs });
}

/** POST /api/orgs — create a new organization. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  try {
    const org = await createOrgForUser({ ...parsed.data, userId: user.id });
    return apiOk({ org }, { status: 201 });
  } catch (error) {
    logger.error("org create failed", error);
    const response = getCreateOrgErrorResponse(error);
    return apiError(response.error, { status: response.status });
  }
}
