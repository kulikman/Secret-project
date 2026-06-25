import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  awakeningGraphEdgeStatusSchema,
  awakeningMapProjectionStatusSchema,
  createAwakeningGraphEdge,
  awakeningTopicSuggestionStatuses,
  listAwakeningGraphEdges,
  listAwakeningMapProjections,
  approveAwakeningTopicSuggestion,
  getAwakeningTopicSuggestion,
  listAwakeningTopicSuggestions,
  mergeAwakeningTopicSuggestion,
  rejectAwakeningTopicSuggestion,
  updateAwakeningGraphEdge,
  updateAwakeningMapProjection,
  awakeningReferenceClusters,
  awakeningReferenceBoundsSchema,
  awakeningReferenceClusterStatusSchema,
  awakeningReferenceMatcherSchema,
  awakeningMapThemeGroupIdSchema,
  getAwakeningMapThemeGroup,
  listAdminAwakeningReferenceClusters,
  type AwakeningGraphEdge,
  type AwakeningGraphEdgeStatus,
  type AwakeningMapProjection,
  type AwakeningMapProjectionStatus,
  type AdminAwakeningReferenceCluster,
  type AwakeningReferenceCluster,
  type AwakeningReferenceClusterStatus,
  type AwakeningTopicSuggestion,
  type AwakeningTopicSuggestionStatus,
  updateAwakeningReferenceCluster,
} from "@/features/awakening-map";
import { AdminAccessDeniedError } from "@/lib/admin-auth";
import { ROUTES } from "@/lib/constants";
import { graphRelationTypeSchema, graphRelationTypes } from "@/lib/graph-relations";
import { sourceRefSchema, type SourceRef } from "@/lib/source-refs";

export const metadata: Metadata = {
  title: "Карта пробуждения | Админка",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_LABEL: Record<AwakeningTopicSuggestionStatus, string> = {
  approved: "Одобрена",
  merged: "Смержена",
  pending: "На проверке",
  rejected: "Отклонена",
};

const STATUS_CLASS: Record<AwakeningTopicSuggestionStatus, string> = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  merged: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
};

const GRAPH_EDGE_STATUS_LABEL: Record<AwakeningGraphEdgeStatus, string> = {
  archived: "В архиве",
  draft: "Черновик",
  published: "Опубликована",
  review: "На проверке",
};

const GRAPH_EDGE_STATUS_CLASS: Record<AwakeningGraphEdgeStatus, string> = {
  archived: "border-stone-500/30 bg-stone-500/10 text-stone-700 dark:text-stone-200",
  draft: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-200",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  review: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

const GRAPH_EDGE_STATUSES: AwakeningGraphEdgeStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

const MAP_PROJECTION_STATUS_LABEL: Record<AwakeningMapProjectionStatus, string> = {
  archived: "В архиве",
  draft: "Черновик",
  published: "Опубликован",
  review: "На проверке",
};

const MAP_PROJECTION_STATUSES: AwakeningMapProjectionStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

const REFERENCE_CLUSTER_STATUS_LABEL: Record<AwakeningReferenceClusterStatus, string> = {
  archived: "В архиве",
  draft: "Черновик",
  published: "Опубликован",
  review: "На проверке",
};

const REFERENCE_CLUSTER_STATUSES: AwakeningReferenceClusterStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusFilter(
  value: string | string[] | undefined
): AwakeningTopicSuggestionStatus | undefined {
  const raw = getSingleParam(value);
  return awakeningTopicSuggestionStatuses.includes(raw as AwakeningTopicSuggestionStatus)
    ? (raw as AwakeningTopicSuggestionStatus)
    : undefined;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function countJsonArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function formatShortId(value: string): string {
  return value.slice(0, 8);
}

function getRequiredFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required form field: ${key}`);
  }

  return value.trim();
}

function getOptionalFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalSourceRefsFormValue(formData: FormData, key: string): SourceRef[] {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`Form field ${key} must be a JSON array.`);
  }

  return sourceRefSchema.array().max(25).parse(parsed);
}

function getJsonArrayFormValue(formData: FormData, key: string): string[] {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`Form field ${key} must be a JSON string array.`);
  }

  return parsed.map((item) => item.trim()).filter(Boolean);
}

function getJsonObjectFormValue(formData: FormData, key: string): Record<string, unknown> {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required JSON object field: ${key}`);
  }

  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Form field ${key} must be a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

