import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  applicationModerationStatusSchema,
  applicationModerationStatuses,
  changeApplicationStatus,
  listApplicationsForModeration,
  type ApplicationModerationStatus,
  type ModerationApplication,
} from "@/features/community";
import { AdminAccessDeniedError } from "@/lib/admin-auth";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Заявки | Админка",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_LABEL: Record<ApplicationModerationStatus, string> = {
  approved: "Одобрена",
  in_review: "На проверке",
  new: "Новая",
  rejected: "Отклонена",
  waitlisted: "Лист ожидания",
};

const STATUS_CLASS: Record<ApplicationModerationStatus, string> = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  in_review: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  new: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  waitlisted: "border-stone-500/30 bg-stone-500/10 text-stone-700 dark:text-stone-200",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function updateApplicationStatus(formData: FormData): Promise<void> {
  "use server";

  const applicationId = String(formData.get("applicationId") ?? "");
  const status = applicationModerationStatusSchema.parse(formData.get("status"));
  const decisionReason = String(formData.get("decisionReason") ?? "");

  await changeApplicationStatus({
    applicationId,
    decisionReason,
    status,
  });

  revalidatePath(ROUTES.adminApplications);
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusFilter(
  value: string | string[] | undefined
): ApplicationModerationStatus | undefined {
  const result = applicationModerationStatusSchema.safeParse(getSingleParam(value));
  return result.success ? result.data : undefined;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function StatusPill({ status }: { status: ApplicationModerationStatus }): React.ReactElement {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function EmptyState({
  statusFilter,
}: {
  statusFilter?: ApplicationModerationStatus;
}): React.ReactElement {
  return (
    <div className="border-border bg-muted/30 rounded-3xl border p-8">
      <h2 className="text-xl font-semibold tracking-tight">Заявок пока нет</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {statusFilter
          ? `В статусе "${STATUS_LABEL[statusFilter]}" ничего не найдено.`
          : "Когда люди начнут отправлять публичную форму, они появятся здесь."}
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
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Нужна роль curator/admin</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
        Общий доступ к админке есть, но персональные данные заявок и модерация доступны только ролям
        `curator`, `admin` и `super_admin`.
      </p>
    </div>
  );
}

function ApplicationCard({
  application,
}: {
  application: ModerationApplication;
}): React.ReactElement {
  return (
    <article className="border-border bg-card rounded-3xl border p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{application.full_name}</h2>
            <StatusPill status={application.status} />
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {application.email}
            {application.telegram ? ` · ${application.telegram}` : ""}
          </p>
        </div>
        <div className="text-muted-foreground text-sm lg:text-right">
          <p>Создана: {formatDate(application.created_at)}</p>
          {application.reviewed_at ? <p>Решение: {formatDate(application.reviewed_at)}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Мотивация</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {application.motivation || "Не указана"}
            </p>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="bg-muted/40 rounded-2xl p-3">
              <p className="text-muted-foreground">Город</p>
              <p className="mt-1 font-medium">{application.city_id ?? "Не выбран"}</p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-3">
              <p className="text-muted-foreground">Событие</p>
              <p className="mt-1 font-medium">{application.event_id ?? "Не выбрано"}</p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-3">
              <p className="text-muted-foreground">Тема</p>
              <p className="mt-1 font-medium">{application.selected_topic ?? "Не указана"}</p>
            </div>
          </div>
        </div>

        <form action={updateApplicationStatus} className="bg-muted/30 rounded-3xl border p-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="text-sm font-semibold" htmlFor={`status-${application.id}`}>
            Изменить статус
          </label>
          <select
            id={`status-${application.id}`}
            name="status"
            defaultValue={application.status}
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
          >
            {applicationModerationStatuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold" htmlFor={`reason-${application.id}`}>
            Причина решения
          </label>
          <textarea
            id={`reason-${application.id}`}
            name="decisionReason"
            rows={3}
            placeholder="Например: подходит под первую волну"
            className="border-input bg-background placeholder:text-muted-foreground mt-2 w-full rounded-md border px-3 py-2 text-sm"
          />

          <Button type="submit" className="mt-4 w-full">
            Сохранить решение
          </Button>
        </form>
      </div>
    </article>
  );
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const statusFilter = getStatusFilter(params.status);

  let applications: ModerationApplication[] = [];
  let accessDenied = false;

  try {
    applications = await listApplicationsForModeration({
      limit: 50,
      status: statusFilter,
    });
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
      <div className="relative overflow-hidden rounded-[2rem] border border-stone-900/10 bg-[#f5efe3] p-8 text-stone-950 shadow-sm dark:border-white/10 dark:bg-stone-950 dark:text-stone-50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-stone-900 to-emerald-600" />
        <p className="font-mono text-xs tracking-[0.25em] text-stone-600 uppercase dark:text-stone-400">
          community intake
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Заявки в сообщество</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700 dark:text-stone-300">
              Рабочая очередь для кураторов: просмотр деталей, фильтр по статусу и audited
              transition через backend action.
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 text-sm shadow-sm dark:bg-white/10">
            <p className="text-muted-foreground">Всего в текущем фильтре</p>
            <p className="mt-1 text-3xl font-semibold">{applications.length}</p>
          </div>
        </div>
      </div>

      <form
        className="border-border bg-card flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-end"
        action={ROUTES.adminApplications}
      >
        <label className="flex-1 text-sm font-semibold">
          Статус
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Все статусы</option>
            {applicationModerationStatuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="submit">Применить</Button>
          <Button variant="outline" asChild>
            <Link href={{ pathname: ROUTES.adminApplications }}>Сбросить</Link>
          </Button>
        </div>
      </form>

      {applications.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className="space-y-5">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </section>
  );
}
