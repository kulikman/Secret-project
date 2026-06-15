"use server";

import { createOrg } from "../lib/org";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/auth";

interface CreateOrgInput {
  name: string;
  slug: string;
}

type CreateOrgResult = { ok: true } | { ok: false; error: string };

/**
 * Server Action: create a new organization.
 * Called from OrgCreateForm (client component).
 */
export async function createOrgAction(input: CreateOrgInput): Promise<CreateOrgResult> {
  const user = await requireUser();
  const name = input.name.trim();
  const slug = input.slug.trim();

  if (!name || name.length > 100) return { ok: false, error: "Name must be 1–100 characters." };
  if (!/^[a-z0-9-]{2,48}$/.test(slug))
    return { ok: false, error: "Slug must be 2–48 lowercase letters, numbers, or hyphens." };

  try {
    await createOrg({ name, slug, userId: user.id });
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create organization.";
    logger.error("createOrgAction failed", error);
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "That slug is already taken. Choose a different one." };
    }
    return { ok: false, error: msg };
  }
}
