import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AwakeningMapAtlas } from "@/features/awakening-map";
import { listPublishedMapGraph } from "@/features/knowledge";
import type { PublishedMapGraph } from "@/features/knowledge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Карта пробуждения",
  description:
    "Интерактивная карта связей Тайного Бюро на основе опубликованной projection-модели.",
};

const emptyGraph: PublishedMapGraph = {
  edges: [],
  nodes: [],
};

async function loadInitialGraph(): Promise<PublishedMapGraph> {
  try {
    return await listPublishedMapGraph({ limit: 120 });
  } catch {
    return emptyGraph;
  }
}

export default async function AwakeningMapPage(): Promise<React.ReactElement> {
  const graph = await loadInitialGraph();

  return (
    <main className="bg-[#f5efe3] px-4 py-8 text-stone-950 sm:px-6 lg:px-8 dark:bg-stone-950">
      <div className="mx-auto w-full max-w-7xl">
        <Breadcrumbs className="mb-6 text-stone-600 dark:text-stone-400" />
        <AwakeningMapAtlas initialGraph={graph} />
      </div>
    </main>
  );
}
