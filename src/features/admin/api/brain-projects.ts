import "server-only";

import { z } from "zod";

import { requireAdminRole } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

const DELETE_ROLES = ["super_admin", "admin"] as const;

const brainProjectDeleteInputSchema = z.object({
  refs: z.string().trim().min(1, "Добавьте хотя бы один slug или URL проекта."),
  confirmation: z.literal("DELETE"),
});

const PROJECT_URL_PATTERN = /\/projects\/([a-z0-9-]+)\/?$/i;

export interface BrainProjectDeleteItemResult {
  ref: string;
  projectRef: string;
  ok: boolean;
  message: string;
}

export interface BrainProjectDeleteResult {
  ok: boolean;
  deletedCount: number;
  failedCount: number;
  items: BrainProjectDeleteItemResult[];
}

function normalizeProjectRef(input: string): string {
  const value = input.trim();
  if (!value) return "";

  const urlMatch = value.match(PROJECT_URL_PATTERN);
  if (urlMatch?.[1]) return urlMatch[1];

  return value.replace(/^\/+|\/+$/g, "");
}

function splitRefs(rawRefs: string): string[] {
  return rawRefs
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveDeleteEndpoint(input: {
  apiUrl: string;
  projectRef: string;
  template: string;
}): string {
  const path = input.template.replace("{projectRef}", encodeURIComponent(input.projectRef));
  if (/^https?:\/\//i.test(path)) return path;

  const prefix = input.apiUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${suffix}`;
}

export async function deleteArchivedBrainProjects(input: {
  refs: string;
  confirmation: string;
}): Promise<BrainProjectDeleteResult> {
  const { role, userId } = await requireAdminRole(DELETE_ROLES);
  const parsed = brainProjectDeleteInputSchema.parse(input);
  const env = getServerEnv();

  const apiKey = env.BRAIN_ADMIN_API_KEY ?? env.BRAIN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BRAIN_ADMIN_API_KEY or BRAIN_API_KEY is required for archived Brain project deletion."
    );
  }

  const refs = splitRefs(parsed.refs);
  const items: BrainProjectDeleteItemResult[] = [];
  const deleteEndpointTemplate = env.BRAIN_PROJECT_DELETE_ENDPOINT_TEMPLATE;

  if (!deleteEndpointTemplate) {
    return {
      ok: false,
      deletedCount: 0,
      failedCount: refs.length,
      items: refs.map((ref) => {
        const projectRef = normalizeProjectRef(ref);

        return {
          ref,
          projectRef,
          ok: false,
          message:
            "Удаление заблокировано: в текущем Brain HTTP-контракте нет подтвержденного project delete endpoint.",
        };
      }),
    };
  }

  for (const ref of refs) {
    const projectRef = normalizeProjectRef(ref);

    if (!projectRef) {
      items.push({
        ref,
        projectRef,
        ok: false,
        message: "Не удалось извлечь slug проекта.",
      });
      continue;
    }

    try {
      const response = await fetch(
        resolveDeleteEndpoint({
          apiUrl: env.BRAIN_API_URL,
          projectRef,
          template: deleteEndpointTemplate,
        }),
        {
          method: "DELETE",
          headers: {
            "x-api-key": apiKey,
          },
          cache: "no-store",
        }
      );

      const payload = (await response.json().catch(() => null)) as {
        deletedProject?: { slug?: string; name?: string };
        error?: string;
      } | null;

      if (!response.ok) {
        items.push({
          ref,
          projectRef,
          ok: false,
          message: payload?.error ?? `Brain API error ${response.status}`,
        });
        continue;
      }

      const deletedSlug = payload?.deletedProject?.slug ?? projectRef;
      const deletedName = payload?.deletedProject?.name ?? deletedSlug;

      items.push({
        ref,
        projectRef: deletedSlug,
        ok: true,
        message: `Brain accepted deletion for project "${deletedName}". Verify cascade cleanup in Brain/OS.`,
      });

      await writeAuditLog({
        userId,
        action: "admin.brain_project_deleted",
        resource: `brain-project:${deletedSlug}`,
        metadata: {
          actorRole: role,
          inputRef: ref,
          resolvedRef: projectRef,
          deletedSlug,
        },
      });
    } catch (error) {
      items.push({
        ref,
        projectRef,
        ok: false,
        message: error instanceof Error ? error.message : "Unknown delete error",
      });
    }
  }

  const deletedCount = items.filter((item) => item.ok).length;
  const failedCount = items.length - deletedCount;

  return {
    ok: failedCount === 0,
    deletedCount,
    failedCount,
    items,
  };
}
