import "server-only";

import { z } from "zod";

import {
  awakeningReferenceBoundsSchema,
  awakeningReferenceClusterSchema,
  awakeningReferenceClusters,
  awakeningReferenceMatcherSchema,
  type AwakeningReferenceCluster,
} from "../lib/reference-map";
import { AWAKENING_MAP_REVIEW_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const REFERENCE_CLUSTER_SELECT =
  "id,group_id,label,summary,bounds,key_topics,keywords,matcher,related_cluster_ids,status,created_at,updated_at" as const;

export const awakeningReferenceClusterStatusSchema = z.enum([
  "draft",
  "review",
  "published",
  "archived",
]);

export const listAwakeningReferenceClustersSchema = z.object({
  includeFallback: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(50),
  status: awakeningReferenceClusterStatusSchema.optional(),
});

export const updateAwakeningReferenceClusterSchema = z.object({
  bounds: awakeningReferenceBoundsSchema,
  clusterId: z.string().trim().min(1),
  groupId: awakeningReferenceClusterSchema.shape.groupId,
  keyTopics: z.array(z.string().trim().min(1)).min(2).max(6),
  keywords: z.array(z.string().trim().min(1)).min(1).max(20),
  label: z.string().trim().min(1).max(160),
  matcher: awakeningReferenceMatcherSchema,
  relatedClusterIds: z.array(z.string().trim().min(1)).max(5).default([]),
  status: awakeningReferenceClusterStatusSchema,
  summary: z.string().trim().min(1).max(320),
});

export type AwakeningReferenceClusterStatus = z.infer<typeof awakeningReferenceClusterStatusSchema>;
export type ListAwakeningReferenceClustersInput = z.input<
  typeof listAwakeningReferenceClustersSchema
>;
export type UpdateAwakeningReferenceClusterInput = z.input<
  typeof updateAwakeningReferenceClusterSchema
>;

interface ReferenceClusterRow {
  bounds: Json;
  created_at: string;
  group_id: string;
  id: string;
  key_topics: Json;
  keywords: Json;
  label: string;
  matcher: Json;
  related_cluster_ids: Json;
  status: string;
  summary: string;
  updated_at: string;
}

interface ReferenceClusterUpsert {
  bounds: Json;
  group_id: string;
  key_topics: Json;
  keywords: Json;
  label: string;
  matcher: Json;
  related_cluster_ids: Json;
  status: string;
  summary: string;
}

interface ReferenceClusterQueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface ReferenceClusterQueryBuilder {
  eq(column: string, value: string): ReferenceClusterQueryBuilder;
  limit(count: number): Promise<ReferenceClusterQueryResult<ReferenceClusterRow[]>>;
  maybeSingle(): Promise<ReferenceClusterQueryResult<ReferenceClusterRow>>;
  order(column: string, options: { ascending: boolean }): ReferenceClusterQueryBuilder;
  select(columns: string): ReferenceClusterQueryBuilder;
  single(): Promise<ReferenceClusterQueryResult<ReferenceClusterRow>>;
  update(value: ReferenceClusterUpsert): ReferenceClusterQueryBuilder;
}

interface ReferenceClusterTableClient {
  from(relation: "awakening_reference_clusters"): ReferenceClusterQueryBuilder;
}

export interface AdminAwakeningReferenceCluster extends AwakeningReferenceCluster {
  createdAt: string | null;
  status: AwakeningReferenceClusterStatus;
  updatedAt: string | null;
}

export class AwakeningReferenceClusterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AwakeningReferenceClusterError";
  }
}

function toReferenceClusterClient(client: unknown): ReferenceClusterTableClient {
  return client as ReferenceClusterTableClient;
}

