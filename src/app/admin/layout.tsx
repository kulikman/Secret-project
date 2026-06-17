import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { adminNavItems } from "@/features/admin";
import { AdminAccessDeniedError, requireAdminRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Админка",
  description: "Операционный пульт Тайного Бюро.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  try {
    await requireAdminRole();
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="bg-background flex flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="border-border bg-card rounded-3xl border p-4 shadow-sm">
            <div className="mb-4 px-2">
              <p className="font-mono text-xs tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
                admin console
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Тайное Бюро</h2>
              <p className="text-muted-foreground mt-2 text-xs leading-5">
                Shell закрыт RBAC: мутации только через будущие audited actions.
              </p>
            </div>
            <nav className="space-y-1" aria-label="Admin navigation">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={{ pathname: item.href }}
                  className="hover:bg-muted/70 block rounded-2xl px-3 py-3 transition-colors"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {item.description}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Breadcrumbs className="mb-6" />
          {children}
        </main>
      </div>
    </div>
  );
}
