import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getPublishedSourceById } from "@/features/knowledge";
import { sourceRefSchema } from "@/lib/source-refs";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function getContentRecord(content: Json): Record<string, Json> {
  return content && typeof content === "object" && !Array.isArray(content)
    ? (content as Record<string, Json>)
    : {};
}

function getContentText(content: Json, key: string): string | null {
  const value = getContentRecord(content)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getParsedSourceRefs(sourceRefs: Json) {
  if (!Array.isArray(sourceRefs)) return [];

  return sourceRefs
    .map((item) => sourceRefSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
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

  const description =
    getContentText(source.content, "description") ?? getContentText(source.content, "summary");
  const sourceRefs = getParsedSourceRefs(source.source_refs);

  return (
    <article className="bg-background flex flex-1 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Breadcrumbs
          className="mb-6"
          resolveLabel={(segment) => (segment === id ? source.title : null)}
        />
        <p className="text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase">
          source projection
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{source.title}</h1>
        {source.summary && (
          <p className="text-muted-foreground mt-6 text-xl leading-9">{source.summary}</p>
        )}

        <div className="mt-10 grid gap-6">
          {description ? (
            <section className="border-border rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Описание источника</h2>
              <p className="text-muted-foreground mt-3 leading-7">{description}</p>
            </section>
          ) : null}

          {sourceRefs.length > 0 ? (
            <section className="border-border rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Связанные источники</h2>
              <ul className="mt-4 space-y-3">
                {sourceRefs.map((sourceRef) => (
                  <li key={`${sourceRef.nodeId}:${sourceRef.title ?? sourceRef.url ?? "source"}`}>
                    <Link
                      href={`/sources/${sourceRef.nodeId}`}
                      className="text-foreground hover:text-foreground/80 font-medium transition-colors"
                    >
                      {sourceRef.title ?? sourceRef.nodeId}
                    </Link>
                    {sourceRef.url ? (
                      <p className="text-muted-foreground mt-1 text-sm break-all">
                        {sourceRef.url}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <details className="border-border rounded-2xl border p-6">
            <summary className="cursor-pointer text-lg font-semibold">
              Технический снимок source refs
            </summary>
            <pre className="bg-muted text-muted-foreground mt-4 overflow-auto rounded-xl p-4 text-sm">
              {JSON.stringify(source.source_refs, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </article>
  );
}
