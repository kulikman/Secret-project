import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";
import { nodeProjectionNodeTypeSchema, sourceRefSchema } from "../lib/projection";

type NodeProjectionRow = Tables<"node_projection">;

const MAP_PROJECTION_SELECT =
  "id,brain_node_id,node_type,slug,title,summary,content,source_refs,published_at,updated_at" as const;

const relatedNodeRefSchema = z
  .object({
    nodeId: z.string().min(1),
    reason: z.string().trim().min(1).max(500).optional(),
    relation: z.string().trim().min(1).max(80).optional(),
  })
  .catchall(z.unknown());

const mapContentSchema = z
  .object({
    related_node_refs: z.array(relatedNodeRefSchema).optional(),
  })
  .catchall(z.unknown());

export const listPublishedMapGraphSchema = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  nodeTypes: z.array(nodeProjectionNodeTypeSchema).max(7).optional(),
  q: z.string().trim().min(1).max(120).optional(),
});

export const getPublishedMapNodeSchema = z.object({
  id: z.string().trim().min(1).max(200),
});

export const getPublishedMapNeighborsSchema = getPublishedMapNodeSchema.extend({
  limit: z.number().int().min(1).max(100).default(25),
});

export const searchPublishedMapNodesSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  nodeTypes: z.array(nodeProjectionNodeTypeSchema).max(7).optional(),
  q: z.string().trim().min(1).max(120),
});

export type ListPublishedMapGraphInput = z.input<typeof listPublishedMapGraphSchema>;
export type GetPublishedMapNodeInput = z.input<typeof getPublishedMapNodeSchema>;
export type GetPublishedMapNeighborsInput = z.input<typeof getPublishedMapNeighborsSchema>;
export type SearchPublishedMapNodesInput = z.input<typeof searchPublishedMapNodesSchema>;

export interface PublishedMapNode {
  id: string;
  brainNodeId: string;
  isProjected: boolean;
  nodeType: string;
  projectionId: string | null;
  publishedAt: string | null;
  slug: string | null;
  summary: string | null;
  title: string;
  updatedAt: string | null;
}

export interface PublishedMapEdge {
  id: string;
  kind: "related" | "source";
  reason: string | null;
  relation: string;
  resolved: boolean;
  sourceId: string;
  targetId: string;
}

export interface PublishedMapGraph {
  edges: PublishedMapEdge[];
  nodes: PublishedMapNode[];
}

