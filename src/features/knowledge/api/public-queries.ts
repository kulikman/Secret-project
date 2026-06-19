import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";

export interface ProjectionPaginationInput {
  page?: number;
  limit?: number;
  q?: string;
}

export interface ProjectionPagination {
  page: number;
  limit: number;
  total: number | null;
  hasMore: boolean;
}

type NodeProjectionRow = Tables<"node_projection">;

export type PublicNodeProjection = Pick<
  NodeProjectionRow,
  | "id"
  | "brain_node_id"
  | "node_type"
  | "slug"
  | "title"
  | "summary"
  | "content"
  | "source_refs"
  | "published_at"
  | "updated_at"
>;

export interface PublishedProjectionList {
  items: PublicNodeProjection[];
  pagination: ProjectionPagination;
}

const PUBLIC_PROJECTION_SELECT =
  "id,brain_node_id,node_type,slug,title,summary,content,source_refs,published_at,updated_at" as const;

function normalizePagination(input: ProjectionPaginationInput = {}) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toPublicNodeProjection(row: PublicNodeProjection): PublicNodeProjection {
  return {
    id: row.id,
    brain_node_id: row.brain_node_id,
    node_type: row.node_type,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content as Json,
    source_refs: row.source_refs as Json,
    published_at: row.published_at,
    updated_at: row.updated_at,
  };
}

export async function listPublishedTopics(
  input: ProjectionPaginationInput = {}
): Promise<PublishedProjectionList> {
  const supabase = await createClient();
  const { page, limit, from, to } = normalizePagination(input);
  const queryText = input.q?.trim();

  let query = supabase
    .from("node_projection")
    .select(PUBLIC_PROJECTION_SELECT, { count: "exact" })
    .eq("status", "published")
    .eq("node_type", "topic")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (queryText) {
    const escapedQuery = queryText.replace(/[,%]/g, "\\$&");
    query = query.or(
      `title.ilike.%${escapedQuery}%,summary.ilike.%${escapedQuery}%,slug.ilike.%${escapedQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const items = (data ?? []).map(toPublicNodeProjection);
  const total = count ?? null;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      hasMore: total === null ? items.length === limit : to + 1 < total,
    },
  };
}

export async function getPublishedTopicBySlug(slug: string): Promise<PublicNodeProjection | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("node_projection")
    .select(PUBLIC_PROJECTION_SELECT)
    .eq("status", "published")
    .eq("node_type", "topic")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toPublicNodeProjection(data) : null;
}

export async function getPublishedSourceById(id: string): Promise<PublicNodeProjection | null> {
  const supabase = await createClient();
  const idColumn = isUuid(id) ? "id" : "brain_node_id";

  const { data, error } = await supabase
    .from("node_projection")
    .select(PUBLIC_PROJECTION_SELECT)
    .eq("status", "published")
    .eq("node_type", "source")
    .eq(idColumn, id)
    .maybeSingle();

  if (error) throw error;

  return data ? toPublicNodeProjection(data) : null;
}
