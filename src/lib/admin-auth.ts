import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "editor",
  "curator",
  "support",
  "viewer",
] as const satisfies readonly AdminRole[];

export const APPLICATION_MODERATION_ROLES = [
  "super_admin",
  "admin",
  "curator",
] as const satisfies readonly AdminRole[];

export const AWAKENING_MAP_REVIEW_ROLES = [
  "super_admin",
  "admin",
  "editor",
  "curator",
] as const satisfies readonly AdminRole[];

export const PROMPT_TEMPLATE_EDITOR_ROLES = [
  "super_admin",
  "admin",
  "editor",
] as const satisfies readonly AdminRole[];

export class AdminAccessDeniedError extends Error {
  constructor(readonly role: AdminRole | null) {
    super("Admin access denied");
    this.name = "AdminAccessDeniedError";
  }
}

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function hasAdminRole(
  role: AdminRole | null | undefined,
  allowedRoles: readonly AdminRole[]
): role is AdminRole {
  return isAdminRole(role) && allowedRoles.includes(role);
}

export function assertAdminRole(
  role: AdminRole | null | undefined,
  allowedRoles: readonly AdminRole[] = ADMIN_ROLES
): AdminRole {
  if (!hasAdminRole(role, allowedRoles)) {
    throw new AdminAccessDeniedError(isAdminRole(role) ? role : null);
  }

  return role;
}

export async function getUserAdminRole(userId: string): Promise<AdminRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_role_assignments")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read admin role: ${error.message}`);
  }

  return isAdminRole(data?.role) ? data.role : null;
}

export async function requireAdminRole(
  allowedRoles: readonly AdminRole[] = ADMIN_ROLES
): Promise<{ role: AdminRole; userId: string }> {
  const user = await requireUser();
  const role = await getUserAdminRole(user.id);

  return {
    userId: user.id,
    role: assertAdminRole(role, allowedRoles),
  };
}
