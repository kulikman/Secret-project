import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
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
  // requireUser() is the auth gate (redirects on no session); getUserOrgs
  // resolves the user internally via auth.uid().
  await requireUser();
  const orgs = await getUserOrgs();
  return NextResponse.json({ orgs });
}

/** POST /api/orgs — create a new organization. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await requireUser();

  const body = await request.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const org = await createOrgForUser({ ...parsed.data, userId: user.id });
    return NextResponse.json({ org }, { status: 201 });
  } catch (error) {
    logger.error("org create failed", error);
    const response = getCreateOrgErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
