import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export default function Home(): React.ReactElement {
  return (
    <section className="relative isolate flex flex-1 overflow-hidden bg-[#f5efe3] px-6 py-16 text-stone-950 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(146,64,14,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(15,23,42,0.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.85),rgba(214,197,166,0.72))]" />
      <div className="absolute top-12 right-10 -z-10 h-56 w-56 rounded-full border border-stone-900/10" />
      <div className="absolute bottom-10 left-8 -z-10 h-40 w-72 rotate-[-8deg] rounded-[3rem] bg-stone-950/5" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="mb-5 w-fit rounded-full border border-stone-900/15 bg-white/45 px-4 py-2 font-mono text-xs tracking-[0.28em] text-stone-700 uppercase">
            {siteConfig.name}
          </p>
          <h1 className="text-5xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-7xl">
            Архив, где связи не тонут в шуме.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
            Публичные темы, источники и claims публикуются из проверенной projection-модели, а Brain
            остается закрытым knowledge backend для редакторов.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/topics">Открыть архив</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Войти в кабинет</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-900/10 bg-white/55 p-5 shadow-2xl shadow-stone-900/10 backdrop-blur">
          <div className="rounded-[1.45rem] border border-stone-900/10 bg-stone-950 p-5 text-stone-100">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-mono text-xs tracking-[0.22em] text-amber-200 uppercase">
                projection
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">
                public-safe
              </span>
            </div>
            <div className="space-y-4">
              {[
                ["topic", "Гиперборея", "published"],
                ["source", "Архивный документ", "verified"],
                ["claim", "Связь подтверждена", "source_refs: 3"],
              ].map(([kind, title, status]) => (
                <div
                  key={`${kind}-${title}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs text-amber-200">{kind}</span>
                    <span className="text-xs text-stone-400">{status}</span>
                  </div>
                  <p className="mt-3 text-lg font-medium">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
