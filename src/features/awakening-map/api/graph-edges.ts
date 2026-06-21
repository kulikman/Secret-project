import "server-only";

import { z } from "zod";

import { AWAKENING_MAP_REVIEW_ROLES, requireAdminRole } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";
import { graphRelationTypeSchema } from "@/lib/graph-relations";
import { sourceRefSchema } from "@/lib/source-refs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/types/database";

const GRAPH_EDGE_SELECT =
  "id,from_node_id,to_node_id,relation_type,strength,source_refs,status,created_at,updated_at" as const;
const EDGE_NODE_SELECT = "id,brain_node_id,node_type,slug,status,title" as const;

export const awakeningGraphEdgeStatusSchema = z.enum(["draft", "review", "published", "archived"]);

export const listAwakeningGraphEdgesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  status: awakeningGraphEdgeStatusSchema.optional(),
});

const awakeningGraphEdgeMutationBaseSchema = z.object({
  fromNodeProjectionId: z.string().uuid(),
  relationType: graphRelationTypeSchema,
  sourceRefs: z.array(sourceRefSchema).max(25).default([]),
  status: awakeningGraphEdgeStatusSchema.default("review"),
  strength: z.coerce.number().min(0).max(1).default(1),
  toNodeProjectionId: z.string().uuid(),
});

export const createAwakeningGraphEdgeSchema = awakeningGraphEdgeMutationBaseSchema.refine(
  (edge) => edge.fromNodeProjectionId !== edge.toNodeProjectionId,
  {
    message: "Graph edge endpoints must be different.",
    path: ["toNodeProjectionId"],
  }
);

export const updateAwakeningGraphEdgeSchema = awakeningGraphEdgeMutationBaseSchema
  .omit({
    fromNodeProjectionId: true,
    toNodeProjectionId: true,
  })
  .extend({
    edgeId: z.string().uuid(),
  });

export type AwakeningGraphEdgeStatus = z.infer<typeof awakeningGraphEdgeStatusSchema>;
export type ListAwakeningGraphEdgesInput = z.input<typeof listAwakeningGraphEdgesSchema>;
export type CreateAwakeningGraphEdgeInput = z.input<typeof createAwakeningGraphEdgeSchema>;
export type UpdateAwakeningGraphEdgeInput = z.input<typeof updateAwakeningGraphEdgeSchema>;

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

interface GraphEdgeInsert {
  from_node_id: string;
  relation_type: string;
  source_refs?: Json;
  status?: string;
  strength?: number;
  to_node_id: string;
}

interface GraphEdgeUpdate {
  relation_type: string;
  source_refs: Json;
  status: string;
  strength: number;
}

interface GraphEdgeQueryResult<T> {
  data: T | null;
  error: { code?: string; message: string } | null;
}

interface GraphEdgeQueryBuilder {
  eq(column: string, value: string): GraphEdgeQueryBuilder;
  insert(value: GraphEdgeInsert): GraphEdgeQueryBuilder;
  limit(count: number): Promise<GraphEdgeQueryResult<GraphEdgeRow[]>>;
  maybeSingle(): Promise<GraphEdgeQueryResult<GraphEdgeRow>>;
  order(column: string, options: { ascending: boolean }): GraphEdgeQueryBuilder;
  select(columns: string): GraphEdgeQueryBuilder;
  single(): Promise<GraphEdgeQueryResult<GraphEdgeRow>>;
  update(value: GraphEdgeUpdate): GraphEdgeQueryBuilder;
}

interface GraphEdgeTableClient {
  from(relation: "graph_edges"): GraphEdgeQueryBuilder;
}

type ProjectionEdgeNodeRow = Pick<
  Tables<"node_projection">,
  "brain_node_id" | "id" | "node_type" | "slug" | "status" | "title"
>;

export interface AwakeningGraphEdgeNode {
  brainNodeId: string;
  id: string;
  nodeType: string;
  slug: string | null;
  status: string;
  title: string;
}

