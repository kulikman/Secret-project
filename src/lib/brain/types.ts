export const archiveNodeTypes = [
  "topic",
  "source",
  "claim",
  "person",
  "organization",
  "event",
  "tag",
] as const;

export const brainNodeStatuses = ["active", "pending", "merged"] as const;
export const brainIngestSources = ["git", "chat", "document", "slack", "email", "manual"] as const;

export type ArchiveNodeType = (typeof archiveNodeTypes)[number];
export type BrainNodeStatus = (typeof brainNodeStatuses)[number];
export type BrainIngestSource = (typeof brainIngestSources)[number];
export type BrainInternalNodeType = "scaffold" | "emergent";

export interface ArchiveFact {
  id: string;
  nodeId: string;
  statement: string;
  confidence: string;
  sourceType: string;
  pinned: boolean;
  lastVerified: string;
}

export interface ArchiveNode {
  id: string;
  projectId: string;
  label: string;
  type: BrainInternalNodeType;
  category: string;
  summary: string | null;
  status: BrainNodeStatus | string;
  createdAt: string;
  updatedAt: string;
  facts?: ArchiveFact[];
}

export interface ArchiveEdge {
  id?: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface ArchiveGraph {
  nodes: ArchiveNode[];
  edges: ArchiveEdge[];
}

export interface ArchiveNodeCreateInput {
  label: string;
  nodeType: ArchiveNodeType;
  summary?: string;
  brainType?: BrainInternalNodeType;
}

export interface ArchiveNodePatch {
  label?: string;
  nodeType?: ArchiveNodeType;
  summary?: string | null;
  status?: BrainNodeStatus;
}

export interface ArchiveEdgeCreateInput {
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface ArchiveSearchInput {
  query: string;
  filters?: {
    nodeTypes?: ArchiveNodeType[];
    status?: BrainNodeStatus;
  };
  limit?: number;
}

export interface ArchiveRenderedContextInput {
  query: string;
  tokenBudget?: number;
  scope?: "project" | "founder";
}

export interface ArchiveRenderedContext {
  context: string;
  query: string;
  scope: "project" | "founder";
  stats?: Record<string, unknown>;
}

export interface ArchiveSearchResult {
  node: ArchiveNode;
  score: number;
  sourceRefs: string[];
}

export interface ArchiveNeighborsInput {
  nodeId: string;
  depth?: number;
  edgeTypes?: string[];
}

export interface ArchiveIntersectionsInput {
  nodeId: string;
  via?: ArchiveNodeType[];
}

export interface ArchiveIntersection {
  viaNodeId: string;
  relatedNodeIds: string[];
  relationType?: string;
}

export interface ArchiveMergeInput {
  primaryNodeId: string;
  duplicateNodeIds: string[];
}

export interface ArchiveMergeResult {
  primaryNodeId: string;
  mergedNodeIds: string[];
}

export interface ArchiveIngestInput {
  source: BrainIngestSource;
  content: string;
  metadata?: Record<string, unknown>;
  profile?: string;
}

export interface ArchiveIngestJob {
  eventId: string;
  status?: "queued" | string;
}

export interface ArchiveGraphSubsetInput {
  rootNodeId: string;
  depth?: number;
  edgeTypes?: string[];
}

export interface BrainArchiveAdapter {
  createNode(input: ArchiveNodeCreateInput): Promise<ArchiveNode>;
  updateNode(nodeId: string, patch: ArchiveNodePatch): Promise<ArchiveNode>;
  createEdge(input: ArchiveEdgeCreateInput): Promise<ArchiveEdge>;
  getNode(nodeId: string): Promise<ArchiveNode>;
  listNodes(status?: BrainNodeStatus): Promise<ArchiveNode[]>;
  getRenderedContext(input: ArchiveRenderedContextInput): Promise<ArchiveRenderedContext>;
  semanticSearch(input: ArchiveSearchInput): Promise<ArchiveSearchResult[]>;
  getNeighbors(input: ArchiveNeighborsInput): Promise<ArchiveGraph>;
  getIntersections(input: ArchiveIntersectionsInput): Promise<ArchiveIntersection[]>;
  mergeNodes(input: ArchiveMergeInput): Promise<ArchiveMergeResult>;
  enqueueIngest(input: ArchiveIngestInput): Promise<ArchiveIngestJob>;
  getFullGraph(): Promise<ArchiveGraph>;
  getGraphSubset(input: ArchiveGraphSubsetInput): Promise<ArchiveGraph>;
}
