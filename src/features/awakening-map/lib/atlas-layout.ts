export interface AwakeningAtlasNode {
  brainNodeId?: string;
  id: string;
  isProjected: boolean;
  nodeType: string;
  projectionId?: string | null;
  publishedAt?: string | null;
  slug?: string | null;
  summary?: string | null;
  title: string;
  updatedAt?: string | null;
}

export interface AwakeningAtlasEdge {
  id: string;
  kind: "related" | "source";
  reason: string | null;
  relation: string;
  resolved: boolean;
  sourceId: string;
  targetId: string;
}

export interface AwakeningAtlasGraph {
  edges: AwakeningAtlasEdge[];
  nodes: AwakeningAtlasNode[];
}

export type AwakeningAtlasEvidenceStatus =
  | "claim-needs-source"
  | "source-backed"
  | "unresolved-tail";

export interface AwakeningAtlasLayoutNode extends AwakeningAtlasNode {
  degree: number;
  isNeighbor: boolean;
  isSelected: boolean;
  orbit: number;
  radius: number;
  x: number;
  y: number;
}

export interface AwakeningAtlasLayoutEdge extends AwakeningAtlasEdge {
  source: AwakeningAtlasLayoutNode;
  target: AwakeningAtlasLayoutNode;
}

export interface AwakeningAtlasLayout {
  edges: AwakeningAtlasLayoutEdge[];
  nodes: AwakeningAtlasLayoutNode[];
  selectedNodeId: string | null;
}

const NODE_TYPE_ORDER = [
  "topic",
  "person",
  "organization",
  "event",
  "source",
  "claim",
  "document",
  "video",
  "tag",
  "reference",
] as const;

export const AWAKENING_ATLAS_NODE_TYPE_LABELS: Record<string, string> = {
  claim: "Тезис",
  document: "Документ",
  event: "Событие",
  organization: "Организация",
  person: "Человек",
  reference: "Хвост",
  source: "Источник",
  tag: "Тег",
  topic: "Тема",
  video: "Видео",
};

function getNodeTypeWeight(nodeType: string): number {
  const index = NODE_TYPE_ORDER.indexOf(nodeType as (typeof NODE_TYPE_ORDER)[number]);
  return index === -1 ? NODE_TYPE_ORDER.length : index;
}

function getDegreeMap(graph: AwakeningAtlasGraph): Map<string, number> {
  const degree = new Map<string, number>();

  for (const node of graph.nodes) {
    degree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    degree.set(edge.sourceId, (degree.get(edge.sourceId) ?? 0) + 1);
    degree.set(edge.targetId, (degree.get(edge.targetId) ?? 0) + 1);
  }

  return degree;
}

export function getDefaultAtlasNodeId(graph: AwakeningAtlasGraph): string | null {
  const degree = getDegreeMap(graph);
  const sorted = [...graph.nodes].sort((left, right) => {
    const projectedScore = Number(right.isProjected) - Number(left.isProjected);
    if (projectedScore !== 0) return projectedScore;

    const typeScore = getNodeTypeWeight(left.nodeType) - getNodeTypeWeight(right.nodeType);
    if (typeScore !== 0) return typeScore;

    const degreeScore = (degree.get(right.id) ?? 0) - (degree.get(left.id) ?? 0);
    if (degreeScore !== 0) return degreeScore;

    return left.title.localeCompare(right.title);
  });

  return sorted[0]?.id ?? null;
}

export function getAwakeningAtlasEvidenceStatus(
  graph: AwakeningAtlasGraph,
  node: AwakeningAtlasNode
): AwakeningAtlasEvidenceStatus {
  if (!node.isProjected) return "unresolved-tail";

  const hasSourceEdge = graph.edges.some(
    (edge) => (edge.sourceId === node.id || edge.targetId === node.id) && edge.kind === "source"
  );

  if (hasSourceEdge) return "source-backed";
  return node.nodeType === "claim" ? "claim-needs-source" : "source-backed";
}

function getNeighborIds(graph: AwakeningAtlasGraph, selectedNodeId: string | null): Set<string> {
  const ids = new Set<string>();
  if (!selectedNodeId) return ids;

  for (const edge of graph.edges) {
    if (edge.sourceId === selectedNodeId) ids.add(edge.targetId);
    if (edge.targetId === selectedNodeId) ids.add(edge.sourceId);
  }

  return ids;
}

