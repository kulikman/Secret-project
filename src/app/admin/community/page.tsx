import type { Metadata } from "next";

import { adminSectionDetails, communityCabinetScope } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "Сообщество | Админка",
};

export default function AdminCommunityPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <AdminSectionPage {...adminSectionDetails.community} />
      <section className="border-border bg-card rounded-3xl border p-6">
        <h2 className="text-xl font-semibold tracking-tight">
          Что должно быть в кабинете участника
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {communityCabinetScope.map((item) => (
            <article key={item.title} className="bg-muted/30 rounded-2xl border p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
