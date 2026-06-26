import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.signup"
  | "auth.password_reset_requested"
  | "auth.password_reset_completed"
  | "admin.awakening_graph_edge_created"
  | "admin.awakening_graph_edge_updated"
  | "admin.awakening_projection_updated"
  | "admin.awakening_reference_cluster_updated"
  | "admin.awakening_topic_reviewed"
  | "admin.role_assigned"
  | "admin.role_revoked"
  | "admin.application_status_changed"
  | "admin.brain_project_deleted"
  | "admin.dossier_draft_created"
  | "admin.prompt_template_updated"
  | "admin.generated_content_published"
  | "profile.updated"
  | "profile.deleted";

interface AuditParams {
  userId: string | null;
  action: AuditAction;
  /** e.g. "application:uuid", "profile:uuid" */
  resource?: string;
  /** Extra structured data: IP, user-agent, diff, etc. */
  metadata?: Json;
}

/**
 * Write an immutable audit log entry via the service-role client.
 *
 * Never throws — a failed audit write must not crash the caller.
 * The entry is best-effort; callers should not depend on it for correctness.
 *
 * @example
 *   await writeAuditLog({ userId: user.id, action: "auth.login", metadata: { ip } })
 */
export async function writeAuditLog({
  userId,
  action,
  resource,
  metadata = {},
}: AuditParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource: resource ?? null,
      metadata,
    });
    if (error) throw error;
  } catch (error) {
    // Audit failure must never crash the caller.
    logger.error("audit log write failed", error, { action, userId });
  }
}