function getOrbit(input: {
  isNeighbor: boolean;
  isSelected: boolean;
  node: AwakeningAtlasNode;
}): number {
  if (input.isSelected) return 0;
  if (input.isNeighbor) return 1;
  if (!input.node.isProjected || input.node.nodeType === "reference") return 3;
  if (
    input.node.nodeType === "source" ||
    input.node.nodeType === "claim" ||
    input.node.nodeType === "document" ||
    input.node.nodeType === "video"
  ) {
    return 2;
  }
  return 2;
}

function getNodeRadius(input: {
  degree: number;
  isNeighbor: boolean;
  isSelected: boolean;
  node: AwakeningAtlasNode;
}): number {
  if (input.isSelected) return 32;
  if (!input.node.isProjected || input.node.nodeType === "reference") return 13;
  if (input.node.nodeType === "topic") return Math.min(27, 18 + input.degree * 2);
  if (input.node.nodeType === "source" || input.node.nodeType === "document") return 15;
  if (input.node.nodeType === "video") return 16;
  return input.isNeighbor ? 17 : 14;
}

function getOrbitRadius(orbit: number): number {
  if (orbit === 0) return 0;
  if (orbit === 1) return 186;
  if (orbit === 2) return 292;
  return 360;
}

export function createAwakeningAtlasLayout(
  graph: AwakeningAtlasGraph,
  selectedNodeId: string | null,
  viewport: { height: number; width: number } = { height: 740, width: 1120 }
): AwakeningAtlasLayout {
  const degree = getDegreeMap(graph);
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const resolvedSelectedNodeId =
    selectedNodeId && nodeIds.has(selectedNodeId) ? selectedNodeId : getDefaultAtlasNodeId(graph);
  const neighborIds = getNeighborIds(graph, resolvedSelectedNodeId);
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  const preparedNodes = graph.nodes
    .map((node) => {
      const isSelected = node.id === resolvedSelectedNodeId;
      const isNeighbor = neighborIds.has(node.id);
      return {
        degree: degree.get(node.id) ?? 0,
        isNeighbor,
        isSelected,
        node,
        orbit: getOrbit({ isNeighbor, isSelected, node }),
      };
    })
    .sort((left, right) => {
      if (left.orbit !== right.orbit) return left.orbit - right.orbit;
      const typeScore =
        getNodeTypeWeight(left.node.nodeType) - getNodeTypeWeight(right.node.nodeType);
      if (typeScore !== 0) return typeScore;
      if (left.degree !== right.degree) return right.degree - left.degree;
      return left.node.title.localeCompare(right.node.title);
    });

  const orbitCounts = new Map<number, number>();
  const orbitIndexes = new Map<number, number>();
  for (const item of preparedNodes) {
    orbitCounts.set(item.orbit, (orbitCounts.get(item.orbit) ?? 0) + 1);
  }

  const layoutNodes = preparedNodes.map((item): AwakeningAtlasLayoutNode => {
    if (item.orbit === 0) {
      return {
        ...item.node,
        degree: item.degree,
        isNeighbor: item.isNeighbor,
        isSelected: item.isSelected,
        orbit: item.orbit,
        radius: getNodeRadius(item),
        x: centerX,
        y: centerY,
      };
    }

    const orbitIndex = orbitIndexes.get(item.orbit) ?? 0;
    orbitIndexes.set(item.orbit, orbitIndex + 1);

    const orbitCount = orbitCounts.get(item.orbit) ?? 1;
    const radius = getOrbitRadius(item.orbit);
    const offset = item.orbit === 1 ? -Math.PI / 2 : -Math.PI / 2 + item.orbit * 0.34;
    const angle = offset + (Math.PI * 2 * orbitIndex) / orbitCount;

    return {
      ...item.node,
      degree: item.degree,
      isNeighbor: item.isNeighbor,
      isSelected: item.isSelected,
      orbit: item.orbit,
      radius: getNodeRadius(item),
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * 0.76,
    };
  });

  const layoutNodeById = new Map(layoutNodes.map((node) => [node.id, node]));
  const layoutEdges = graph.edges.flatMap((edge): AwakeningAtlasLayoutEdge[] => {
    const source = layoutNodeById.get(edge.sourceId);
    const target = layoutNodeById.get(edge.targetId);
    if (!source || !target) return [];

    return [{ ...edge, source, target }];
  });

  return {
    edges: layoutEdges,
    nodes: layoutNodes,
    selectedNodeId: resolvedSelectedNodeId,
  };
}
