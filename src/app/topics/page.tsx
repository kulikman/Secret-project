import Link from "next/link";
import type { Metadata } from "next";

import { listPublishedTopics } from "@/features/knowledge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Архив тем",
  description: "Опубликованные темы Тайного Бюро из App DB projection.",
};

async function loadTopics() {
  try {
    return await listPublishedTopics({ limit: 24 });
  } catch {
    return null;
  }
}

export default async function TopicsPage(): Promise<React.ReactElement> {
  const result = await loadTopics();
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
            <h2 className="text-xl font-semibold">Пока нет опубликованных тем</h2>
            <p className="text-muted-foreground mt-2 leading-7">
              Опубликуйте первую тему через manual republish, когда Brain project/token и projection
              flow будут готовы.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
