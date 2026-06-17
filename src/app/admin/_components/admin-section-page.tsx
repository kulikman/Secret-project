import Link from "next/link";

import { Button } from "@/components/ui/button";

type SectionStatus = "available" | "blocked" | "planned" | "ready";

interface AdminPanelProps {
  title: string;
  items: readonly string[];
}

interface AdminSectionPageProps {
  title: string;
  eyebrow: string;
  summary: string;
  status: SectionStatus;
  capabilities: readonly string[];
  settings: readonly string[];
  dependencies: readonly string[];
  nextActions: readonly string[];
}

const STATUS_LABEL: Record<SectionStatus, string> = {
  available: "shell готов",
  blocked: "ждет зависимости",
  planned: "спроектировано",
  ready: "готово",
};

const STATUS_CLASS: Record<SectionStatus, string> = {
  available: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  blocked: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  planned: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  ready: "border-stone-500/30 bg-stone-500/10 text-stone-700 dark:text-stone-200",
};

export function AdminStatusPill({ status }: { status: SectionStatus }): React.ReactElement {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function AdminPanel({ title, items }: AdminPanelProps): React.ReactElement {
  return (
    <section className="border-border bg-card rounded-3xl border p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-muted-foreground flex gap-3 text-sm leading-6">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminSectionPage({
  title,
  eyebrow,
  summary,
  status,
  capabilities,
  settings,
  dependencies,
  nextActions,
}: AdminSectionPageProps): React.ReactElement {
  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-[#f5efe3] p-8 text-stone-950 shadow-sm dark:border-white/10 dark:bg-stone-950 dark:text-stone-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs tracking-[0.25em] text-stone-600 uppercase dark:text-stone-400">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-4 text-lg leading-8 text-stone-700 dark:text-stone-300">{summary}</p>
          </div>
          <AdminStatusPill status={status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title="Функционал" items={capabilities} />
        <AdminPanel title="Настройки" items={settings} />
        <AdminPanel title="Зависимости" items={dependencies} />
        <AdminPanel title="Следующие действия для Codex" items={nextActions} />
      </div>

      <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Полная декомпозиция админки</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Документ лежит в `docs/18_ADMIN_CONSOLE.md` и описывает эпики, настройки и риски.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={{ pathname: "/admin" }}>Вернуться в пульт</Link>
        </Button>
      </div>
    </section>
  );
}
