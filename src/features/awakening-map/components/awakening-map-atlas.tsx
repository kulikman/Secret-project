"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Compass,
  Eye,
  GitBranch,
  LocateFixed,
  Network,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { startTransition, useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AWAKENING_ATLAS_NODE_TYPE_LABELS,
  createAwakeningAtlasLayout,
  getDefaultAtlasNodeId,
  type AwakeningAtlasGraph,
  type AwakeningAtlasLayoutEdge,
  type AwakeningAtlasLayoutNode,
  type AwakeningAtlasNode,
} from "../lib/atlas-layout";
import {
  getAwakeningMapThemeGroup,
  getRelatedAwakeningReferenceClusters,
  matchAwakeningReferenceClusters,
  type AwakeningReferenceClusterMatch,
} from "../lib/reference-map";

type ApiEnvelope<TData> =
  | {
      data: TData;
      ok: true;
      requestId: string;
    }
  | {
      error: string;
      ok: false;
      requestId: string;
    };

interface AwakeningMapAtlasProps {
  initialGraph: AwakeningAtlasGraph;
}

interface NodeVisual {
  glow: string;
  label: string;
  stroke: string;
}

const FALLBACK_NODE_VISUAL: NodeVisual = {
  glow: "rgba(203, 213, 225, 0.16)",
  label: "fill-stone-300",
  stroke: "#cbd5e1",
};

const NODE_VISUALS: Record<string, NodeVisual> = {
  claim: {
    glow: "rgba(251, 146, 60, 0.28)",
    label: "fill-orange-200",
    stroke: "#fb923c",
  },
  document: {
    glow: "rgba(129, 140, 248, 0.26)",
    label: "fill-indigo-200",
    stroke: "#818cf8",
  },
  event: {
    glow: "rgba(248, 113, 113, 0.28)",
    label: "fill-rose-200",
    stroke: "#fb7185",
  },
  organization: {
    glow: "rgba(96, 165, 250, 0.28)",
    label: "fill-sky-200",
    stroke: "#60a5fa",
  },
  person: {
    glow: "rgba(52, 211, 153, 0.28)",
    label: "fill-emerald-200",
    stroke: "#34d399",
  },
  reference: {
    glow: "rgba(203, 213, 225, 0.16)",
    label: "fill-stone-300",
    stroke: "#cbd5e1",
  },
  source: {
    glow: "rgba(250, 204, 21, 0.28)",
    label: "fill-amber-200",
    stroke: "#facc15",
  },
  tag: {
    glow: "rgba(216, 180, 254, 0.24)",
    label: "fill-violet-200",
    stroke: "#d8b4fe",
  },
  topic: {
    glow: "rgba(245, 158, 11, 0.34)",
    label: "fill-amber-100",
    stroke: "#f59e0b",
  },
  video: {
    glow: "rgba(244, 114, 182, 0.24)",
    label: "fill-pink-200",
    stroke: "#f472b6",
  },
};

const EMPTY_GRAPH: AwakeningAtlasGraph = {
  edges: [],
  nodes: [],
};
const EMPTY_NODE_ID_SET = new Set<string>();
const REFERENCE_MAP_IMAGE_SRC = "/awakening/reference-map.jpg";

type AwakeningMapViewMode = "atlas" | "reference" | "compare";

function getNodeVisual(nodeType: string) {
  return NODE_VISUALS[nodeType] ?? FALLBACK_NODE_VISUAL;
}

function getNodeTypeLabel(nodeType: string): string {
  return AWAKENING_ATLAS_NODE_TYPE_LABELS[nodeType] ?? nodeType;
}

function getNodeHref(node: AwakeningAtlasNode): Route | null {
  if (!node.isProjected) return null;
  if (node.nodeType === "topic" && node.slug) return `/topics/${node.slug}` as Route;
  if (node.nodeType === "source") return `/sources/${node.id}` as Route;
  return null;
}

function getVisibleGraph(input: {
  graph: AwakeningAtlasGraph;
  nodeTypeFilter: string;
  query: string;
}): AwakeningAtlasGraph {
  const normalizedQuery = input.query.trim().toLocaleLowerCase("ru-RU");
  const visibleNodes = input.graph.nodes.filter((node) => {
    const matchesType = input.nodeTypeFilter === "all" || node.nodeType === input.nodeTypeFilter;
    const text = `${node.title} ${node.summary ?? ""} ${node.nodeType}`.toLocaleLowerCase("ru-RU");
    const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
    return matchesType && matchesQuery;
  });
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  return {
    edges: input.graph.edges.filter(
      (edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)
    ),
    nodes: visibleNodes,
  };
}

