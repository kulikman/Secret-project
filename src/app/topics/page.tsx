import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";

import { listPublishedTopics } from "@/features/knowledge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Архив тем",
  description: "Опубликованные темы Тайного Бюро из App DB projection.",
};

interface PageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

async function loadTopics(query?: string) {
  try {
    return await listPublishedTopics({ limit: 24, q: query });
  } catch {
    return null;
  }
}

export default async function TopicsPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const result = await loadTopics(query);
  const topics = result?.items ?? [];

  return (
    <section className="bg-background flex flex-1 px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase">
            public projection
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Архив тем</h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Эти страницы читают опубликованную App DB projection и не вызывают live Brain.
          </p>
        </div>

        <form action="/topics" className="mb-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Поиск по названию, summary или slug"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-2xl border py-3 pr-4 pl-11 text-sm outline-none focus-visible:ring-3"
            />
          </label>
          <button
            type="submit"
            className="bg-foreground text-background rounded-2xl px-5 py-3 text-sm font-medium"
          >
            Найти
          </button>
          {query ? (
            <Link
              href="/topics"
              className="border-border hover:bg-muted rounded-2xl border px-5 py-3 text-sm transition-colors"
            >
              Сбросить
            </Link>
          ) : null}
        </form>

        {query ? (
          <p className="text-muted-foreground mb-6 text-sm">
            Найдено: <span className="text-foreground font-medium">{topics.length}</span> по запросу{" "}
            <span className="text-foreground font-medium">&ldquo;{query}&rdquo;</span>
          </p>
        ) : null}

        {topics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="border-border bg-card text-card-foreground hover:border-foreground/30 rounded-2xl border p-6 transition-colors"
              >
                <div className="text-muted-foreground mb-4 flex items-center justify-between font-mono text-xs">
                  <span>{topic.node_type}</span>
                  <span>
                    {topic.published_at
                      ? new Date(topic.published_at).toLocaleDateString("ru-RU")
                      : "draft date"}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">{topic.title}</h2>
                {topic.summary && (
                  <p className="text-muted-foreground mt-3 line-clamp-3 leading-7">
                    {topic.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/30 rounded-2xl border p-8">
            <h2 className="text-xl font-semibold">
              {query ? "По запросу ничего не найдено" : "Пока нет опубликованных тем"}
            </h2>
            <p className="text-muted-foreground mt-2 leading-7">
              {query
                ? "Попробуйте изменить формулировку запроса или очистить фильтр."
                : "Опубликуйте первую тему через manual republish, когда Brain project/token и projection flow будут готовы."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
