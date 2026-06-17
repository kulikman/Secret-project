import type { Metadata } from "next";

import { adminRoleMatrix, adminSectionDetails } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "Настройки | Админка",
};

export default function AdminSettingsPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <AdminSectionPage {...adminSectionDetails.settings} />
      <section className="border-border bg-card rounded-3xl border p-6">
        <h2 className="text-xl font-semibold tracking-tight">Ролевая модель</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Это проектная матрица. Реальные права нужно закрепить миграцией, RLS и тестами.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {adminRoleMatrix.map((role) => (
            <article key={role.role} className="bg-muted/30 rounded-2xl border p-5">
              <h3 className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
                {role.role}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{role.scope}</p>
              <ul className="mt-4 space-y-2">
                {role.canDo.map((permission) => (
                  <li key={permission} className="text-sm leading-6">
                    {permission}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