export interface AwakeningGraphEdge {
  createdAt: string;
  fromNode: AwakeningGraphEdgeNode | null;
  fromNodeId: string;
  id: string;
  relationType: z.infer<typeof graphRelationTypeSchema>;
  sourceRefs: Json;
  status: AwakeningGraphEdgeStatus;
  strength: number;
  toNode: AwakeningGraphEdgeNode | null;
  toNodeId: string;
  updatedAt: string;
}

export class AwakeningGraphEdgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AwakeningGraphEdgeError";
  }
}

function toGraphEdgeClient(supabase: ReturnType<typeof createAdminClient>): GraphEdgeTableClient {
  return supabase as unknown as GraphEdgeTableClient;
}

function normalizeStrength(value: number | string | null): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 1;
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

function toGraphEdgeNode(row: ProjectionEdgeNodeRow): AwakeningGraphEdgeNode {
  return {
    brainNodeId: row.brain_node_id,
    id: row.id,
    nodeType: row.node_type,
    slug: row.slug,
    status: row.status,
    title: row.title,
  };
}

function toGraphEdge(
  row: GraphEdgeRow,
  nodesById: Map<string, ProjectionEdgeNodeRow>
): AwakeningGraphEdge {
  const fromNode = nodesById.get(row.from_node_id);
  const toNode = nodesById.get(row.to_node_id);

  return {
    createdAt: row.created_at,
    fromNode: fromNode ? toGraphEdgeNode(fromNode) : null,
    fromNodeId: row.from_node_id,
    id: row.id,
    relationType: graphRelationTypeSchema.parse(row.relation_type),
    sourceRefs: row.source_refs,
    status: awakeningGraphEdgeStatusSchema.parse(row.status),
    strength: normalizeStrength(row.strength),
    toNode: toNode ? toGraphEdgeNode(toNode) : null,
    toNodeId: row.to_node_id,
    updatedAt: row.updated_at,
  };
}

