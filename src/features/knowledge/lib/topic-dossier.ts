import { z } from "zod";

import { sourceRefSchema, type SourceRef } from "@/lib/source-refs";
import type { Json } from "@/types/database";
import type { PublicNodeProjection } from "../api/public-queries";

export interface TopicDossierTextItem {
  body: string;
  title: string | null;
}

export interface TopicDossierTimelineItem {
  body: string | null;
  date: string | null;
  title: string;
}

export interface TopicDossierEntity {
  id: string | null;
  kind: string | null;
  title: string;
}

export interface TopicDossierSourceRef extends SourceRef {
  date?: string;
  kind?: string;
  reliability?: string;
  supports?: string;
}

export interface TopicDossier {
  counterarguments: TopicDossierTextItem[];
  description: string | null;
  events: TopicDossierEntity[];
  facts: TopicDossierTextItem[];
  organizations: TopicDossierEntity[];
  people: TopicDossierEntity[];
  relatedTopics: TopicDossierEntity[];
  sourceRefs: TopicDossierSourceRef[];
  timeline: TopicDossierTimelineItem[];
  unresolvedRefs: TopicDossierEntity[];
  versions: TopicDossierTextItem[];
}

const entityRefSchema = z
  .object({
    id: z.string().min(1).optional(),
    kind: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
  })
  .catchall(z.unknown());

const textItemSchema = z
  .object({
    body: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    statement: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
  })
  .catchall(z.unknown());

const timelineItemSchema = z
  .object({
    body: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    year: z.union([z.string().min(1), z.number()]).optional(),
  })
  .catchall(z.unknown());

const enrichedSourceRefSchema = sourceRefSchema.extend({
  date: z.string().min(1).optional(),
  kind: z.string().min(1).optional(),
  reliability: z.string().min(1).optional(),
  supports: z.string().min(1).optional(),
});

function getRecord(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getStringFromKeys(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) return value;
  }

  return null;
}

function getFirstText(content: Record<string, Json>, keys: string[]): string | null {
  for (const key of keys) {
    const value = getString(content[key]);
    if (value) return value;
  }

  return null;
}

function getArray(content: Record<string, Json>, keys: string[]): Json[] {
  for (const key of keys) {
    const value = content[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function toTextItem(value: Json): TopicDossierTextItem | null {
  const text = getString(value);
  if (text) return { body: text, title: null };

  const parsed = textItemSchema.safeParse(value);
  if (!parsed.success) return null;

  const body =
    getStringFromKeys(parsed.data, ["body", "content", "description", "statement", "text"]) ??
    parsed.data.title ??
    null;
  if (!body) return null;

  return {
    body,
    title: parsed.data.title ?? null,
  };
}

function getTextItems(content: Record<string, Json>, keys: string[]): TopicDossierTextItem[] {
  return getArray(content, keys).flatMap((item) => {
    const textItem = toTextItem(item);
    return textItem ? [textItem] : [];
  });
}

function toEntity(value: Json, fallbackKind: string | null = null): TopicDossierEntity | null {
  const text = getString(value);
  if (text) return { id: null, kind: fallbackKind, title: text };

  const parsed = entityRefSchema.safeParse(value);
  if (!parsed.success) return null;

  const title = parsed.data.title ?? parsed.data.label ?? parsed.data.nodeId ?? parsed.data.id;
  if (!title) return null;

  return {
    id: parsed.data.nodeId ?? parsed.data.id ?? null,
    kind: parsed.data.kind ?? parsed.data.type ?? fallbackKind,
    title,
  };
}

function getEntities(
  content: Record<string, Json>,
  keys: string[],
  fallbackKind: string | null
): TopicDossierEntity[] {
  return getArray(content, keys).flatMap((item) => {
    const entity = toEntity(item, fallbackKind);
    return entity ? [entity] : [];
  });
}

function getTimelineItems(content: Record<string, Json>): TopicDossierTimelineItem[] {
  return getArray(content, ["timeline", "chronology", "history"]).flatMap((item) => {
    const text = getString(item);
    if (text) return [{ body: null, date: null, title: text }];

    const parsed = timelineItemSchema.safeParse(item);
    if (!parsed.success) return [];

    const date = parsed.data.date ?? (parsed.data.year ? String(parsed.data.year) : null);
    const title = parsed.data.title ?? parsed.data.label ?? parsed.data.text ?? parsed.data.body;
    if (!title) return [];

    return [
      {
        body: parsed.data.description ?? parsed.data.body ?? null,
        date,
        title,
      },
    ];
  });
}

function getSourceRefs(sourceRefs: Json): TopicDossierSourceRef[] {
  if (!Array.isArray(sourceRefs)) return [];

  return sourceRefs
    .map((item) => enrichedSourceRefSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export function createTopicDossier(topic: PublicNodeProjection): TopicDossier {
  const content = getRecord(topic.content);
  const relatedRefs = getEntities(content, ["related_node_refs"], null);

  return {
    counterarguments: getTextItems(content, [
      "counterarguments",
      "counter_arguments",
      "weak_points",
      "open_questions",
    ]),
    description: getFirstText(content, ["description", "body", "overview"]),
    events: getEntities(content, ["events"], "event"),
    facts: getTextItems(content, ["facts", "known_facts", "claims"]),
    organizations: getEntities(content, ["organizations", "orgs"], "organization"),
    people: getEntities(content, ["people", "persons"], "person"),
    relatedTopics: [
      ...getEntities(content, ["related_topics", "topics"], "topic"),
      ...relatedRefs.filter((ref) => ref.kind === "topic"),
    ],
    sourceRefs: getSourceRefs(topic.source_refs),
    timeline: getTimelineItems(content),
    unresolvedRefs: relatedRefs.filter((ref) => ref.kind !== "topic"),
    versions: getTextItems(content, ["versions", "interpretations", "hypotheses"]),
  };
}
