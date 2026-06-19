import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { adminSectionDetails, deleteArchivedBrainProjects } from "@/features/admin";
import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "API | Админка",
};

const deleteResultSearchSchema = z.object({
  deleted: z.coerce.number().int().min(0).optional(),
  failed: z.coerce.number().int().min(0).optional(),
  status: z.enum(["ok", "partial", "error"]).optional(),
  details: z.string().optional(),
});

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function deleteArchivedProjectsAction(formData: FormData): Promise<never> {
  "use server";

  const refs = String(formData.get("refs") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const result = await deleteArchivedBrainProjects({ refs, confirmation });
  const params = new URLSearchParams({
    deleted: String(result.deletedCount),
    failed: String(result.failedCount),
    status: result.ok ? "ok" : result.deletedCount > 0 ? "partial" : "error",
    details: result.items
      .map((item) => `${item.projectRef || item.ref} — ${item.message}`)
      .join("\n"),
  });

  redirect(`/admin/api?${params.toString()}`);
}

export default async function AdminApiPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const parsed = deleteResultSearchSchema.safeParse((await searchParams) ?? {});
  const result = parsed.success ? parsed.data : null;

  return (
    <div className="space-y-8">
      <AdminSectionPage {...adminSectionDetails.api} />

      <section className="border-border bg-card rounded-3xl border p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">
              Удаление архивных Brain projects
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Вставь URL или slug архивных проектов по одному в строке. Запрос будет отправлен
              только если задан реальный `BRAIN_PROJECT_DELETE_ENDPOINT_TEMPLATE`; без него форма
              вернёт blocked-result и ничего не удалит.
            </p>
          </div>
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-200">
            irreversible
          </span>
        </div>

        {result ? (
          <div className="bg-muted/30 mt-5 rounded-2xl border p-4">
            <p className="text-sm font-semibold">
              Результат: удалено {result.deleted ?? 0}, ошибок {result.failed ?? 0}
            </p>
            {result.details ? (
              <pre className="text-muted-foreground mt-3 overflow-auto text-sm leading-6 whitespace-pre-wrap">
                {result.details}
              </pre>
            ) : null}
          </div>
        ) : null}

        <form action={deleteArchivedProjectsAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="refs">
              URLs или slugs
            </label>
            <textarea
              id="refs"
              name="refs"
              rows={8}
              placeholder={
                "https://os.elaurion.com/projects/qa-smoke-2026-05-28t20-07-38\nqa-prod-wide-2026-05-29t06-30-09-272z"
              }
              className="border-border bg-background mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold" htmlFor="confirmation">
              Подтверждение
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="text"
              placeholder="DELETE"
              className="border-border bg-background mt-2 w-full max-w-xs rounded-2xl border px-4 py-3 text-sm outline-none"
              required
            />
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              Введи `DELETE`, чтобы подтвердить необратимый запрос удаления через настроенный
              backend endpoint.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="destructive">
              Удалить из архива
            </Button>
            <Button variant="outline" asChild>
              <Link href={{ pathname: "/admin" }}>Вернуться в пульт</Link>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
