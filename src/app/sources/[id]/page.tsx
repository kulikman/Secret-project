import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedSourceById } from "@/features/knowledge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const source = await getPublishedSourceById(id);
    if (!source) return { title: "Источник не найден" };

    return {
      title: source.title,
      description: source.summary ?? "Опубликованный источник Тайного Бюро.",
    };
  } catch {
    return { title: "Источник архива" };
  }
}

export default async function SourcePage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const source = await getPublishedSourceById(id);

  if (!source) notFound();

  return (
    <article className="bg-background flex flex-1 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase">
          source projection
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{source.title}</h1>
        {source.summary && (
          <p className="text-muted-foreground mt-6 text-xl leading-9">{source.summary}</p>
        )}
        <div className="border-border mt-10 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Source refs</h2>
          <pre className="bg-muted text-muted-foreground mt-4 overflow-auto rounded-xl p-4 text-sm">
            {JSON.stringify(source.source_refs, null, 2)}
          </pre>
        </div>
      </div>
    </article>
  );
}
