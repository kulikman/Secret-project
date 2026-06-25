import { z } from "zod";

import type { AwakeningAtlasGraph, AwakeningAtlasNode } from "./atlas-layout";

export const awakeningMapThemeGroupIds = [
  "metaphysics",
  "spiritual-practice",
  "psychedelics",
  "galactic-federations",
  "ancient-civilizations",
  "secret-space-program",
  "hidden-infrastructure",
  "earth-conspiracy",
  "suppressed-science",
] as const;

export const awakeningMapThemeGroupIdSchema = z.enum(awakeningMapThemeGroupIds);

export const awakeningReferenceBoundsSchema = z.object({
  height: z.number().positive().max(1),
  width: z.number().positive().max(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const awakeningReferenceMatcherSchema = z.object({
  slugExact: z.array(z.string().trim().min(1)).default([]),
  titleIncludes: z.array(z.string().trim().min(1)).default([]),
});

export const awakeningReferenceClusterSchema = z.object({
  bounds: awakeningReferenceBoundsSchema,
  groupId: awakeningMapThemeGroupIdSchema,
  id: z.string().trim().min(1),
  keyTopics: z.array(z.string().trim().min(1)).min(2).max(6),
  keywords: z.array(z.string().trim().min(1)).min(1),
  label: z.string().trim().min(1),
  matcher: awakeningReferenceMatcherSchema,
  relatedClusterIds: z.array(z.string().trim().min(1)).max(5).default([]),
  summary: z.string().trim().min(1).max(320),
});

export type AwakeningMapThemeGroupId = z.infer<typeof awakeningMapThemeGroupIdSchema>;
export type AwakeningReferenceBounds = z.infer<typeof awakeningReferenceBoundsSchema>;
export type AwakeningReferenceCluster = z.infer<typeof awakeningReferenceClusterSchema>;

export interface AwakeningMapThemeGroup {
  description: string;
  id: AwakeningMapThemeGroupId;
  label: string;
}

export interface AwakeningReferenceClusterMatch {
  cluster: AwakeningReferenceCluster;
  matchedNodeIds: string[];
}

export const awakeningMapThemeGroups: readonly AwakeningMapThemeGroup[] = [
  {
    description: "Высокоуровневая космология, смысловые оси и язык пробуждения.",
    id: "metaphysics",
    label: "Metaphysics & Awakening",
  },
  {
    description: "Практики внутренней трансформации, медитации и вознесения.",
    id: "spiritual-practice",
    label: "Spiritual Practice & Ascension",
  },
  {
    description: "Психоделики и altered states как путь к многомерному опыту.",
    id: "psychedelics",
    label: "Psychedelics & Altered States",
  },
  {
    description: "Космические расы, федерации и channeling-нарративы.",
    id: "galactic-federations",
    label: "Galactic Races & Federations",
  },
  {
    description: "Древние цивилизации, альтернативная археология и lost history.",
    id: "ancient-civilizations",
    label: "Ancient Civilizations & Archaeology",
  },
  {
    description: "Тайные космические программы, breakaway-технологии и disclosure.",
    id: "secret-space-program",
    label: "Secret Space Program & Breakaway Tech",
  },
  {
    description: "Луна, Марс, Антарктида, подземные базы и скрытая инфраструктура.",
    id: "hidden-infrastructure",
    label: "Planets, Bases & Hidden Infrastructure",
  },
  {
    description: "Политическая конспирология, deep state и земной конфликт.",
    id: "earth-conspiracy",
    label: "Earth Conspiracy & Political War",
  },
  {
    description: "Псевдонаука, healing-практики и suppressed science.",
    id: "suppressed-science",
    label: "Suppressed Science & Healing",
  },
] as const;

export const awakeningReferenceClusters: readonly AwakeningReferenceCluster[] = [
  {
    bounds: { height: 0.18, width: 0.26, x: 0.34, y: 0.31 },
    groupId: "metaphysics",
    id: "great-awakening-core",
    keyTopics: ["Great Awakening", "Everything is an illusion", "Optimal Timeline Reality"],
    keywords: ["great awakening", "everything is an illusion", "optimal timeline"],
    label: "Great Awakening Core",
    matcher: {
      slugExact: ["great-awakening", "optimal-timeline-reality"],
      titleIncludes: ["great awakening", "optimal timeline", "everything is an illusion"],
    },
    relatedClusterIds: ["solar-flash", "secret-space-program", "qanon-earth-alliance"],
    summary:
      "Центральный нарратив карты: пробуждение, иллюзорность реальности и выбор оптимальной временной линии.",
  },
  {
    bounds: { height: 0.2, width: 0.25, x: 0.03, y: 0.04 },
    groupId: "suppressed-science",
    id: "ai-signal",
    keyTopics: ["Ancient A.I.", "Electric Sun", "Reptilian infection", "Solar purge"],
    keywords: ["ai", "artificial intelligence", "reptilians", "electric sun", "the sun"],
    label: "Artificial Intelligence Signal",
    matcher: {
      slugExact: ["artificial-intelligence", "electric-sun"],
      titleIncludes: ["artificial intelligence", "electric sun", "the sun", "reptilian"],
    },
    relatedClusterIds: ["solar-flash", "dark-fleet-saturn", "healing-energy"],
    summary:
      "Древний A.I.-сигнал, рептилоиды и солнце собраны в одну техно-эсхатологическую угрозу.",
  },
  {
    bounds: { height: 0.22, width: 0.27, x: 0.23, y: 0.11 },
    groupId: "metaphysics",
    id: "solar-flash",
    keyTopics: ["Great Solar Flash", "Consciousness Renaissance", "Collective Consciousness"],
    keywords: ["great solar flash", "consciousness renaissance", "collective consciousness"],
    label: "Great Solar Flash",
    matcher: {
      slugExact: ["great-solar-flash", "collective-consciousness"],
      titleIncludes: ["great solar flash", "solar flash", "collective consciousness"],
    },
    relatedClusterIds: ["rainbow-body", "galactic-federation", "secret-space-program"],
    summary:
      "Центральная ось карты: солнечное событие должно запустить очищение, disclosure и сдвиг сознания.",
  },
  {
    bounds: { height: 0.22, width: 0.24, x: 0.54, y: 0.09 },
    groupId: "spiritual-practice",
    id: "rainbow-body",
    keyTopics: ["Rainbow Body", "Dzogchen", "Bardo", "Rigpa"],
    keywords: ["rainbow body", "dzogchen", "bardo", "meditation", "rigpa"],
    label: "Rainbow Body & Meditation",
    matcher: {
      slugExact: ["rainbow-body", "meditation"],
      titleIncludes: ["rainbow body", "dzogchen", "bardo", "meditation", "rigpa"],
    },
    relatedClusterIds: ["solar-flash", "psychedelic-renaissance", "lightworkers-ascension"],
    summary:
      "Буддийско-эзотерический блок про медитацию, ригпа, бардо и освобождение от цикла перерождений.",
  },
  {
    bounds: { height: 0.15, width: 0.18, x: 0.78, y: 0.04 },
    groupId: "spiritual-practice",
    id: "return-to-source",
    keyTopics: ["Return to Source", "Oneness", "Bardo", "Meditation Rigpa"],
    keywords: ["return to source", "oneness", "bardo", "rigpa"],
    label: "Return to Source",
    matcher: {
      slugExact: ["return-to-source", "oneness"],
      titleIncludes: ["return to source", "oneness", "bardo", "rigpa"],
    },
    relatedClusterIds: ["rainbow-body", "solar-flash", "lightworkers-ascension"],
    summary:
      "Верхний правый блок описывает возвращение к Source, oneness и практики освобождения через медитацию.",
  },
  {
    bounds: { height: 0.18, width: 0.24, x: 0.54, y: 0.26 },
    groupId: "psychedelics",
    id: "psychedelic-renaissance",
    keyTopics: ["DMT", "Psilocybin", "Hyperspace", "Terence McKenna"],
    keywords: ["dmt", "psilocybin", "psychedelic renaissance", "hyperspace", "mckenna"],
    label: "Psychedelic Renaissance",
    matcher: {
      slugExact: ["psychedelic-renaissance", "dmt"],
      titleIncludes: ["psychedelic", "psilocybin", "dmt", "hyperspace", "terence mckenna"],
    },
    relatedClusterIds: ["rainbow-body", "entheogens", "lightworkers-ascension"],
    summary:
      "Психоделики показаны как интерфейс к многомерной реальности и ускоритель пробуждения.",
  },
  {
    bounds: { height: 0.24, width: 0.31, x: 0.28, y: 0.3 },
    groupId: "secret-space-program",
    id: "secret-space-program",
    keyTopics: ["Solar Warden", "USAP", "MILAB", "SSP Whistleblowers"],
    keywords: ["ssp", "secret space program", "solar warden", "milab", "usap"],
    label: "Secret Space Program",
    matcher: {
      slugExact: ["secret-space-program", "solar-warden"],
      titleIncludes: ["secret space program", "solar warden", "milab", "usap", "whistleblower"],
    },
    relatedClusterIds: ["dark-fleet-saturn", "moon-mars-venus", "solar-flash"],
    summary:
      "Крупнейший техно-конспирологический кластер: тайные космические программы, технологии и информаторы.",
  },
  {
    bounds: { height: 0.18, width: 0.25, x: 0.45, y: 0.46 },
    groupId: "galactic-federations",
    id: "super-federation",
    keyTopics: ["Super Federation", "RA: Law of One", "The Galactic Federation", "Free Will"],
    keywords: ["super federation", "galactic federation", "law of one", "free will"],
    label: "Super Federation & Free Will",
    matcher: {
      slugExact: ["super-federation", "free-will"],
      titleIncludes: ["super federation", "galactic federation", "law of one", "free will"],
    },
    relatedClusterIds: ["galactic-federation", "ancient-builder-race", "great-awakening-core"],
    summary:
      "Центрально-правый сектор про Super Federation, Law of One и идею свободной воли как космического закона.",
  },
  {
    bounds: { height: 0.19, width: 0.28, x: 0.03, y: 0.24 },
    groupId: "hidden-infrastructure",
    id: "dark-fleet-saturn",
    keyTopics: ["Saturn", "Dark Fleet", "Draco alliance", "Off-planet slave trade"],
    keywords: ["saturn", "dark fleet", "draco", "orion syndicate", "slave trade"],
    label: "Saturn, Draco & Dark Fleet",
    matcher: {
      slugExact: ["saturn", "dark-fleet"],
      titleIncludes: ["saturn", "dark fleet", "draco", "orion syndicate", "slave trade"],
    },
    relatedClusterIds: ["secret-space-program", "moon-mars-venus", "ai-signal"],
    summary:
      "Темная космическая иерархия вокруг Сатурна, Draco-альянса, Dark Fleet и внеземного рабства.",
  },
  {
    bounds: { height: 0.18, width: 0.26, x: 0.05, y: 0.54 },
    groupId: "earth-conspiracy",
    id: "qanon-earth-alliance",
    keyTopics: ["QAnon", "White Hats", "Tribunals", "Save the Children"],
    keywords: ["qanon", "earth alliance", "white hats", "tribunals", "save the children"],
    label: "QAnon & Earth Alliance",
    matcher: {
      slugExact: ["qanon", "earth-alliance"],
      titleIncludes: ["q anon", "qanon", "earth alliance", "white hats", "tribunals"],
    },
    relatedClusterIds: ["vatican-occult-control", "healing-energy", "secret-space-program"],
    summary: "Политическая ветка Great Awakening: QAnon, white hats, tribunals и борьба с cabal.",
  },
  {
    bounds: { height: 0.15, width: 0.25, x: 0.04, y: 0.78 },
    groupId: "earth-conspiracy",
    id: "cabal-deep-state",
    keyTopics: ["Cabal", "Deep State", "Illuminati", "Council of 200"],
    keywords: ["cabal", "deep state", "illuminati", "council of 200"],
    label: "Cabal, Deep State & Illuminati",
    matcher: {
      slugExact: ["cabal", "deep-state", "illuminati"],
      titleIncludes: ["cabal", "deep state", "illuminati", "council of 200"],
    },
    relatedClusterIds: ["qanon-earth-alliance", "vatican-occult-control", "secret-space-program"],
    summary:
      "Нижний политический слой карты: cabal, deep state, Illuminati и земные структуры скрытого управления.",
  },
  {
    bounds: { height: 0.15, width: 0.24, x: 0.16, y: 0.44 },
    groupId: "suppressed-science",
    id: "healing-energy",
    keyTopics: ["Tesla", "Rife", "Orgone", "Free Energy"],
    keywords: ["tesla", "rife", "orgone", "wireless energy", "holistic healing"],
    label: "Healing & Free Energy",
    matcher: {
      slugExact: ["nikola-tesla", "free-energy"],
      titleIncludes: ["tesla", "rife", "orgone", "free energy", "holistic healing"],
    },
    relatedClusterIds: ["qanon-earth-alliance", "ai-signal", "solar-flash"],
    summary:
      "Псевдонаучный healing-блок: free energy, Tesla-мифология, Rife, orgone и sound healing.",
  },
  {
    bounds: { height: 0.2, width: 0.31, x: 0.44, y: 0.37 },
    groupId: "galactic-federations",
    id: "galactic-federation",
    keyTopics: ["Law of One", "Blue Avians", "Sphere Being Alliance", "Channeling"],
    keywords: ["galactic federation", "law of one", "blue avians", "sphere beings"],
    label: "Galactic Federation & Law of One",
    matcher: {
      slugExact: ["law-of-one", "galactic-federation"],
      titleIncludes: ["galactic federation", "law of one", "blue avians", "sphere being"],
    },
    relatedClusterIds: ["solar-flash", "ancient-builder-race", "lightworkers-ascension"],
    summary:
      "Космическо-духовный блок про Law of One, Blue Avians, Sphere Being Alliance и channeling.",
  },
  {
    bounds: { height: 0.19, width: 0.3, x: 0.6, y: 0.41 },
    groupId: "hidden-infrastructure",
    id: "moon-mars-venus",
    keyTopics: ["Moon", "Mars", "Venus", "LOC", "Cydonia"],
    keywords: ["moon", "mars", "venus", "cydonia", "loc"],
    label: "Moon, Mars & Venus Infrastructure",
    matcher: {
      slugExact: ["moon", "mars", "venus", "cydonia"],
      titleIncludes: ["moon", "mars", "venus", "cydonia", "lunar operations command"],
    },
    relatedClusterIds: ["secret-space-program", "dark-fleet-saturn", "ancient-builder-race"],
    summary:
      "Луна, Марс и Венера показаны как обжитые и политически управляемые пространства с базами и руинами.",
  },
  {
    bounds: { height: 0.2, width: 0.29, x: 0.24, y: 0.59 },
    groupId: "ancient-civilizations",
    id: "ancient-aliens",
    keyTopics: ["Giza", "Gobekli Tepe", "Crop Circles", "Montauk"],
    keywords: ["ancient aliens", "giza", "gobekli tepe", "crop circles", "montauk"],
    label: "Ancient Aliens & Alternative Archaeology",
    matcher: {
      slugExact: ["ancient-aliens", "giza-complex", "gobekli-tepe"],
      titleIncludes: ["ancient aliens", "giza", "gobekli", "crop circles", "montauk"],
    },
    relatedClusterIds: ["ancient-builder-race", "antarctica-inner-earth", "qanon-earth-alliance"],
    summary:
      "Мегалиты, пирамиды, круги на полях и ancient aliens собраны как доказательная база lost history.",
  },
  {
    bounds: { height: 0.17, width: 0.28, x: 0.53, y: 0.59 },
    groupId: "spiritual-practice",
    id: "lightworkers-ascension",
    keyTopics: ["Lightworkers", "Starseeds", "Akashic Records", "Higher Mind"],
    keywords: ["lightworkers", "starseeds", "indigos", "higher mind", "akashic records"],
    label: "Lightworkers & Ascension",
    matcher: {
      slugExact: ["lightworkers", "akashic-records"],
      titleIncludes: ["lightworkers", "starseeds", "indigos", "higher mind", "akashic"],
    },
    relatedClusterIds: ["rainbow-body", "galactic-federation", "entheogens"],
    summary:
      "New Age-контур вокруг lightworkers, starseeds, higher mind, akashic records и ascension.",
  },
  {
    bounds: { height: 0.16, width: 0.25, x: 0.54, y: 0.74 },
    groupId: "earth-conspiracy",
    id: "vatican-occult-control",
    keyTopics: ["Vatican", "Jesuits", "Khazars", "Project Paperclip"],
    keywords: ["vatican", "jesuits", "khazars", "lucifer telescope", "project paperclip"],
    label: "Vatican & Occult Control",
    matcher: {
      slugExact: ["vatican", "project-paperclip"],
      titleIncludes: ["vatican", "jesuit", "khazar", "lucifer", "paperclip"],
    },
    relatedClusterIds: ["qanon-earth-alliance", "antarctica-inner-earth", "moon-mars-venus"],
    summary:
      "Ватикан, иезуиты, оккультная власть и финансово-религиозный контроль связаны в единый вражеский узел.",
  },
  {
    bounds: { height: 0.19, width: 0.24, x: 0.33, y: 0.71 },
    groupId: "hidden-infrastructure",
    id: "antarctica-inner-earth",
    keyTopics: ["Antarctica", "Inner Earth", "Dulce", "Area 51"],
    keywords: ["antarctica", "inner earth", "dulce", "area 51", "undersea bases"],
    label: "Antarctica & Inner Earth",
    matcher: {
      slugExact: ["antarctica", "inner-earth"],
      titleIncludes: ["antarctica", "inner earth", "area 51", "dulce", "undersea bases"],
    },
    relatedClusterIds: ["ancient-aliens", "vatican-occult-control", "moon-mars-venus"],
    summary:
      "Антарктида, подземные и подводные базы, crashed craft и hidden civilization-инфраструктура.",
  },
  {
    bounds: { height: 0.16, width: 0.27, x: 0.25, y: 0.8 },
    groupId: "hidden-infrastructure",
    id: "inner-earth-civilizations",
    keyTopics: ["Inner Earth Civilizations", "Agartha", "D.U.M.B.S", "Dulce"],
    keywords: ["inner earth civilizations", "agartha", "dumbs", "dulce"],
    label: "Inner Earth Civilizations",
    matcher: {
      slugExact: ["inner-earth-civilizations", "agartha", "dulce"],
      titleIncludes: ["inner earth", "agartha", "d.u.m.b", "dulce"],
    },
    relatedClusterIds: ["antarctica-inner-earth", "ancient-aliens", "dark-fleet-saturn"],
    summary:
      "Нижний сектор про внутреннюю Землю, Agartha, D.U.M.B.S и подземные базы как скрытую цивилизационную сеть.",
  },
  {
    bounds: { height: 0.14, width: 0.19, x: 0.69, y: 0.66 },
    groupId: "psychedelics",
    id: "entheogens",
    keyTopics: ["Ayahuasca", "Shamans", "LSD", "DMT"],
    keywords: ["entheogens", "ayahuasca", "lsd", "shamans", "dmt"],
    label: "Entheogens & Shamans",
    matcher: {
      slugExact: ["entheogens", "ayahuasca"],
      titleIncludes: ["entheogen", "ayahuasca", "lsd", "shaman", "dmt"],
    },
    relatedClusterIds: ["psychedelic-renaissance", "lightworkers-ascension", "rainbow-body"],
    summary: "Шаманизм и энтеогены поданы как древний путь доступа к тем же многомерным истинам.",
  },
  {
    bounds: { height: 0.16, width: 0.21, x: 0.75, y: 0.58 },
    groupId: "suppressed-science",
    id: "crystals-cymatics",
    keyTopics: ["Crystals", "Cymatics", "Chakras", "Merkaba"],
    keywords: ["crystals", "cymatics", "chakras", "merkaba"],
    label: "Crystals, Cymatics & Energy Body",
    matcher: {
      slugExact: ["crystals", "cymatics", "chakras", "merkaba"],
      titleIncludes: ["crystals", "cymatics", "chakras", "merkaba"],
    },
    relatedClusterIds: ["healing-energy", "lightworkers-ascension", "entheogens"],
    summary:
      "Правый нижний energy-body блок: crystals, cymatics, chakras и merkaba как язык тонких практик.",
  },
  {
    bounds: { height: 0.17, width: 0.22, x: 0.44, y: 0.2 },
    groupId: "ancient-civilizations",
    id: "ancient-builder-race",
    keyTopics: ["Ancient Builder Race", "Maldek", "Mars War", "Atlantis"],
    keywords: ["ancient builder race", "maldek", "atlantis", "pyramids", "mars war"],
    label: "Ancient Builder Race",
    matcher: {
      slugExact: ["ancient-builder-race", "maldek"],
      titleIncludes: ["ancient builder race", "maldek", "atlantis", "mars war"],
    },
    relatedClusterIds: ["ancient-aliens", "moon-mars-venus", "galactic-federation"],
    summary:
      "Древняя сверхцивилизация объясняет руины по Солнечной системе, Maldek, Mars War и lost tech.",
  },
] as const;

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase("en-US") ?? "";
}

function matchesNode(node: AwakeningAtlasNode, cluster: AwakeningReferenceCluster): boolean {
  const slug = normalizeText(node.slug);
  const summary = normalizeText(node.summary);
  const title = normalizeText(node.title);

  return (
    cluster.matcher.slugExact.some((candidate) => candidate === slug) ||
    cluster.matcher.titleIncludes.some((candidate) => title.includes(candidate)) ||
    cluster.keywords.some((keyword) => title.includes(keyword) || summary.includes(keyword))
  );
}

export function getAwakeningMapThemeGroup(
  groupId: AwakeningMapThemeGroupId
): AwakeningMapThemeGroup | undefined {
  return awakeningMapThemeGroups.find((group) => group.id === groupId);
}

export function getAwakeningReferenceCluster(
  clusterId: string,
  clusters: readonly AwakeningReferenceCluster[] = awakeningReferenceClusters
): AwakeningReferenceCluster | undefined {
  return clusters.find((cluster) => cluster.id === clusterId);
}

export function getRelatedAwakeningReferenceClusters(
  clusterId: string,
  clusters: readonly AwakeningReferenceCluster[] = awakeningReferenceClusters
): AwakeningReferenceCluster[] {
  const cluster = getAwakeningReferenceCluster(clusterId, clusters);
  if (!cluster) return [];

  return cluster.relatedClusterIds
    .map((relatedClusterId) => getAwakeningReferenceCluster(relatedClusterId, clusters))
    .filter((relatedCluster): relatedCluster is AwakeningReferenceCluster =>
      Boolean(relatedCluster)
    );
}

export function matchAwakeningReferenceClusters(
  graph: AwakeningAtlasGraph,
  clusters: readonly AwakeningReferenceCluster[] = awakeningReferenceClusters
): AwakeningReferenceClusterMatch[] {
  return clusters.map((cluster) => ({
    cluster,
    matchedNodeIds: graph.nodes.filter((node) => matchesNode(node, cluster)).map((node) => node.id),
  }));
}
