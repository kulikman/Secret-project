import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedTopicBySlug } from "@/features/knowledge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const topic = await getPublishedTopicBySlug(slug);
    if (!topic) return { title: "Тема не найдена" };

    return {
      title: topic.title,
      description: topic.summary ?? "Опубликованная тема Тайного Бюро.",
    };
  } catch {
    return { title: "Тема архива" };
  }
}

export default async function TopicPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const topic = await getPublishedTopicBySlug(slug);

  if (!topic) notFound();

  return (
    <article className="bg-background flex flex-1 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase">
          topic projection
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{topic.title}</h1>
        {topic.summary && (
          <p className="text-muted-foreground mt-6 text-xl leading-9">{topic.summary}</p>
        )}
        <div className="border-border mt-10 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Опубликованный снимок</h2>
          <pre className="bg-muted text-muted-foreground mt-4 overflow-auto rounded-xl p-4 text-sm">
            {JSON.stringify(topic.content, null, 2)}
          </pre>
        </div>
      </div>
    </article>
  );
}