export interface PublishedMapSearchResult {
  items: PublishedMapNode[];
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function escapeIlikeQuery(value: string): string {
  return value.replace(/[,%]/g, "\\$&");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createEdgeId(parts: string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join(":");
}

function getRelatedRefs(content: Json): Array<z.infer<typeof relatedNodeRefSchema>> {
  const parsed = mapContentSchema.safeParse(content);
  return parsed.success ? (parsed.data.related_node_refs ?? []) : [];
}

function getSourceRefs(sourceRefs: Json): Array<z.infer<typeof sourceRefSchema>> {
  const parsed = z.array(sourceRefSchema).safeParse(sourceRefs);
  return parsed.success ? parsed.data : [];
}

function getRefTitle(ref: Record<string, unknown>, fallback: string): string {
  const title = ref.title ?? ref.label;
  return typeof title === "string" && title.trim() ? title.trim() : fallback;
}

function toPublishedMapNode(row: NodeProjectionRow): PublishedMapNode {
  return {
    brainNodeId: row.brain_node_id,
    id: row.brain_node_id,
    isProjected: true,
    nodeType: row.node_type,
    projectionId: row.id,
    publishedAt: row.published_at,
    slug: row.slug,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function toReferenceMapNode(input: { id: string; title?: string }): PublishedMapNode {
  return {
    brainNodeId: input.id,
    id: input.id,
    isProjected: false,
    nodeType: "reference",
    projectionId: null,
    publishedAt: null,
    slug: null,
    summary: null,
    title: input.title?.trim() || input.id,
    updatedAt: null,
  };
}

function createRowIndexes(rows: NodeProjectionRow[]) {
  return {
    byBrainNodeId: new Map(rows.map((row) => [row.brain_node_id, row])),
    byProjectionId: new Map(rows.map((row) => [row.id, row])),
  };
}

function resolveReferenceId(
  rawNodeId: string,
  indexes: ReturnType<typeof createRowIndexes>
): string {
  return (
    indexes.byBrainNodeId.get(rawNodeId)?.brain_node_id ??
    indexes.byProjectionId.get(rawNodeId)?.brain_node_id ??
    rawNodeId
  );
}

function buildPublishedMapGraph(
  rows: NodeProjectionRow[],
  options: {
    edgeSourceRows?: NodeProjectionRow[];
    includeReferenceNodes?: boolean;
  } = {}
): PublishedMapGraph {
  const indexes = createRowIndexes(rows);
  const nodeById = new Map<string, PublishedMapNode>();
  const edgeById = new Map<string, PublishedMapEdge>();

  for (const row of rows) {
    const node = toPublishedMapNode(row);
    nodeById.set(node.id, node);
  }

  for (const row of options.edgeSourceRows ?? rows) {
    const sourceId = row.brain_node_id;

    for (const ref of getRelatedRefs(row.content)) {
      const targetId = resolveReferenceId(ref.nodeId, indexes);
      const resolved = indexes.byBrainNodeId.has(targetId);
      const edgeId = createEdgeId([sourceId, "related", ref.relation ?? "related", targetId]);

      edgeById.set(edgeId, {
        id: edgeId,
        kind: "related",
        reason: ref.reason ?? null,
        relation: ref.relation ?? "related",
        resolved,
        sourceId,
        targetId,
      });

      if (options.includeReferenceNodes && !resolved && !nodeById.has(targetId)) {
        nodeById.set(
          targetId,
          toReferenceMapNode({ id: targetId, title: getRefTitle(ref, targetId) })
        );
      }
    }

    for (const ref of getSourceRefs(row.source_refs)) {
      const targetId = resolveReferenceId(ref.nodeId, indexes);
      const resolved = indexes.byBrainNodeId.has(targetId);
      const edgeId = createEdgeId([sourceId, "source", targetId]);

      edgeById.set(edgeId, {
        id: edgeId,
        kind: "source",
        reason: null,
        relation: "source",
        resolved,
        sourceId,
        targetId,
      });

      if (options.includeReferenceNodes && !resolved && !nodeById.has(targetId)) {
        nodeById.set(targetId, toReferenceMapNode({ id: targetId, title: ref.title }));
      }
    }
  }

  return {
    edges: [...edgeById.values()],
    nodes: [...nodeById.values()],
  };
}

async function listPublishedMapRows(input: {
  limit: number;
  nodeTypes?: Array<z.infer<typeof nodeProjectionNodeTypeSchema>>;
  q?: string;
}): Promise<NodeProjectionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("node_projection")
    .select(MAP_PROJECTION_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (input.nodeTypes?.length) {
    query = query.in("node_type", input.nodeTypes);
  }

  if (input.q) {
    const escapedQuery = escapeIlikeQuery(input.q);
    query = query.or(
      `title.ilike.%${escapedQuery}%,summary.ilike.%${escapedQuery}%,slug.ilike.%${escapedQuery}%`
    );
  }

  const { data, error } = await query.range(0, input.limit - 1);

  if (error) throw error;

  return (data ?? []) as NodeProjectionRow[];
}

async function listPublishedMapRowsByIdentifiers(
  identifiers: string[]
): Promise<NodeProjectionRow[]> {
  const uniqueIdentifiers = uniqueStrings(identifiers);
  if (uniqueIdentifiers.length === 0) return [];

  const supabase = await createClient();
  const queries = [
    supabase
      .from("node_projection")
      .select(MAP_PROJECTION_SELECT)
      .eq("status", "published")
      .in("brain_node_id", uniqueIdentifiers)
      .limit(uniqueIdentifiers.length),
  ];

  const uuidIdentifiers = uniqueIdentifiers.filter(isUuid);
  if (uuidIdentifiers.length) {
    queries.push(
      supabase
        .from("node_projection")
        .select(MAP_PROJECTION_SELECT)
        .eq("status", "published")
        .in("id", uuidIdentifiers)
        .limit(uuidIdentifiers.length)
    );
  }

  const results = await Promise.all(queries);
  const rowsById = new Map<string, NodeProjectionRow>();

  for (const result of results) {
    if (result.error) throw result.error;
    for (const row of result.data ?? []) {
      rowsById.set(row.id, row as NodeProjectionRow);
    }
  }

  return [...rowsById.values()];
}

async function getPublishedMapProjectionRow(id: string): Promise<NodeProjectionRow | null> {
  const supabase = await createClient();
  const idColumn = isUuid(id) ? "id" : "brain_node_id";

  const { data, error } = await supabase
    .from("node_projection")
    .select(MAP_PROJECTION_SELECT)
    .eq("status", "published")
    .eq(idColumn, id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as NodeProjectionRow;
  if (!isUuid(id)) return null;

  const { data: brainData, error: brainError } = await supabase
    .from("node_projection")
    .select(MAP_PROJECTION_SELECT)
    .eq("status", "published")
    .eq("brain_node_id", id)
    .maybeSingle();

  if (brainError) throw brainError;

  return brainData ? (brainData as NodeProjectionRow) : null;
}

export async function listPublishedMapGraph(
  input: ListPublishedMapGraphInput = {}
): Promise<PublishedMapGraph> {
  const parsed = listPublishedMapGraphSchema.parse(input);
  const rows = await listPublishedMapRows(parsed);

  return buildPublishedMapGraph(rows, { includeReferenceNodes: true });
}

export async function getPublishedMapNode(
  input: GetPublishedMapNodeInput
): Promise<PublishedMapNode | null> {
  const parsed = getPublishedMapNodeSchema.parse(input);
  const row = await getPublishedMapProjectionRow(parsed.id);

  return row ? toPublishedMapNode(row) : null;
}

export async function getPublishedMapNeighbors(
  input: GetPublishedMapNeighborsInput
): Promise<PublishedMapGraph | null> {
  const parsed = getPublishedMapNeighborsSchema.parse(input);
  const rootRow = await getPublishedMapProjectionRow(parsed.id);
  if (!rootRow) return null;

  const relatedIds = getRelatedRefs(rootRow.content).map((ref) => ref.nodeId);
  const sourceIds = getSourceRefs(rootRow.source_refs).map((ref) => ref.nodeId);
  const referencedRows = await listPublishedMapRowsByIdentifiers(
    uniqueStrings([...relatedIds, ...sourceIds]).slice(0, parsed.limit)
  );
  const rowsById = new Map<string, NodeProjectionRow>();

  for (const row of [rootRow, ...referencedRows]) {
    rowsById.set(row.id, row);
  }

  return buildPublishedMapGraph([...rowsById.values()], {
    edgeSourceRows: [rootRow],
    includeReferenceNodes: true,
  });
}

export async function searchPublishedMapNodes(
  input: SearchPublishedMapNodesInput
): Promise<PublishedMapSearchResult> {
  const parsed = searchPublishedMapNodesSchema.parse(input);
  const rows = await listPublishedMapRows(parsed);

  return {
    items: rows.map(toPublishedMapNode),
  };
}