async function createGraphEdgeAction(formData: FormData): Promise<void> {
  "use server";

  await createAwakeningGraphEdge({
    fromNodeProjectionId: getRequiredFormString(formData, "fromNodeProjectionId"),
    relationType: graphRelationTypeSchema.parse(getRequiredFormString(formData, "relationType")),
    sourceRefs: getOptionalSourceRefsFormValue(formData, "sourceRefs"),
    status: awakeningGraphEdgeStatusSchema.parse(getRequiredFormString(formData, "status")),
    strength: Number(getRequiredFormString(formData, "strength")),
    toNodeProjectionId: getRequiredFormString(formData, "toNodeProjectionId"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
}

async function updateGraphEdgeAction(formData: FormData): Promise<void> {
  "use server";

  await updateAwakeningGraphEdge({
    edgeId: getRequiredFormString(formData, "edgeId"),
    relationType: graphRelationTypeSchema.parse(getRequiredFormString(formData, "relationType")),
    sourceRefs: getOptionalSourceRefsFormValue(formData, "sourceRefs"),
    status: awakeningGraphEdgeStatusSchema.parse(getRequiredFormString(formData, "status")),
    strength: Number(getRequiredFormString(formData, "strength")),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
}

async function updateMapProjectionAction(formData: FormData): Promise<void> {
  "use server";

  await updateAwakeningMapProjection({
    projectionId: getRequiredFormString(formData, "projectionId"),
    slug: getOptionalFormString(formData, "slug"),
    sourceRefs: getOptionalSourceRefsFormValue(formData, "sourceRefs"),
    status: awakeningMapProjectionStatusSchema.parse(getRequiredFormString(formData, "status")),
    summary: getOptionalFormString(formData, "summary"),
    title: getRequiredFormString(formData, "title"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
  revalidatePath(ROUTES.awakeningMap);
}

async function updateReferenceClusterAction(formData: FormData): Promise<void> {
  "use server";

  await updateAwakeningReferenceCluster({
    bounds: awakeningReferenceBoundsSchema.parse(getJsonObjectFormValue(formData, "bounds")),
    clusterId: getRequiredFormString(formData, "clusterId"),
    groupId: awakeningMapThemeGroupIdSchema.parse(getRequiredFormString(formData, "groupId")),
    keyTopics: getJsonArrayFormValue(formData, "keyTopics"),
    keywords: getJsonArrayFormValue(formData, "keywords"),
    label: getRequiredFormString(formData, "label"),
    matcher: awakeningReferenceMatcherSchema.parse(getJsonObjectFormValue(formData, "matcher")),
    relatedClusterIds: getJsonArrayFormValue(formData, "relatedClusterIds"),
    status: awakeningReferenceClusterStatusSchema.parse(getRequiredFormString(formData, "status")),
    summary: getRequiredFormString(formData, "summary"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
  revalidatePath(ROUTES.awakeningMap);
}

async function approveSuggestionAction(formData: FormData): Promise<void> {
  "use server";

  await approveAwakeningTopicSuggestion({
    decisionReason: getRequiredFormString(formData, "decisionReason"),
    suggestionId: getRequiredFormString(formData, "suggestionId"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
}

async function rejectSuggestionAction(formData: FormData): Promise<void> {
  "use server";

  await rejectAwakeningTopicSuggestion({
    decisionReason: getRequiredFormString(formData, "decisionReason"),
    suggestionId: getRequiredFormString(formData, "suggestionId"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
}

async function mergeSuggestionAction(formData: FormData): Promise<void> {
  "use server";

  await mergeAwakeningTopicSuggestion({
    decisionReason: getRequiredFormString(formData, "decisionReason"),
    promotedNodeProjectionId: getRequiredFormString(formData, "promotedNodeProjectionId"),
    suggestionId: getRequiredFormString(formData, "suggestionId"),
  });
  revalidatePath(ROUTES.adminAwakeningMap);
}

function StatusPill({ status }: { status: AwakeningTopicSuggestionStatus }): React.ReactElement {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function GraphEdgeStatusPill({ status }: { status: AwakeningGraphEdgeStatus }): React.ReactElement {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${GRAPH_EDGE_STATUS_CLASS[status]}`}
    >
      {GRAPH_EDGE_STATUS_LABEL[status]}
    </span>
  );
}

function MapProjectionStatusPill({
  status,
}: {
  status: AwakeningMapProjectionStatus;
}): React.ReactElement {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${GRAPH_EDGE_STATUS_CLASS[status]}`}
    >
      {MAP_PROJECTION_STATUS_LABEL[status]}
    </span>
  );
}

function EmptyState({
  statusFilter,
}: {
  statusFilter?: AwakeningTopicSuggestionStatus;
}): React.ReactElement {
  return (
    <div className="border-border bg-muted/30 rounded-3xl border p-8">
      <h2 className="text-xl font-semibold tracking-tight">Предложений пока нет</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {statusFilter
          ? `В статусе "${STATUS_LABEL[statusFilter]}" ничего не найдено.`
          : "Когда появятся предложенные темы для карты, они попадут сюда как pending."}
      </p>
    </div>
  );
}

function AccessDeniedState(): React.ReactElement {
  return (
    <div className="border-border bg-card rounded-3xl border p-8">
      <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
        restricted
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Нужна роль curator/editor/admin
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
        Общий доступ к админке есть, но очередь предложений карты доступна только ролям `curator`,
        `editor`, `admin` и `super_admin`.
      </p>
    </div>
  );
}

function SuggestionCard({
  selected,
  suggestion,
  statusFilter,
}: {
  selected: boolean;
  suggestion: AwakeningTopicSuggestion;
  statusFilter?: AwakeningTopicSuggestionStatus;
}): React.ReactElement {
  return (
    <Link
      href={{
        pathname: ROUTES.adminAwakeningMap,
        query: {
          ...(statusFilter ? { status: statusFilter } : {}),
          id: suggestion.id,
        },
      }}
      className={`border-border bg-card hover:border-foreground/30 block rounded-3xl border p-5 shadow-sm transition-colors ${
        selected ? "ring-2 ring-amber-500/60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{suggestion.title}</h2>
        <StatusPill status={suggestion.status} />
      </div>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {suggestion.summary ?? suggestion.description ?? "Описание не указано"}
      </p>
      <div className="text-muted-foreground mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <span>Создано: {formatDate(suggestion.created_at)}</span>
        <span>Источники: {countJsonArray(suggestion.source_refs)}</span>
        <span>Связи: {countJsonArray(suggestion.related_node_refs)}</span>
      </div>
    </Link>
  );
}

function DetailPanel({
  mergeTargetProjections,
  suggestion,
}: {
  mergeTargetProjections: AwakeningMapProjection[];
  suggestion: AwakeningTopicSuggestion | null;
}): React.ReactElement {
  if (!suggestion) {
    return (
      <aside className="border-border bg-muted/30 rounded-3xl border p-6">
        <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
          detail
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">Выберите тему</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Здесь откроется карточка редакторского решения: принять в карту, отклонить или смержить с
          уже существующей темой.
        </p>
      </aside>
    );
  }

  return (
    <aside className="border-border bg-card rounded-3xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
          selected suggestion
        </p>
        <StatusPill status={suggestion.status} />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{suggestion.title}</h2>
      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="font-semibold">Slug</dt>
          <dd className="text-muted-foreground mt-1">{suggestion.slug ?? "Не задан"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Summary</dt>
          <dd className="text-muted-foreground mt-1 leading-6">
            {suggestion.summary ?? "Не указан"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Description</dt>
          <dd className="text-muted-foreground mt-1 leading-6 whitespace-pre-wrap">
            {suggestion.description ?? "Не указано"}
          </dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/40 rounded-2xl p-3">
            <dt className="text-muted-foreground">Source refs</dt>
            <dd className="mt-1 text-lg font-semibold">{countJsonArray(suggestion.source_refs)}</dd>
          </div>
          <div className="bg-muted/40 rounded-2xl p-3">
            <dt className="text-muted-foreground">Related refs</dt>
            <dd className="mt-1 text-lg font-semibold">
              {countJsonArray(suggestion.related_node_refs)}
            </dd>
          </div>
        </div>
        <div>
          <dt className="font-semibold">Review</dt>
          <dd className="text-muted-foreground mt-1 leading-6">
            {suggestion.reviewed_at
              ? `${formatDate(suggestion.reviewed_at)} · ${suggestion.decision_reason ?? "без причины"}`
              : "Ещё не проверено"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Promoted projection</dt>
          <dd className="text-muted-foreground mt-1">
            {suggestion.promoted_node_projection_id ?? "Не связано"}
          </dd>
        </div>
      </dl>
      {suggestion.status === "pending" ? (
        <div className="mt-6 space-y-4">
          <form
            action={approveSuggestionAction}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4"
          >
            <input name="suggestionId" type="hidden" value={suggestion.id} />
            <label className="text-sm font-semibold">
              Причина принятия
              <textarea
                className="border-input bg-background mt-2 min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                maxLength={1000}
                minLength={3}
                name="decisionReason"
                placeholder="Например: источники проверены, тема готова к редакторской проекции."
                required
              />
            </label>
            <Button className="mt-3 w-full" type="submit">
              Принять в карту
            </Button>
          </form>

          <form
            action={mergeSuggestionAction}
            className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4"
          >
            <input name="suggestionId" type="hidden" value={suggestion.id} />
            <label className="text-sm font-semibold">
              Каноническая тема
              <select
                className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                disabled={mergeTargetProjections.length === 0}
                name="promotedNodeProjectionId"
                required
              >
                <option value="">Выберите существующую topic-проекцию</option>
                {mergeTargetProjections.map((projection) => (
                  <option key={projection.id} value={projection.id}>
                    {projection.title} · {projection.status} · {formatShortId(projection.id)}
                  </option>
                ))}
              </select>
            </label>
            {mergeTargetProjections.length === 0 ? (
              <p className="mt-2 text-xs leading-5 text-sky-800 dark:text-sky-100">
                В последних `node_projection` нет topic-карточек. Сначала примите тему в review или
                расширьте выборку реестра.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-sky-800 dark:text-sky-100">
                Выбор ограничен существующими `topic`-проекциями; сервер повторно проверит тип и
                UUID перед merge.
              </p>
            )}
            <label className="mt-3 block text-sm font-semibold">
              Причина merge
              <textarea
                className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                maxLength={1000}
                minLength={3}
                name="decisionReason"
                placeholder="Например: дубль существующей темы, оставляем каноническую карточку."
                required
              />
            </label>
            <Button
              className="mt-3 w-full"
              disabled={mergeTargetProjections.length === 0}
              type="submit"
              variant="outline"
            >
              Смержить
            </Button>
          </form>

          <form
            action={rejectSuggestionAction}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4"
          >
            <input name="suggestionId" type="hidden" value={suggestion.id} />
            <label className="text-sm font-semibold">
              Причина отклонения
              <textarea
                className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                maxLength={1000}
                minLength={3}
                name="decisionReason"
                placeholder="Например: недостаточно источников или тема уже разобрана в другой карточке."
                required
              />
            </label>
            <Button className="mt-3 w-full" type="submit" variant="destructive">
              Отклонить
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-muted/40 mt-6 rounded-2xl p-4 text-sm">
          <p className="font-semibold">Решение уже принято</p>
          <p className="text-muted-foreground mt-1 leading-6">
            Повторный approve/reject/merge заблокирован на сервере, чтобы не ломать audit trail.
          </p>
        </div>
      )}
    </aside>
  );
}

function formatGraphEdgeNode(edge: AwakeningGraphEdge, side: "from" | "to"): string {
  const node = side === "from" ? edge.fromNode : edge.toNode;
  if (!node) return side === "from" ? edge.fromNodeId : edge.toNodeId;

  return `${node.title} · ${node.nodeType} · ${node.status}`;
}

function GraphEdgesPanel({ edges }: { edges: AwakeningGraphEdge[] }): React.ReactElement {
  return (
    <section className="grid gap-5 xl:grid-cols-[24rem_1fr]">
      <form
        action={createGraphEdgeAction}
        className="border-border bg-card rounded-3xl border p-5 shadow-sm"
      >
        <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
          graph edges
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">Новая связь</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Создает явное ребро между двумя `node_projection` карточками. Опубликовать можно только
          связь между опубликованными узлами.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          From projection id
          <input
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
            name="fromNodeProjectionId"
            placeholder="uuid исходного узла"
            required
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          To projection id
          <input
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
            name="toNodeProjectionId"
            placeholder="uuid целевого узла"
            required
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Relation
            <select
              className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
              defaultValue="related_to"
              name="relationType"
            >
              {graphRelationTypes.map((relation) => (
                <option key={relation} value={relation}>
                  {relation}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status
            <select
              className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
              defaultValue="review"
              name="status"
            >
              {GRAPH_EDGE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {GRAPH_EDGE_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Strength
          <input
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
            defaultValue="1"
            max="1"
            min="0"
            name="strength"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Source refs JSON
          <textarea
            className="border-input bg-background mt-2 min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
            defaultValue="[]"
            name="sourceRefs"
          />
        </label>
        <Button className="mt-4 w-full" type="submit">
          Создать связь
        </Button>
      </form>

      <div className="space-y-4">
        <div className="border-border bg-muted/30 rounded-3xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Связи карты</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Эти ребра первичны для публичной карты; старые refs остаются fallback.
              </p>
            </div>
            <span className="rounded-2xl bg-white/70 px-4 py-2 text-2xl font-semibold dark:bg-white/10">
              {edges.length}
            </span>
          </div>
        </div>

        {edges.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-3xl border p-6 text-sm">
            Явных `graph_edges` пока нет или миграция еще не применена в Supabase.
          </div>
        ) : (
          edges.map((edge) => (
            <form
              action={updateGraphEdgeAction}
              className="border-border bg-card rounded-3xl border p-5 shadow-sm"
              key={edge.id}
            >
              <input name="edgeId" type="hidden" value={edge.id} />
              <div className="flex flex-wrap items-center gap-3">
                <GraphEdgeStatusPill status={edge.status} />
                <span className="text-muted-foreground font-mono text-xs">{edge.id}</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
                <div className="bg-muted/40 rounded-2xl p-3">
                  <p className="text-muted-foreground">From</p>
                  <p className="mt-1 font-semibold">{formatGraphEdgeNode(edge, "from")}</p>
                </div>
                <div className="bg-muted/40 rounded-2xl p-3">
                  <p className="text-muted-foreground">To</p>
                  <p className="mt-1 font-semibold">{formatGraphEdgeNode(edge, "to")}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="text-sm font-semibold">
                  Relation
                  <select
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={edge.relationType}
                    name="relationType"
                  >
                    {graphRelationTypes.map((relation) => (
                      <option key={relation} value={relation}>
                        {relation}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <select
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={edge.status}
                    name="status"
                  >
                    {GRAPH_EDGE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {GRAPH_EDGE_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Strength
                  <input
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={edge.strength}
                    max="1"
                    min="0"
                    name="strength"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm font-semibold">
                Source refs JSON
                <textarea
                  className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
                  defaultValue={JSON.stringify(edge.sourceRefs, null, 2)}
                  name="sourceRefs"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  Обновлено: {formatDate(edge.updatedAt)}
                </span>
                <Button type="submit" variant="outline">
                  Сохранить связь
                </Button>
              </div>
            </form>
          ))
        )}
      </div>
    </section>
  );
}

function MapProjectionsPanel({
  projections,
}: {
  projections: AwakeningMapProjection[];
}): React.ReactElement {
  return (
    <section className="space-y-4">
      <div className="border-border bg-muted/30 rounded-3xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
              node projection registry
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Узлы карты</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Здесь можно отредактировать карточку и перевести ее в `published` или `archived`.
              Сервер дополнительно проверит slug и source refs перед публикацией.
            </p>
          </div>
          <span className="rounded-2xl bg-white/70 px-4 py-2 text-2xl font-semibold dark:bg-white/10">
            {projections.length}
          </span>
        </div>
      </div>

      {projections.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-3xl border p-6 text-sm">
          `node_projection` пока пуст. Сначала примите предложение или примените seed для карты.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projections.map((projection) => (
            <form
              action={updateMapProjectionAction}
              className="border-border bg-card rounded-3xl border p-5 shadow-sm"
              key={projection.id}
            >
              <input name="projectionId" type="hidden" value={projection.id} />
              <div className="flex flex-wrap items-center gap-3">
                <MapProjectionStatusPill status={projection.status} />
                <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs">
                  {projection.nodeType}
                </span>
                {projection.isStale ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                    stale
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem]">
                <label className="text-sm font-semibold">
                  Title
                  <input
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={projection.title}
                    maxLength={240}
                    name="title"
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <select
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={projection.status}
                    name="status"
                  >
                    {MAP_PROJECTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {MAP_PROJECTION_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-3 block text-sm font-semibold">
                Slug
                <input
                  className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                  defaultValue={projection.slug ?? ""}
                  maxLength={160}
                  name="slug"
                  placeholder="required for published topic/source"
                />
              </label>

              <label className="mt-3 block text-sm font-semibold">
                Summary
                <textarea
                  className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue={projection.summary ?? ""}
                  maxLength={2000}
                  name="summary"
                />
              </label>

              <label className="mt-3 block text-sm font-semibold">
                Source refs JSON
                <textarea
                  className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
                  defaultValue={JSON.stringify(projection.sourceRefs, null, 2)}
                  name="sourceRefs"
                />
              </label>

              <div className="text-muted-foreground mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <span>ID: {projection.id}</span>
                <span>Brain: {projection.brainNodeId}</span>
                <span>Обновлено: {formatDate(projection.updatedAt)}</span>
                <span>
                  Опубликовано:{" "}
                  {projection.publishedAt ? formatDate(projection.publishedAt) : "нет"}
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="submit" variant="outline">
                  Сохранить узел
                </Button>
              </div>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}

function formatClusterBounds(cluster: AwakeningReferenceCluster): string {
  const { bounds } = cluster;

  return `x ${Math.round(bounds.x * 100)}% · y ${Math.round(bounds.y * 100)}% · w ${Math.round(bounds.width * 100)}% · h ${Math.round(bounds.height * 100)}%`;
}

function ReferenceClusterStatusPill({
  status,
}: {
  status: AwakeningReferenceClusterStatus;
}): React.ReactElement {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${GRAPH_EDGE_STATUS_CLASS[status]}`}
    >
      {REFERENCE_CLUSTER_STATUS_LABEL[status]}
    </span>
  );
}

function ReferenceClustersPanel({
  clusters,
}: {
  clusters: AdminAwakeningReferenceCluster[];
}): React.ReactElement {
  return (
    <section className="space-y-4">
      <div className="border-border bg-muted/30 rounded-3xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
              reference hotspot registry
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Секторы оригинальной карты
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              DB-backed registry hotspot-кластеров. Public UI читает опубликованные строки из App DB
              и сохраняет in-repo taxonomy как fallback при пустой таблице или outage.
            </p>
          </div>
          <span className="rounded-2xl bg-white/70 px-4 py-2 text-2xl font-semibold dark:bg-white/10">
            {clusters.length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {clusters.map((cluster) => {
          const group = getAwakeningMapThemeGroup(cluster.groupId);

          return (
            <form
              action={updateReferenceClusterAction}
              className="border-border bg-card rounded-3xl border p-5 shadow-sm"
              key={cluster.id}
            >
              <input name="clusterId" type="hidden" value={cluster.id} />
              <div className="flex flex-wrap items-center gap-2">
                <ReferenceClusterStatusPill status={cluster.status} />
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-700 dark:text-amber-200">
                  {cluster.id}
                </span>
                <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs text-sky-700 dark:text-sky-200">
                  {group?.label ?? cluster.groupId}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem]">
                <label className="text-sm font-semibold">
                  Label
                  <input
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={cluster.label}
                    maxLength={160}
                    name="label"
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <select
                    className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                    defaultValue={cluster.status}
                    name="status"
                  >
                    {REFERENCE_CLUSTER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {REFERENCE_CLUSTER_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-3 block text-sm font-semibold">
                Group
                <select
                  className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
                  defaultValue={cluster.groupId}
                  name="groupId"
                >
                  {awakeningReferenceClusters
                    .map((candidate) => candidate.groupId)
                    .filter((groupId, index, all) => all.indexOf(groupId) === index)
                    .map((groupId) => (
                      <option key={groupId} value={groupId}>
                        {getAwakeningMapThemeGroup(groupId)?.label ?? groupId}
                      </option>
                    ))}
                </select>
              </label>

              <label className="mt-3 block text-sm font-semibold">
                Summary
                <textarea
                  className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue={cluster.summary}
                  maxLength={320}
                  name="summary"
                  required
                />
              </label>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  Bounds JSON
                  <textarea
                    className="border-input bg-background mt-2 min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
                    defaultValue={JSON.stringify(cluster.bounds, null, 2)}
                    name="bounds"
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Matcher JSON
                  <textarea
                    className="border-input bg-background mt-2 min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
                    defaultValue={JSON.stringify(cluster.matcher, null, 2)}
                    name="matcher"
                    required
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm font-semibold">
                  Key topics JSON
                  <textarea
                    className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
                    defaultValue={JSON.stringify(cluster.keyTopics, null, 2)}
                    name="keyTopics"
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Keywords JSON
                  <textarea
                    className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
                    defaultValue={JSON.stringify(cluster.keywords, null, 2)}
                    name="keywords"
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Related ids JSON
                  <textarea
                    className="border-input bg-background mt-2 min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
                    defaultValue={JSON.stringify(cluster.relatedClusterIds, null, 2)}
                    name="relatedClusterIds"
                  />
                </label>
              </div>

              <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span>{formatClusterBounds(cluster)}</span>
                <span>
                  Обновлено: {cluster.updatedAt ? formatDate(cluster.updatedAt) : "static fallback"}
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="submit" variant="outline">
                  Сохранить сектор
                </Button>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}

export default async function AdminAwakeningMapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const statusFilter = getStatusFilter(params.status);
  const selectedId = getSingleParam(params.id);

  let suggestions: AwakeningTopicSuggestion[] = [];
  let selectedSuggestion: AwakeningTopicSuggestion | null = null;
  let graphEdges: AwakeningGraphEdge[] = [];
  let mapProjections: AwakeningMapProjection[] = [];
  let referenceClusters: AdminAwakeningReferenceCluster[] = [];
  let accessDenied = false;

  try {
    suggestions = await listAwakeningTopicSuggestions({
      limit: 50,
      status: statusFilter,
    });
    selectedSuggestion = selectedId ? await getAwakeningTopicSuggestion(selectedId) : null;
    graphEdges = await listAwakeningGraphEdges({ limit: 25 });
    mapProjections = await listAwakeningMapProjections({ limit: 50 });
    referenceClusters = await listAdminAwakeningReferenceClusters({ limit: 100 });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      accessDenied = true;
    } else {
      throw error;
    }
  }

  if (accessDenied) return <AccessDeniedState />;

  const mergeTargetProjections = mapProjections.filter(
    (projection) => projection.nodeType === "topic"
  );

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-stone-900/10 bg-[#f2ead7] p-8 text-stone-950 shadow-sm dark:border-white/10 dark:bg-stone-950 dark:text-stone-50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-stone-900" />
        <p className="font-mono text-xs tracking-[0.25em] text-stone-600 uppercase dark:text-stone-400">
          awakening map review
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Карта пробуждения</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700 dark:text-stone-300">
              Очередь предложенных тем: админ проверяет контекст, источники и связи, затем принимает
              тему в `node_projection`, отклоняет её или мержит с канонической карточкой.
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 text-sm shadow-sm dark:bg-white/10">
            <p className="text-muted-foreground">В текущем фильтре</p>
            <p className="mt-1 text-3xl font-semibold">{suggestions.length}</p>
          </div>
        </div>
      </div>

      <form
        className="border-border bg-card flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-end"
        action={ROUTES.adminAwakeningMap}
      >
        <label className="flex-1 text-sm font-semibold">
          Статус
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Все статусы</option>
            {awakeningTopicSuggestionStatuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="submit">Применить</Button>
          <Button variant="outline" asChild>
            <Link href={{ pathname: ROUTES.adminAwakeningMap }}>Сбросить</Link>
          </Button>
        </div>
      </form>

      <GraphEdgesPanel edges={graphEdges} />

      <MapProjectionsPanel projections={mapProjections} />

      <ReferenceClustersPanel clusters={referenceClusters} />

      {suggestions.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-5">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                selected={suggestion.id === selectedSuggestion?.id}
                statusFilter={statusFilter}
                suggestion={suggestion}
              />
            ))}
          </div>
          <DetailPanel
            mergeTargetProjections={mergeTargetProjections}
            suggestion={selectedSuggestion}
          />
        </div>
      )}
    </section>
  );
}
