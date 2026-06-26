import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileText,
  GitBranch,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PublishedMapGraph, PublishedMapNode } from "../api/map-queries";
import type { PublicNodeProjection } from "../api/public-queries";
import type {
  TopicDossier,
  TopicDossierEntity,
  TopicDossierSourceRef,
  TopicDossierTextItem,
  TopicDossierTimelineItem,
} from "../lib/topic-dossier";
import { TopicLiveResearch } from "./topic-live-research";

interface TopicDossierViewProps {
  dossier: TopicDossier;
  neighbors: PublishedMapGraph | null;
  slug: string;
  topic: PublicNodeProjection;
}

interface MiniMapPoint extends PublishedMapNode {
  x: number;
  y: number;
}

function getTopicStatusBadges(input: {
  dossier: TopicDossier;
  neighbors: PublishedMapGraph | null;
}): Array<{ tone: "amber" | "emerald" | "stone"; label: string }> {
  return [
    { tone: "emerald", label: "published projection" },
    input.dossier.sourceRefs.length > 0
      ? { tone: "emerald", label: "source-backed" }
      : { tone: "amber", label: "needs sources" },
    input.dossier.unresolvedRefs.length > 0 ||
    input.neighbors?.nodes.some((node) => !node.isProjected)
      ? { tone: "amber", label: "has tails" }
      : { tone: "stone", label: "no tails visible" },
  ];
}

function Badge({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: "amber" | "emerald" | "stone";
}): React.ReactElement {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        tone === "emerald" && "border-emerald-600/20 bg-emerald-500/10 text-emerald-800",
        tone === "amber" && "border-amber-600/20 bg-amber-500/10 text-amber-900",
        tone === "stone" && "border-stone-900/10 bg-stone-950/5 text-stone-700"
      )}
    >
      {children}
    </span>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-stone-900/10 bg-white/55 p-4 shadow-sm">
      <p className="text-3xl font-semibold tracking-tight text-stone-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-stone-500">{label}</p>
    </div>
  );
}

