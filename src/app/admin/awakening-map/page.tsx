import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  awakeningTopicSuggestionStatuses,
  getAwakeningTopicSuggestion,
  listAwakeningTopicSuggestions,
  type AwakeningTopicSuggestion,
  type AwakeningTopicSuggestionStatus,
} from "@/features/awakening-map";
import { AdminAccessDeniedError } from "@/lib/admin-auth";
import { ROUTES } from "@/lib/constants";

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

function StatusPill({ status }: { status: AwakeningTopicSuggestionStatus }): React.ReactElement {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
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
  suggestion,
}: {
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
          Детальная проверка пока read-only: approve/reject/merge будет следующим audited action.
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
    </aside>
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
  let accessDenied = false;

  try {
    suggestions = await listAwakeningTopicSuggestions({
      limit: 50,
      status: statusFilter,
    });
    selectedSuggestion = selectedId ? await getAwakeningTopicSuggestion(selectedId) : null;
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      accessDenied = true;
    } else {
      throw error;
    }
  }

  if (accessDenied) return <AccessDeniedState />;

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
              Read-only очередь предложенных тем: админ проверяет контекст, источники и связи перед
              будущим approve/reject/merge action.
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
          <DetailPanel suggestion={selectedSuggestion} />
        </div>
      )}
    </section>
  );
}
