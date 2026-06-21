import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { normalizeGraphRelationType } from "@/lib/graph-relations";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";
import {
  nodeProjectionNodeTypeFilterLimit,
  nodeProjectionNodeTypeSchema,
  sourceRefSchema,
} from "../lib/projection";

type NodeProjectionRow = Tables<"node_projection">;

const MAP_PROJECTION_SELECT =
  "id,brain_node_id,node_type,slug,title,summary,content,source_refs,published_at,updated_at" as const;
const GRAPH_EDGES_SELECT =
  "id,from_node_id,to_node_id,relation_type,strength,source_refs,status,created_at,updated_at" as const;
const GRAPH_EDGE_QUERY_LIMIT = 600;

interface GraphEdgeRow {
  created_at: string;
  from_node_id: string;
  id: string;
  relation_type: string;
  source_refs: Json;
  status: string;
  strength: number | string | null;
  to_node_id: string;
  updated_at: string;
}

interface GraphEdgesDatabase {
  public: {
    Tables: {
      graph_edges: {
        Row: GraphEdgeRow;
        Insert: Partial<Omit<GraphEdgeRow, "created_at" | "id" | "updated_at">> & {
          from_node_id: string;
          relation_type: string;
          to_node_id: string;
        };
        Update: Partial<Omit<GraphEdgeRow, "created_at" | "id" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type GraphEdgeSupabaseClient = SupabaseClient<GraphEdgesDatabase>;

const graphEdgeRowSchema = z
  .object({
    created_at: z.string(),
    from_node_id: z.string().min(1),
    id: z.string().min(1),
    relation_type: z.string().trim().min(1).max(80),
    source_refs: z.unknown(),
    status: z.string(),
    strength: z.union([z.number(), z.string()]).nullable(),
    to_node_id: z.string().min(1),
    updated_at: z.string(),
  })
  .passthrough();

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
  nodeTypes: z
    .array(nodeProjectionNodeTypeSchema)
    .max(nodeProjectionNodeTypeFilterLimit)
    .optional(),
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
  nodeTypes: z
    .array(nodeProjectionNodeTypeSchema)
    .max(nodeProjectionNodeTypeFilterLimit)
    .optional(),
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
  sourceRefs: Json;
  sourceId: string;
  strength: number | null;
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

function createEdgeSemanticKey(input: {
  relation: string;
  sourceId: string;
  targetId: string;
}): string {
  return createEdgeId([input.sourceId, input.relation, input.targetId]);
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

function normalizeGraphEdgeStrength(value: number | string | null): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function parseGraphEdgeRows(data: unknown): GraphEdgeRow[] {
  const parsed = z.array(graphEdgeRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new Error("Invalid graph_edges payload");
  }

  return parsed.data.map((row) => ({
    ...row,
    source_refs: row.source_refs as Json,
  }));
}

function isGraphEdgesUnavailableError(error: { code?: string; message?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("graph_edges") &&
      (message.includes("does not exist") ||
        message.includes("not found") ||
        message.includes("could not find")))
  );
}

function toGraphEdgeClient(
  supabase: Awaited<ReturnType<typeof createClient>>
): GraphEdgeSupabaseClient {
  return supabase as unknown as GraphEdgeSupabaseClient;
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
    graphEdgeRows?: GraphEdgeRow[];
    includeReferenceNodes?: boolean;
  } = {}
): PublishedMapGraph {
  const indexes = createRowIndexes(rows);
  const nodeById = new Map<string, PublishedMapNode>();
  const edgeById = new Map<string, PublishedMapEdge>();
  const explicitEdgeKeys = new Set<string>();

  for (const row of rows) {
    const node = toPublishedMapNode(row);
    nodeById.set(node.id, node);
  }

  for (const edge of options.graphEdgeRows ?? []) {
    const fromRow = indexes.byProjectionId.get(edge.from_node_id);
    const toRow = indexes.byProjectionId.get(edge.to_node_id);
    if (!fromRow || !toRow) continue;

    const sourceId = fromRow.brain_node_id;
    const targetId = toRow.brain_node_id;
    const relation = normalizeGraphRelationType(edge.relation_type);
    const semanticKey = createEdgeSemanticKey({ relation, sourceId, targetId });
    explicitEdgeKeys.add(semanticKey);

    edgeById.set(createEdgeId(["graph", edge.id]), {
      id: createEdgeId(["graph", edge.id]),
      kind: relation === "supported_by" ? "source" : "related",
      reason: null,
      relation,
      resolved: true,
      sourceId,
      sourceRefs: edge.source_refs,
      strength: normalizeGraphEdgeStrength(edge.strength),
      targetId,
    });
  }

  for (const row of options.edgeSourceRows ?? rows) {
    const sourceId = row.brain_node_id;

    for (const ref of getRelatedRefs(row.content)) {
      const targetId = resolveReferenceId(ref.nodeId, indexes);
      const resolved = indexes.byBrainNodeId.has(targetId);
      const relation = normalizeGraphRelationType(ref.relation);
      const semanticKey = createEdgeSemanticKey({ relation, sourceId, targetId });
      if (explicitEdgeKeys.has(semanticKey)) continue;

      const edgeId = createEdgeId([sourceId, "related", relation, targetId]);

      edgeById.set(edgeId, {
        id: edgeId,
        kind: "related",
        reason: ref.reason ?? null,
        relation,
        resolved,
        sourceId,
        sourceRefs: [],
        strength: null,
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
      const relation = normalizeGraphRelationType(ref.relation, "supported_by");
      const semanticKey = createEdgeSemanticKey({ relation, sourceId, targetId });
      if (explicitEdgeKeys.has(semanticKey)) continue;

      const edgeId = createEdgeId([sourceId, "source", relation, targetId]);

      edgeById.set(edgeId, {
        id: edgeId,
        kind: "source",
        reason: null,
        relation,
        resolved,
        sourceId,
        sourceRefs: [ref] as Json,
        strength: null,
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

async function listPublishedMapRowsByProjectionIds(
  projectionIds: string[]
): Promise<NodeProjectionRow[]> {
  const uniqueProjectionIds = uniqueStrings(projectionIds);
  if (uniqueProjectionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("node_projection")
    .select(MAP_PROJECTION_SELECT)
    .eq("status", "published")
    .in("id", uniqueProjectionIds)
    .limit(uniqueProjectionIds.length);

  if (error) throw error;

  return (data ?? []) as NodeProjectionRow[];
}

async function listPublishedGraphEdgeRowsBetweenProjectionIds(
  projectionIds: string[]
): Promise<GraphEdgeRow[]> {
  const uniqueProjectionIds = uniqueStrings(projectionIds);
  if (uniqueProjectionIds.length < 2) return [];

  const supabase = toGraphEdgeClient(await createClient());
  const { data, error } = await supabase
    .from("graph_edges")
    .select(GRAPH_EDGES_SELECT)
    .eq("status", "published")
    .in("from_node_id", uniqueProjectionIds)
    .in("to_node_id", uniqueProjectionIds)
    .limit(
      Math.min(GRAPH_EDGE_QUERY_LIMIT, uniqueProjectionIds.length * uniqueProjectionIds.length)
    );

  if (error) {
    if (isGraphEdgesUnavailableError(error)) return [];
    throw error;
  }

  return parseGraphEdgeRows(data);
}

async function listPublishedGraphEdgeRowsForProjectionId(
  projectionId: string,
  limit: number
): Promise<GraphEdgeRow[]> {
  const supabase = toGraphEdgeClient(await createClient());
  const { data, error } = await supabase
    .from("graph_edges")
    .select(GRAPH_EDGES_SELECT)
    .eq("status", "published")
    .or(`from_node_id.eq.${projectionId},to_node_id.eq.${projectionId}`)
    .limit(Math.min(GRAPH_EDGE_QUERY_LIMIT, limit));

  if (error) {
    if (isGraphEdgesUnavailableError(error)) return [];
    throw error;
  }

  return parseGraphEdgeRows(data);
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
  const graphEdgeRows = await listPublishedGraphEdgeRowsBetweenProjectionIds(
    rows.map((row) => row.id)
  );

  return buildPublishedMapGraph(rows, { graphEdgeRows, includeReferenceNodes: true });
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

  const graphEdgeRows = await listPublishedGraphEdgeRowsForProjectionId(rootRow.id, parsed.limit);
  const graphProjectionIds = graphEdgeRows
    .flatMap((edge) => [edge.from_node_id, edge.to_node_id])
    .filter((projectionId) => projectionId !== rootRow.id);
  const relatedIds = getRelatedRefs(rootRow.content).map((ref) => ref.nodeId);
  const sourceIds = getSourceRefs(rootRow.source_refs).map((ref) => ref.nodeId);
  const [graphReferencedRows, legacyReferencedRows] = await Promise.all([
    listPublishedMapRowsByProjectionIds(uniqueStrings(graphProjectionIds).slice(0, parsed.limit)),
    listPublishedMapRowsByIdentifiers(
      uniqueStrings([...relatedIds, ...sourceIds]).slice(0, parsed.limit)
    ),
  ]);
  const rowsById = new Map<string, NodeProjectionRow>();

  for (const row of [rootRow, ...graphReferencedRows, ...legacyReferencedRows]) {
    rowsById.set(row.id, row);
  }

  return buildPublishedMapGraph([...rowsById.values()], {
    edgeSourceRows: [rootRow],
    graphEdgeRows,
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