function SectionShell({
  children,
  eyebrow,
  icon,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  icon: React.ReactNode;
  title: string;
}): React.ReactElement {
  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-6 shadow-sm shadow-stone-900/5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-stone-950 text-amber-100">
          {icon}
        </div>
        <div>
          {eyebrow ? (
            <p className="font-mono text-[11px] tracking-[0.22em] text-stone-500 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function TextItemList({
  empty,
  items,
}: {
  empty: string;
  items: TopicDossierTextItem[];
}): React.ReactElement {
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-stone-500">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item.title ?? "item"}-${index}`}
          className="rounded-2xl bg-stone-950/[0.04] p-4"
        >
          {item.title ? <p className="mb-2 font-semibold text-stone-950">{item.title}</p> : null}
          <p className="leading-7 text-stone-700">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

function EntityList({
  empty,
  items,
}: {
  empty: string;
  items: TopicDossierEntity[];
}): React.ReactElement {
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-stone-500">{empty}</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <li
          key={`${item.id ?? item.title}-${index}`}
          className="rounded-2xl border border-stone-900/10 bg-white/60 p-4"
        >
          <p className="font-medium text-stone-950">{item.title}</p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase">
            {item.kind ?? "projection ref"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Timeline({ items }: { items: TopicDossierTimelineItem[] }): React.ReactElement {
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-stone-500">Хронология пока не опубликована.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-stone-900/10 pl-5">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative">
          <span className="absolute top-1.5 -left-[1.65rem] size-3 rounded-full border-2 border-white bg-amber-600 shadow" />
          <p className="font-mono text-xs text-stone-500">{item.date ?? "без даты"}</p>
          <h3 className="mt-1 font-semibold text-stone-950">{item.title}</h3>
          {item.body ? <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function SourceEvidenceCard({ source }: { source: TopicDossierSourceRef }): React.ReactElement {
  return (
    <li className="rounded-2xl border border-stone-900/10 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-950">{source.title ?? source.nodeId}</p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-stone-500 uppercase">
            {source.kind ?? "source"} {source.date ? `· ${source.date}` : ""}
          </p>
        </div>
        {source.reliability ? <Badge tone="stone">trust {source.reliability}</Badge> : null}
      </div>
      {source.supports ? (
        <p className="mt-3 text-sm leading-6 text-stone-600">{source.supports}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/sources/${source.nodeId}` as Route}>
            Открыть источник
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
        {source.url ? (
          <Button asChild size="sm" variant="outline">
            <a href={source.url} rel="noreferrer" target="_blank">
              Внешняя ссылка
              <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function MiniMap({
  graph,
  topic,
}: {
  graph: PublishedMapGraph | null;
  topic: PublicNodeProjection;
}): React.ReactElement {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const rootId = topic.brain_node_id;
  const rootNode = nodes.find((node) => node.id === rootId);
  const neighborNodes = nodes.filter((node) => node.id !== rootId).slice(0, 10);
  const points: MiniMapPoint[] = [
    {
      brainNodeId: topic.brain_node_id,
      id: topic.brain_node_id,
      isProjected: true,
      nodeType: "topic",
      projectionId: topic.id,
      publishedAt: topic.published_at,
      slug: topic.slug,
      summary: topic.summary,
      title: topic.title,
      updatedAt: topic.updated_at,
      x: 210,
      y: 150,
    },
    ...neighborNodes.map((node, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, neighborNodes.length);
      return {
        ...node,
        x: 210 + Math.cos(angle) * 132,
        y: 150 + Math.sin(angle) * 92,
      };
    }),
  ];
  const pointById = new Map(points.map((point) => [point.id, point]));

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950 text-stone-100 shadow-2xl shadow-stone-950/15">
      <div className="border-b border-white/10 p-5">
        <p className="font-mono text-xs tracking-[0.22em] text-amber-200 uppercase">mini map</p>
        <h2 className="mt-2 text-2xl font-semibold">Ближайшие связи</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Это direct-neighbor срез из projection. Полный режим открыт в Карте пробуждения.
        </p>
      </div>
      <svg className="h-72 w-full" viewBox="0 0 420 300" role="img" aria-label="Мини-карта темы">
        <defs>
          <radialGradient id="dossier-mini-map" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.22)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0)" />
          </radialGradient>
        </defs>
        <rect width="420" height="300" fill="url(#dossier-mini-map)" />
        <ellipse cx="210" cy="150" rx="132" ry="92" fill="none" stroke="rgba(255,255,255,0.09)" />
        {edges.map((edge) => {
          const source = pointById.get(edge.sourceId);
          const target = pointById.get(edge.targetId);
          if (!source || !target) return null;

          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={edge.resolved ? "rgba(245,158,11,0.38)" : "rgba(226,232,240,0.32)"}
              strokeDasharray={edge.resolved ? undefined : "5 6"}
              strokeLinecap="round"
            />
          );
        })}
        {points.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <circle
              r={node.id === rootId ? 20 : 12}
              fill={node.isProjected ? "#0c0a09" : "rgba(68,64,60,0.82)"}
              stroke={node.id === rootId ? "#f59e0b" : node.isProjected ? "#a8a29e" : "#d6d3d1"}
              strokeDasharray={node.isProjected ? undefined : "3 4"}
              strokeWidth={node.id === rootId ? 2.5 : 1.5}
            />
            <text
              y={node.id === rootId ? 38 : 28}
              textAnchor="middle"
              className="fill-stone-100 text-[11px] font-medium"
            >
              {node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title}
            </text>
          </g>
        ))}
      </svg>
      <div className="border-t border-white/10 p-5">
        <Button asChild className="w-full bg-amber-300 text-stone-950 hover:bg-amber-200">
          <Link href={`${ROUTES.awakeningMap}?node=${encodeURIComponent(topic.brain_node_id)}`}>
            <MapIcon className="size-4" />
            Открыть в Карте пробуждения
          </Link>
        </Button>
        {!rootNode && nodes.length === 0 ? (
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Соседи пока не опубликованы в projection.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TopicDossierView({
  dossier,
  neighbors,
  slug,
  topic,
}: TopicDossierViewProps): React.ReactElement {
  const badges = getTopicStatusBadges({ dossier, neighbors });
  const evidenceCount = dossier.sourceRefs.length;
  const relationCount = neighbors?.edges.length ?? dossier.relatedTopics.length;
  const unresolvedCount =
    dossier.unresolvedRefs.length +
    (neighbors?.nodes.filter((node) => !node.isProjected).length ?? 0);

  return (
    <article className="flex flex-1 bg-[#f5efe3] px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Breadcrumbs className="mb-6 text-stone-600" labels={{ [slug]: topic.title }} />

        <header className="relative overflow-hidden rounded-[2.5rem] border border-stone-900/10 bg-[#ebe0c9] p-6 shadow-sm sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(146,64,14,0.18),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(15,23,42,0.12),transparent_24%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.26em] text-stone-600 uppercase">
                topic dossier · projection case file
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-7xl">
                {topic.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700">
                {topic.summary ??
                  "Summary пока не опубликован. Страница показывает только то, что уже есть в projection."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={badge.label} tone={badge.tone}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <EvidenceMetric label="источники" value={evidenceCount} />
              <EvidenceMetric label="связи" value={relationCount} />
              <EvidenceMetric label="хвосты" value={unresolvedCount} />
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-6">
            <SectionShell eyebrow="brief" icon={<BookOpen className="size-5" />} title="Кратко">
              <p className="leading-8 text-stone-700">
                {dossier.description ??
                  topic.summary ??
                  "Описание пока не опубликовано в projection. Редактор может дополнить `content.description` при следующей публикации."}
              </p>
            </SectionShell>

            <SectionShell
              eyebrow="evidence"
              icon={<ShieldCheck className="size-5" />}
              title="Что известно"
            >
              <TextItemList empty="Ключевые тезисы пока не опубликованы." items={dossier.facts} />
            </SectionShell>

            <SectionShell
              eyebrow="versions"
              icon={<Sparkles className="size-5" />}
              title="Версии и интерпретации"
            >
              <TextItemList
                empty="Отдельные версии пока не опубликованы. Здесь не генерируется AI-текст без данных."
                items={dossier.versions}
              />
            </SectionShell>

            <SectionShell
              eyebrow="timeline"
              icon={<CalendarDays className="size-5" />}
              title="Хронология"
            >
              <Timeline items={dossier.timeline} />
            </SectionShell>

            <SectionShell
              eyebrow="relations"
              icon={<Users className="size-5" />}
              title="Люди, организации, события"
            >
              <div className="grid gap-5">
                <EntityList empty="Люди пока не опубликованы." items={dossier.people} />
                <EntityList
                  empty="Организации пока не опубликованы."
                  items={dossier.organizations}
                />
                <EntityList empty="События пока не опубликованы." items={dossier.events} />
              </div>
            </SectionShell>

            <SectionShell
              eyebrow="counterpoints"
              icon={<AlertTriangle className="size-5" />}
              title="Контраргументы и слабые места"
            >
              <TextItemList
                empty="Слабые места пока не описаны. Это не означает, что их нет; данных просто нет в projection."
                items={dossier.counterarguments}
              />
            </SectionShell>
          </div>

          <aside className="space-y-6">
            <TopicLiveResearch slug={slug} title={topic.title} />

            <MiniMap graph={neighbors} topic={topic} />

            <section className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <FileText className="size-5 text-stone-700" />
                <h2 className="text-xl font-semibold">Источники</h2>
              </div>
              {dossier.sourceRefs.length > 0 ? (
                <ul className="space-y-3">
                  {dossier.sourceRefs.map((source) => (
                    <SourceEvidenceCard
                      key={`${source.nodeId}:${source.title ?? source.url}`}
                      source={source}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-stone-950/[0.04] p-4 text-sm leading-7 text-stone-600">
                  Источники пока не опубликованы. Для доверенного досье нужен хотя бы один
                  `source_refs`.
                </p>
              )}
            </section>

            <section className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <GitBranch className="size-5 text-stone-700" />
                <h2 className="text-xl font-semibold">Неразобранные хвосты</h2>
              </div>
              <EntityList
                empty="Неразобранные хвосты пока не видны в projection."
                items={dossier.unresolvedRefs}
              />
            </section>

            <details className="rounded-[2rem] border border-stone-900/10 bg-stone-950 p-5 text-stone-100">
              <summary className="cursor-pointer text-lg font-semibold">
                Технический снимок projection
              </summary>
              <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-stone-300">
                {JSON.stringify(topic.content, null, 2)}
              </pre>
            </details>
          </aside>
        </div>
      </div>
    </article>
  );
}