function getNodeTypes(graph: AwakeningAtlasGraph): string[] {
  return [...new Set(graph.nodes.map((node) => node.nodeType))].sort((left, right) =>
    getNodeTypeLabel(left).localeCompare(getNodeTypeLabel(right), "ru-RU")
  );
}

function getReferenceClusterMatches(graph: AwakeningAtlasGraph): AwakeningReferenceClusterMatch[] {
  return matchAwakeningReferenceClusters(graph)
    .filter((entry) => entry.matchedNodeIds.length > 0)
    .sort((left, right) => right.matchedNodeIds.length - left.matchedNodeIds.length);
}

function getClusterMatchById(
  clusterMatches: AwakeningReferenceClusterMatch[],
  clusterId: string | null
): AwakeningReferenceClusterMatch | null {
  if (!clusterId) return null;
  return clusterMatches.find((entry) => entry.cluster.id === clusterId) ?? null;
}

function getClusterMatchForNode(
  clusterMatches: AwakeningReferenceClusterMatch[],
  nodeId: string | null
): AwakeningReferenceClusterMatch | null {
  if (!nodeId) return null;
  return clusterMatches.find((entry) => entry.matchedNodeIds.includes(nodeId)) ?? null;
}

function getConnectedEdges(
  graph: AwakeningAtlasGraph,
  nodeId: string | null
): AwakeningAtlasLayoutEdge[] {
  if (!nodeId) return [];

  const layout = createAwakeningAtlasLayout(graph, nodeId);
  return layout.edges.filter((edge) => edge.sourceId === nodeId || edge.targetId === nodeId);
}

function formatDate(value?: string | null): string {
  if (!value) return "не опубликовано";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}

function NodeTypePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-amber-300/70 bg-amber-300/20 text-amber-100"
          : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/25 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function ClusterPill({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-teal-300/70 bg-teal-300/15 text-teal-100"
          : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/25 hover:text-white"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px]",
          active ? "bg-teal-100/15 text-teal-50" : "bg-white/10 text-stone-400"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ViewModeButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[10rem] flex-1 flex-col rounded-[1.4rem] border px-4 py-3 text-left transition-colors",
        active
          ? "border-amber-300/50 bg-amber-300/10 text-amber-50"
          : "border-white/10 bg-white/[0.04] text-stone-200 hover:border-white/20 hover:bg-white/[0.07]"
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={cn("mt-1 text-xs leading-5", active ? "text-amber-100/80" : "text-stone-500")}
      >
        {description}
      </span>
    </button>
  );
}

function AtlasLegend(): React.ReactElement {
  const items = [
    "topic",
    "person",
    "organization",
    "event",
    "source",
    "document",
    "video",
    "reference",
  ];

  return (
    <div className="grid gap-2 text-xs text-stone-300 sm:grid-cols-2">
      {items.map((item) => {
        const visual = getNodeVisual(item);
        return (
          <div key={item} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: visual.stroke, boxShadow: `0 0 16px ${visual.glow}` }}
            />
            <span>{getNodeTypeLabel(item)}</span>
          </div>
        );
      })}
    </div>
  );
}

function AtlasEdge({ edge }: { edge: AwakeningAtlasLayoutEdge }): React.ReactElement {
  const isSourceEdge = edge.kind === "source";
  const stroke = isSourceEdge ? "rgba(250, 204, 21, 0.42)" : "rgba(226, 232, 240, 0.22)";
  const strokeDasharray = edge.resolved ? undefined : "7 8";

  return (
    <line
      x1={edge.source.x}
      y1={edge.source.y}
      x2={edge.target.x}
      y2={edge.target.y}
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeWidth={isSourceEdge ? 1.8 : 1.2}
    />
  );
}

