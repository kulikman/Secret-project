import Link from "next/link";

import { adminForgottenChecklist, adminOverviewMetrics, adminWorkstreams } from "@/features/admin";
import { AdminStatusPill } from "./_components/admin-section-page";

const METRIC_TONE_CLASS = {
  amber: "border-amber-500/20 bg-amber-500/10",
  emerald: "border-emerald-500/20 bg-emerald-500/10",
  rose: "border-rose-500/20 bg-rose-500/10",
  stone: "border-stone-500/20 bg-stone-500/10",
} as const;

export default function AdminPage(): React.ReactElement {
  return (
    <section className="space-y-8">
      <div className="relative isolate overflow-hidden rounded-[2.25rem] bg-stone-950 p-8 text-stone-50 shadow-2xl shadow-stone-950/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.25),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.12),transparent_26%)]" />
        <p className="font-mono text-xs tracking-[0.3em] text-amber-200 uppercase">
          operational control room
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Админка Тайного Бюро: заявки, карта пробуждения, PDF-презентации, API и кабинет участника.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-300">
          Это безопасный слой: карта функций и RBAC-защищенные страницы без рискованных
          админ-мутций. CRUD, генерация и секреты подключаются через отдельные audited actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminOverviewMetrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-3xl border p-5 ${METRIC_TONE_CLASS[metric.tone]}`}
          >
            <p className="text-muted-foreground text-sm">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{metric.value}</p>
            <p className="text-muted-foreground mt-3 text-sm leading-6">{metric.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {adminWorkstreams.map((stream) => (
          <Link
            key={stream.href}
            href={{ pathname: stream.href }}
            className="border-border bg-card hover:border-foreground/30 rounded-3xl border p-6 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{stream.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{stream.summary}</p>
              </div>
              <AdminStatusPill status={stream.status} />
            </div>
            <ul className="mt-5 space-y-2">
              {stream.bullets.map((bullet) => (
                <li key={bullet} className="text-muted-foreground flex gap-3 text-sm leading-6">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      <section className="border-border bg-muted/30 rounded-3xl border p-6">
        <h2 className="text-xl font-semibold tracking-tight">Что обычно забывают</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Эти пункты лучше держать в scope сразу, иначе админка быстро станет хрупкой.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {adminForgottenChecklist.map((item) => (
            <div key={item} className="bg-background rounded-2xl border border-stone-900/10 p-4">
              <p className="text-sm leading-6">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
