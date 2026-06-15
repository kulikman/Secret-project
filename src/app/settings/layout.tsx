import { requireUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

// Auth-gated route group — must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs className="mb-6" />
      {children}
    </div>
  );
}
