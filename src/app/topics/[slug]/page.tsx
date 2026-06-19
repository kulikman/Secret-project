import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createTopicDossier,
  getPublishedMapNeighbors,
  getPublishedTopicBySlug,
  TopicDossierView,
} from "@/features/knowledge";

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
      description: topic.summary ?? "Опубликованное досье Тайного Бюро.",
    };
  } catch {
    return { title: "Досье темы" };
  }
}

export default async function TopicPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const topic = await getPublishedTopicBySlug(slug);

  if (!topic) notFound();

  const [dossier, neighbors] = await Promise.all([
    Promise.resolve(createTopicDossier(topic)),
    getPublishedMapNeighbors({ id: topic.brain_node_id, limit: 24 }).catch(() => null),
  ]);

  return <TopicDossierView dossier={dossier} neighbors={neighbors} slug={slug} topic={topic} />;
}