function isMissingReferenceClusterTableError(error: { message?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();

  return (
    message.includes("awakening_reference_clusters") &&
    (message.includes("does not exist") ||
      message.includes("not found") ||
      message.includes("could not find"))
  );
}

function toReferenceCluster(row: ReferenceClusterRow): AdminAwakeningReferenceCluster {
  const cluster = awakeningReferenceClusterSchema.parse({
    bounds: row.bounds,
    groupId: row.group_id,
    id: row.id,
    keyTopics: row.key_topics,
    keywords: row.keywords,
    label: row.label,
    matcher: row.matcher,
    relatedClusterIds: row.related_cluster_ids,
    summary: row.summary,
  });

  return {
    ...cluster,
    createdAt: row.created_at,
    status: awakeningReferenceClusterStatusSchema.parse(row.status),
    updatedAt: row.updated_at,
  };
}

function toStaticAdminCluster(cluster: AwakeningReferenceCluster): AdminAwakeningReferenceCluster {
  return {
    ...cluster,
    createdAt: null,
    status: "published",
    updatedAt: null,
  };
}

function createReferenceClusterUpdate(
  input: z.infer<typeof updateAwakeningReferenceClusterSchema>
): ReferenceClusterUpsert {
  return {
    bounds: input.bounds as Json,
    group_id: input.groupId,
    key_topics: input.keyTopics as Json,
    keywords: input.keywords as Json,
    label: input.label,
    matcher: input.matcher as Json,
    related_cluster_ids: input.relatedClusterIds as Json,
    status: input.status,
    summary: input.summary,
  };
}

export async function listPublishedAwakeningReferenceClusters(): Promise<
  AwakeningReferenceCluster[]
> {
  const supabase = await createClient();
  const { data, error } = await toReferenceClusterClient(supabase)
    .from("awakening_reference_clusters")
    .select(REFERENCE_CLUSTER_SELECT)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingReferenceClusterTableError(error)) return [...awakeningReferenceClusters];
    throw new AwakeningReferenceClusterError(
      `Failed to list published reference clusters: ${error.message}`
    );
  }

  const clusters = (data ?? []).map((row) => toReferenceCluster(row));
  return clusters.length > 0 ? clusters : [...awakeningReferenceClusters];
}

export async function listAdminAwakeningReferenceClusters(
  input: ListAwakeningReferenceClustersInput = {}
): Promise<AdminAwakeningReferenceCluster[]> {
  const filters = listAwakeningReferenceClustersSchema.parse(input);
  await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);

  const supabase = createAdminClient();
  let query = toReferenceClusterClient(supabase)
    .from("awakening_reference_clusters")
    .select(REFERENCE_CLUSTER_SELECT);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(filters.limit);

  if (error) {
    if (filters.includeFallback && isMissingReferenceClusterTableError(error)) {
      return awakeningReferenceClusters.map((cluster) => toStaticAdminCluster(cluster));
    }

    throw new AwakeningReferenceClusterError(
      `Failed to list admin reference clusters: ${error.message}`
    );
  }

  const clusters = (data ?? []).map((row) => toReferenceCluster(row));
  if (clusters.length > 0) return clusters;
  return filters.includeFallback
    ? awakeningReferenceClusters.map((cluster) => toStaticAdminCluster(cluster))
    : [];
}

export async function updateAwakeningReferenceCluster(
  input: UpdateAwakeningReferenceClusterInput
): Promise<AdminAwakeningReferenceCluster> {
  const parsed = updateAwakeningReferenceClusterSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();
  const table = toReferenceClusterClient(supabase).from("awakening_reference_clusters");

  const { data: current, error: readError } = await table
    .select(REFERENCE_CLUSTER_SELECT)
    .eq("id", parsed.clusterId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningReferenceClusterError(
      `Failed to read reference cluster: ${readError.message}`
    );
  }

  if (!current) throw new AwakeningReferenceClusterError("Reference cluster not found.");

  const { data, error } = await table
    .update(createReferenceClusterUpdate(parsed))
    .eq("id", parsed.clusterId)
    .select(REFERENCE_CLUSTER_SELECT)
    .single();

  if (error) {
    throw new AwakeningReferenceClusterError(
      `Failed to update reference cluster: ${error.message}`
    );
  }

  if (!data)
    throw new AwakeningReferenceClusterError("Updated reference cluster was not returned.");

  await writeAuditLog({
    action: "admin.awakening_reference_cluster_updated",
    metadata: {
      nextStatus: parsed.status,
      previousStatus: current.status,
      title: parsed.label,
    },
    resource: `awakening-reference-cluster:${parsed.clusterId}`,
    userId: actor.userId,
  });

  return toReferenceCluster(data);
}