async function getProjectionRowsByIds(
  supabase: ReturnType<typeof createAdminClient>,
  projectionIds: string[]
): Promise<Map<string, ProjectionEdgeNodeRow>> {
  const uniqueIds = [...new Set(projectionIds)];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("node_projection")
    .select(EDGE_NODE_SELECT)
    .in("id", uniqueIds)
    .limit(uniqueIds.length);

  if (error) {
    throw new AwakeningGraphEdgeError(`Failed to read graph edge nodes: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.id, row as ProjectionEdgeNodeRow]));
}

function assertPublishableEdge(input: {
  fromNode: ProjectionEdgeNodeRow | undefined;
  status: AwakeningGraphEdgeStatus;
  toNode: ProjectionEdgeNodeRow | undefined;
}): void {
  if (!input.fromNode || !input.toNode) {
    throw new AwakeningGraphEdgeError("Graph edge endpoints must reference existing projections.");
  }

  if (
    input.status === "published" &&
    (input.fromNode.status !== "published" || input.toNode.status !== "published")
  ) {
    throw new AwakeningGraphEdgeError("Only edges between published projections can be published.");
  }
}

async function writeGraphEdgeAudit(input: {
  actorUserId: string;
  edgeId: string;
  metadata: Json;
  mode: "created" | "updated";
}): Promise<void> {
  await writeAuditLog({
    action:
      input.mode === "created"
        ? "admin.awakening_graph_edge_created"
        : "admin.awakening_graph_edge_updated",
    metadata: input.metadata,
    resource: `awakening-graph-edge:${input.edgeId}`,
    userId: input.actorUserId,
  });
}

export async function listAwakeningGraphEdges(
  input: ListAwakeningGraphEdgesInput = {}
): Promise<AwakeningGraphEdge[]> {
  const filters = listAwakeningGraphEdgesSchema.parse(input);
  await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);

  const supabase = createAdminClient();
  const graphClient = toGraphEdgeClient(supabase);
  let query = graphClient.from("graph_edges").select(GRAPH_EDGE_SELECT);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(filters.limit);

  if (error) {
    if (isGraphEdgesUnavailableError(error)) return [];
    throw new AwakeningGraphEdgeError(`Failed to list graph edges: ${error.message}`);
  }

  const rows = data ?? [];
  const nodesById = await getProjectionRowsByIds(
    supabase,
    rows.flatMap((edge) => [edge.from_node_id, edge.to_node_id])
  );

  return rows.map((row) => toGraphEdge(row, nodesById));
}

export async function createAwakeningGraphEdge(
  input: CreateAwakeningGraphEdgeInput
): Promise<AwakeningGraphEdge> {
  const parsed = createAwakeningGraphEdgeSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();
  const nodesById = await getProjectionRowsByIds(supabase, [
    parsed.fromNodeProjectionId,
    parsed.toNodeProjectionId,
  ]);

  assertPublishableEdge({
    fromNode: nodesById.get(parsed.fromNodeProjectionId),
    status: parsed.status,
    toNode: nodesById.get(parsed.toNodeProjectionId),
  });

  const { data, error } = await toGraphEdgeClient(supabase)
    .from("graph_edges")
    .insert({
      from_node_id: parsed.fromNodeProjectionId,
      relation_type: parsed.relationType,
      source_refs: parsed.sourceRefs as Json,
      status: parsed.status,
      strength: parsed.strength,
      to_node_id: parsed.toNodeProjectionId,
    })
    .select(GRAPH_EDGE_SELECT)
    .single();

  if (error) {
    throw new AwakeningGraphEdgeError(`Failed to create graph edge: ${error.message}`);
  }

  if (!data) throw new AwakeningGraphEdgeError("Created graph edge was not returned.");

  await writeGraphEdgeAudit({
    actorUserId: actor.userId,
    edgeId: data.id,
    metadata: {
      fromNodeProjectionId: parsed.fromNodeProjectionId,
      relationType: parsed.relationType,
      status: parsed.status,
      strength: parsed.strength,
      toNodeProjectionId: parsed.toNodeProjectionId,
    },
    mode: "created",
  });

  return toGraphEdge(data, nodesById);
}

export async function updateAwakeningGraphEdge(
  input: UpdateAwakeningGraphEdgeInput
): Promise<AwakeningGraphEdge> {
  const parsed = updateAwakeningGraphEdgeSchema.parse(input);
  const actor = await requireAdminRole(AWAKENING_MAP_REVIEW_ROLES);
  const supabase = createAdminClient();
  const graphClient = toGraphEdgeClient(supabase);

  const { data: current, error: readError } = await graphClient
    .from("graph_edges")
    .select(GRAPH_EDGE_SELECT)
    .eq("id", parsed.edgeId)
    .maybeSingle();

  if (readError) {
    throw new AwakeningGraphEdgeError(`Failed to read graph edge: ${readError.message}`);
  }

  if (!current) throw new AwakeningGraphEdgeError("Graph edge not found.");

  const nodesById = await getProjectionRowsByIds(supabase, [
    current.from_node_id,
    current.to_node_id,
  ]);

  assertPublishableEdge({
    fromNode: nodesById.get(current.from_node_id),
    status: parsed.status,
    toNode: nodesById.get(current.to_node_id),
  });

  const { data, error } = await graphClient
    .from("graph_edges")
    .update({
      relation_type: parsed.relationType,
      source_refs: parsed.sourceRefs as Json,
      status: parsed.status,
      strength: parsed.strength,
    })
    .eq("id", parsed.edgeId)
    .select(GRAPH_EDGE_SELECT)
    .single();

  if (error) {
    throw new AwakeningGraphEdgeError(`Failed to update graph edge: ${error.message}`);
  }

  if (!data) throw new AwakeningGraphEdgeError("Updated graph edge was not returned.");

  await writeGraphEdgeAudit({
    actorUserId: actor.userId,
    edgeId: parsed.edgeId,
    metadata: {
      nextRelationType: parsed.relationType,
      nextStatus: parsed.status,
      nextStrength: parsed.strength,
      previousRelationType: current.relation_type,
      previousStatus: current.status,
      previousStrength: normalizeStrength(current.strength),
    },
    mode: "updated",
  });

  return toGraphEdge(data, nodesById);
}