function AtlasNode({
  dimmed,
  node,
  onSelect,
}: {
  dimmed: boolean;
  node: AwakeningAtlasLayoutNode;
  onSelect: (nodeId: string) => void;
}): React.ReactElement {
  const visual = getNodeVisual(node.nodeType);
  const fill = node.isProjected ? "rgba(12, 10, 9, 0.95)" : "rgba(28, 25, 23, 0.74)";
  const strokeWidth = node.isSelected ? 3 : node.isNeighbor ? 2 : 1.4;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Выбрать узел ${node.title}`}
      className="cursor-pointer transition-opacity outline-none focus-visible:opacity-100"
      style={{ opacity: dimmed ? 0.28 : 1 }}
      transform={`translate(${node.x} ${node.y})`}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(node.id);
        }
      }}
    >
      <circle r={node.radius + 12} fill={visual.glow} opacity={node.isSelected ? 0.95 : 0.55} />
      <circle
        r={node.radius}
        fill={fill}
        stroke={visual.stroke}
        strokeDasharray={node.isProjected ? undefined : "3 4"}
        strokeWidth={strokeWidth}
      />
      <circle r={Math.max(3, node.radius * 0.18)} fill={visual.stroke} opacity={0.92} />
      <text
        className={cn(
          "pointer-events-none font-mono text-[10px] tracking-[0.16em] uppercase",
          visual.label
        )}
        textAnchor="middle"
        y={node.radius + 18}
      >
        {getNodeTypeLabel(node.nodeType)}
      </text>
      <text
        className="pointer-events-none fill-white text-[13px] font-semibold"
        textAnchor="middle"
        y={node.radius + 35}
      >
        {node.title.length > 24 ? `${node.title.slice(0, 23)}…` : node.title}
      </text>
    </g>
  );
}

function AtlasSvg({
  graph,
  highlightedNodeIds,
  onSelectNode,
  selectedNodeId,
}: {
  graph: AwakeningAtlasGraph;
  highlightedNodeIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}): React.ReactElement {
  const layout = createAwakeningAtlasLayout(graph, selectedNodeId);
  const hasHighlight = highlightedNodeIds.size > 0;

  return (
    <svg
      role="img"
      aria-label="Визуальная карта связей между темами Тайного Бюро"
      className="h-full min-h-[520px] w-full"
      viewBox="0 0 1120 740"
    >
      <defs>
        <radialGradient id="awakening-atlas-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.24)" />
          <stop offset="62%" stopColor="rgba(15, 23, 42, 0.08)" />
          <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
        </radialGradient>
      </defs>
      <rect width="1120" height="740" fill="url(#awakening-atlas-core)" />
      {[142, 240, 352].map((radius) => (
        <ellipse
          key={radius}
          cx="560"
          cy="370"
          rx={radius}
          ry={radius * 0.76}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray={radius === 352 ? "8 10" : undefined}
        />
      ))}
      <g>
        {layout.edges.map((edge) => (
          <AtlasEdge key={edge.id} edge={edge} />
        ))}
      </g>
      <g>
        {layout.nodes.map((node) => (
          <AtlasNode
            key={node.id}
            dimmed={hasHighlight && !highlightedNodeIds.has(node.id)}
            node={node}
            onSelect={onSelectNode}
          />
        ))}
      </g>
    </svg>
  );
}

function ReferenceMapStage({
  clusterMatches,
  selectedCluster,
  onSelectCluster,
}: {
  clusterMatches: AwakeningReferenceClusterMatch[];
  onSelectCluster: (clusterId: string) => void;
  selectedCluster: AwakeningReferenceClusterMatch | null;
}): React.ReactElement {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_34%)]" />
      <Image
        alt="Оригинальная карта Great Awakening с интерактивными секторами"
        className="relative z-0 block h-auto w-full"
        height={4203}
        sizes="(max-width: 1279px) 100vw, 50vw"
        src={REFERENCE_MAP_IMAGE_SRC}
        width={3300}
      />

      <div className="absolute inset-0 z-10">
        {clusterMatches.map((entry) => {
          const active = selectedCluster?.cluster.id === entry.cluster.id;
          const { bounds } = entry.cluster;

          return (
            <button
              key={entry.cluster.id}
              type="button"
              aria-label={`Выбрать сектор ${entry.cluster.label}`}
              className={cn(
                "absolute rounded-[1.6rem] border transition-all",
                active
                  ? "border-teal-300 bg-teal-300/18 shadow-[0_0_0_1px_rgba(94,234,212,0.35),0_0_40px_rgba(45,212,191,0.22)]"
                  : "border-white/10 bg-white/[0.03] hover:border-teal-200/60 hover:bg-teal-200/10"
              )}
              style={{
                height: `${bounds.height * 100}%`,
                left: `${bounds.x * 100}%`,
                top: `${bounds.y * 100}%`,
                width: `${bounds.width * 100}%`,
              }}
              onClick={() => onSelectCluster(entry.cluster.id)}
            >
              <span className="absolute inset-x-2 top-2 rounded-full bg-stone-950/80 px-2 py-1 text-left font-mono text-[10px] tracking-[0.14em] text-teal-50 uppercase backdrop-blur">
                {entry.cluster.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 bottom-3 left-3 z-20 rounded-[1.6rem] border border-white/10 bg-stone-950/82 p-4 text-stone-100 backdrop-blur">
        {selectedCluster ? (
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-teal-100 uppercase">
              original map sector
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{selectedCluster.cluster.label}</p>
              <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-[11px] text-teal-50">
                {selectedCluster.matchedNodeIds.length} atlas nodes
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              {selectedCluster.cluster.summary}
            </p>
          </div>
        ) : (
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-teal-100 uppercase">
              original map sector
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Выбери крупный сектор поверх оригинальной карты, чтобы подсветить связанные узлы в
              атласе и прочитать схему по большим темам.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedNodePanel({
  activeCluster,
  graph,
  isLoadingNeighbors,
  node,
  onSelectCluster,
  onLoadNeighbors,
  onReset,
}: {
  activeCluster: AwakeningReferenceClusterMatch | null;
  graph: AwakeningAtlasGraph;
  isLoadingNeighbors: boolean;
  node: AwakeningAtlasNode | null;
  onSelectCluster: (clusterId: string) => void;
  onLoadNeighbors: (node: AwakeningAtlasNode) => void;
  onReset: () => void;
}): React.ReactElement {
  if (!node) {
    return (
      <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-stone-200 backdrop-blur">
        <p className="font-mono text-xs tracking-[0.24em] text-amber-200 uppercase">selection</p>
        <h2 className="mt-3 text-2xl font-semibold">Выберите узел</h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Узел откроет краткое досье, связи и действия фокусировки.
        </p>
      </aside>
    );
  }

  const href = getNodeHref(node);
  const connectedEdges = getConnectedEdges(graph, node.id);
  const group = activeCluster ? getAwakeningMapThemeGroup(activeCluster.cluster.groupId) : null;
  const relatedClusters = activeCluster
    ? getRelatedAwakeningReferenceClusters(activeCluster.cluster.id)
    : [];

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 text-stone-100 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-[0.24em] text-amber-200 uppercase">
          {getNodeTypeLabel(node.nodeType)}
        </p>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            node.isProjected
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : "border-stone-300/20 bg-stone-300/10 text-stone-300"
          )}
        >
          {node.isProjected ? "published projection" : "unresolved tail"}
        </span>
      </div>

      <h2 className="mt-4 text-3xl font-semibold tracking-tight">{node.title}</h2>
      <p className="mt-4 text-sm leading-7 text-stone-300">
        {node.summary ??
          (node.isProjected
            ? "У проекции пока нет summary, но она уже опубликована в карте."
            : "Этот хвост найден в связях, но отдельная опубликованная карточка ещё не создана.")}
      </p>

      {activeCluster ? (
        <div className="mt-5 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
          <p className="font-mono text-[11px] tracking-[0.22em] text-teal-100 uppercase">
            reference cluster
          </p>
          <p className="mt-2 text-base font-semibold text-white">{activeCluster.cluster.label}</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">{activeCluster.cluster.summary}</p>
          <p className="mt-3 text-xs text-stone-400">
            {group?.label ?? activeCluster.cluster.groupId} · {activeCluster.matchedNodeIds.length}{" "}
            связанных atlas-узлов
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeCluster.cluster.keyTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-stone-200"
              >
                {topic}
              </span>
            ))}
          </div>
          {relatedClusters.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-stone-400">Мосты к соседним секторам</p>
              <div className="flex flex-wrap gap-2">
                {relatedClusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-stone-200 transition-colors hover:border-teal-200/60 hover:text-white"
                    onClick={() => onSelectCluster(cluster.id)}
                  >
                    {cluster.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-stone-500">Связи</p>
          <p className="mt-1 text-2xl font-semibold">{connectedEdges.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-stone-500">Обновлено</p>
          <p className="mt-2 text-xs leading-5 text-stone-300">{formatDate(node.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button
          className="h-10 justify-start bg-amber-300 text-stone-950 hover:bg-amber-200"
          disabled={!node.isProjected || isLoadingNeighbors}
          type="button"
          onClick={() => onLoadNeighbors(node)}
        >
          <LocateFixed className="size-4" />
          {isLoadingNeighbors ? "Раскрываю соседей..." : "Сфокусировать соседей"}
        </Button>
        <Button
          className="h-10 justify-start border-white/15 bg-white/[0.03] text-stone-100 hover:bg-white/[0.08]"
          type="button"
          variant="outline"
          onClick={onReset}
        >
          <RotateCcw className="size-4" />
          Вернуть общий обзор
        </Button>
        {href ? (
          <Button
            asChild
            className="h-10 justify-start border-white/15 bg-transparent text-stone-100 hover:bg-white/[0.08]"
            variant="outline"
          >
            <Link href={href}>
              <Eye className="size-4" />
              Открыть карточку
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="mb-3 font-mono text-xs tracking-[0.2em] text-stone-500 uppercase">
          ближайшие связи
        </p>
        {connectedEdges.length > 0 ? (
          <ul className="space-y-2">
            {connectedEdges.slice(0, 6).map((edge) => {
              const otherId = edge.sourceId === node.id ? edge.targetId : edge.sourceId;
              const other = graph.nodes.find((candidate) => candidate.id === otherId);
              return (
                <li key={edge.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium">{other?.title ?? otherId}</p>
                  <p className="mt-1 font-mono text-[11px] text-stone-500">{edge.relation}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-stone-400">
            Связи пока не опубликованы в projection.
          </p>
        )}
      </div>
    </aside>
  );
}

export function AwakeningMapAtlas({ initialGraph }: AwakeningMapAtlasProps): React.ReactElement {
  const [graph, setGraph] = useState<AwakeningAtlasGraph>(
    initialGraph.nodes.length > 0 ? initialGraph : EMPTY_GRAPH
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() =>
    getDefaultAtlasNodeId(initialGraph)
  );
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<AwakeningMapViewMode>("atlas");
  const [query, setQuery] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("all");
  const [isLoadingNeighbors, setIsLoadingNeighbors] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const visibleGraph = getVisibleGraph({ graph, nodeTypeFilter, query: deferredQuery });
  const clusterMatches = getReferenceClusterMatches(graph);
  const explicitCluster = getClusterMatchById(clusterMatches, selectedClusterId);
  const inferredCluster = getClusterMatchForNode(clusterMatches, selectedNodeId);
  const activeCluster = explicitCluster ?? inferredCluster;
  const layout = createAwakeningAtlasLayout(visibleGraph, selectedNodeId);
  const selectedNode =
    visibleGraph.nodes.find((node) => node.id === layout.selectedNodeId) ??
    graph.nodes.find((node) => node.id === selectedNodeId) ??
    null;
  const nodeTypes = getNodeTypes(graph);
  const matchingNodeIds = new Set(visibleGraph.nodes.map((node) => node.id));
  const clusterNodeIds = activeCluster
    ? new Set(
        activeCluster.matchedNodeIds.filter((nodeId) =>
          visibleGraph.nodes.some((node) => node.id === nodeId)
        )
      )
    : EMPTY_NODE_ID_SET;
  const highlightedNodeIds =
    deferredQuery || nodeTypeFilter !== "all"
      ? matchingNodeIds
      : activeCluster
        ? clusterNodeIds
        : EMPTY_NODE_ID_SET;
  const projectedCount = graph.nodes.filter((node) => node.isProjected).length;
  const unresolvedCount = graph.nodes.length - projectedCount;

  function selectCluster(clusterId: string): void {
    const nextCluster = getClusterMatchById(clusterMatches, clusterId);

    setSelectedClusterId(clusterId);
    setStatusMessage(`Выбран сектор ${nextCluster?.cluster.label ?? clusterId}.`);

    const nextNodeId = nextCluster?.matchedNodeIds.find((nodeId) =>
      visibleGraph.nodes.some((node) => node.id === nodeId)
    );
    if (nextNodeId) {
      setSelectedNodeId(nextNodeId);
    }
  }

  function selectNode(nodeId: string): void {
    setSelectedNodeId(nodeId);
    const nextCluster = getClusterMatchForNode(clusterMatches, nodeId);
    setSelectedClusterId(nextCluster?.cluster.id ?? null);
  }

  async function loadNeighbors(node: AwakeningAtlasNode): Promise<void> {
    if (!node.isProjected) {
      setStatusMessage("Этот хвост ещё не опубликован как отдельный узел.");
      return;
    }

    setIsLoadingNeighbors(true);
    setStatusMessage(null);

    try {
      const response = await fetch(
        `/api/map/neighbors?id=${encodeURIComponent(node.id)}&limit=48`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );
      const payload = (await response.json()) as ApiEnvelope<{ graph: AwakeningAtlasGraph }>;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Could not load neighbors" : payload.error);
      }

      setGraph(payload.data.graph);
      setSelectedNodeId(node.id);
      setSelectedClusterId(getClusterMatchForNode(clusterMatches, node.id)?.cluster.id ?? null);
      setNodeTypeFilter("all");
      setQuery("");
      setStatusMessage("Показаны прямые соседи выбранного узла.");
    } catch {
      setStatusMessage("Не удалось раскрыть соседей. Проверьте API карты.");
    } finally {
      setIsLoadingNeighbors(false);
    }
  }

  function resetGraph(): void {
    setGraph(initialGraph.nodes.length > 0 ? initialGraph : EMPTY_GRAPH);
    setSelectedNodeId(getDefaultAtlasNodeId(initialGraph));
    setSelectedClusterId(null);
    setNodeTypeFilter("all");
    setQuery("");
    setStatusMessage(null);
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-stone-950/10 bg-stone-950 text-stone-50 shadow-2xl shadow-stone-950/20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_18%,rgba(245,158,11,0.26),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(20,184,166,0.18),transparent_24%),linear-gradient(145deg,#0c0a09,#111827_52%,#1c1917)]" />
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.08]" />

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 font-mono text-xs tracking-[0.22em] text-amber-100 uppercase">
                  awakening atlas
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-300">
                  projection-backed
                </span>
                <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs text-teal-50">
                  original map linked
                </span>
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Карта, которая показывает не ответы, а связи.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400 sm:text-base">
                Узлы строятся из опубликованной projection-модели. Пунктирные хвосты показывают, где
                исследование ещё не доведено до отдельной карточки.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/[0.06] p-3 text-center backdrop-blur">
              <div>
                <p className="text-2xl font-semibold">{graph.nodes.length}</p>
                <p className="text-[11px] text-stone-500">узлов</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{graph.edges.length}</p>
                <p className="text-[11px] text-stone-500">связей</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{unresolvedCount}</p>
                <p className="text-[11px] text-stone-500">хвостов</p>
              </div>
            </div>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative">
              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500"
              />
              <input
                type="search"
                value={query}
                placeholder="Найти тему, источник, человека или хвост"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pr-4 pl-11 text-sm text-white transition outline-none placeholder:text-stone-500 focus:border-amber-300/50 focus:ring-3 focus:ring-amber-300/15"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Button
              className="h-11 border-white/15 bg-white/[0.05] text-stone-100 hover:bg-white/[0.1]"
              type="button"
              variant="outline"
              onClick={resetGraph}
            >
              <Compass className="size-4" />
              Общий обзор
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <ViewModeButton
              active={viewMode === "atlas"}
              description="Чистый структурный граф с орбитами и связями."
              label="Атлас"
              onClick={() => setViewMode("atlas")}
            />
            <ViewModeButton
              active={viewMode === "reference"}
              description="Исходная карта с крупными интерактивными секторами."
              label="Оригинал"
              onClick={() => setViewMode("reference")}
            />
            <ViewModeButton
              active={viewMode === "compare"}
              description="Слева оригинал, справа atlas с общей selection state."
              label="Сопоставление"
              onClick={() => setViewMode("compare")}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <NodeTypePill
              active={nodeTypeFilter === "all"}
              onClick={() => startTransition(() => setNodeTypeFilter("all"))}
            >
              Все
            </NodeTypePill>
            {nodeTypes.map((nodeType) => (
              <NodeTypePill
                key={nodeType}
                active={nodeTypeFilter === nodeType}
                onClick={() => startTransition(() => setNodeTypeFilter(nodeType))}
              >
                {getNodeTypeLabel(nodeType)}
              </NodeTypePill>
            ))}
          </div>

          {clusterMatches.length > 0 ? (
            <div className="mb-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-xs tracking-[0.22em] text-teal-100 uppercase">
                reference clusters
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                Крупные сектора исходной карты. Выбор кластера подсвечивает связанные узлы и
                помогает читать карту по большим темам.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {clusterMatches.map((entry) => (
                  <ClusterPill
                    key={entry.cluster.id}
                    active={activeCluster?.cluster.id === entry.cluster.id}
                    count={entry.matchedNodeIds.length}
                    label={entry.cluster.label}
                    onClick={() => selectCluster(entry.cluster.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {viewMode === "reference" ? (
            <ReferenceMapStage
              clusterMatches={clusterMatches}
              onSelectCluster={selectCluster}
              selectedCluster={activeCluster}
            />
          ) : viewMode === "compare" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <ReferenceMapStage
                clusterMatches={clusterMatches}
                onSelectCluster={selectCluster}
                selectedCluster={activeCluster}
              />
              <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                {visibleGraph.nodes.length > 0 ? (
                  <AtlasSvg
                    graph={visibleGraph}
                    highlightedNodeIds={highlightedNodeIds}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={selectNode}
                  />
                ) : (
                  <div className="flex min-h-[560px] items-center justify-center p-8 text-center">
                    <div className="max-w-md">
                      <Sparkles className="mx-auto size-10 text-amber-200" />
                      <h3 className="mt-4 text-2xl font-semibold">
                        Карта ждёт первые опубликованные узлы
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-stone-400">
                        Когда темы появятся в `node_projection` со статусом `published`, они станут
                        созвездием здесь.
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 hidden rounded-2xl border border-white/10 bg-stone-950/75 p-4 backdrop-blur lg:block">
                  <AtlasLegend />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
              {visibleGraph.nodes.length > 0 ? (
                <AtlasSvg
                  graph={visibleGraph}
                  highlightedNodeIds={highlightedNodeIds}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={selectNode}
                />
              ) : (
                <div className="flex min-h-[560px] items-center justify-center p-8 text-center">
                  <div className="max-w-md">
                    <Sparkles className="mx-auto size-10 text-amber-200" />
                    <h3 className="mt-4 text-2xl font-semibold">
                      Карта ждёт первые опубликованные узлы
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-stone-400">
                      Когда темы появятся в `node_projection` со статусом `published`, они станут
                      созвездием здесь.
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 hidden rounded-2xl border border-white/10 bg-stone-950/75 p-4 backdrop-blur lg:block">
                <AtlasLegend />
              </div>

              {statusMessage ? (
                <div className="absolute right-4 bottom-4 max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50 backdrop-blur">
                  {statusMessage}
                </div>
              ) : null}
            </div>
          )}

          {viewMode !== "atlas" && statusMessage ? (
            <div className="mt-4 max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50 backdrop-blur">
              {statusMessage}
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-4 sm:p-6 xl:border-t-0 xl:border-l">
          <SelectedNodePanel
            activeCluster={activeCluster}
            graph={graph}
            isLoadingNeighbors={isLoadingNeighbors}
            node={selectedNode}
            onSelectCluster={selectCluster}
            onLoadNeighbors={loadNeighbors}
            onReset={resetGraph}
          />

          <div className="mt-4 grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 text-stone-200">
            <div className="flex items-center gap-3">
              <Network className="size-5 text-amber-200" />
              <div>
                <p className="font-semibold">Как читать карту</p>
                <p className="text-sm text-stone-500">
                  Центр — выбранный фокус, орбиты — контекст.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-stone-400">
              <p>
                <span className="text-stone-100">{projectedCount}</span> опубликованных узлов можно
                раскрывать через соседей.
              </p>
              <p>
                <span className="text-stone-100">{unresolvedCount}</span> пунктирных хвостов требуют
                модерации или отдельной карточки.
              </p>
              <p className="flex items-center gap-2">
                <GitBranch className="size-4 text-amber-200" />
                Связи читаются из `graph_edges`, затем дополняются refs из карточек.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
