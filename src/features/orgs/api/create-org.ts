import "server-only";

import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { createOrg } from "../lib/org";

export async function createOrgForUser(params: {
  name: string;
  slug: string;
  userId: string;
}): Promise<{ id: string; slug: string }> {
  const org = await createOrg(params);

  await writeAuditLog({
    userId: params.userId,
    action: "profile.updated",
    resource: `organization:${org.id}`,
    metadata: { event: "org_created", slug: org.slug },
  });

  logger.info("org created", { orgId: org.id, userId: params.userId });
  return org;
}

export function getCreateOrgErrorResponse(error: unknown): { error: string; status: number } {
  const message = error instanceof Error ? error.message : "Failed to create organization";
  if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
    return { error: "That slug is already taken.", status: 409 };
  }

  return { error: message, status: 500 };
}
