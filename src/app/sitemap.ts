import type { MetadataRoute } from "next";

import { getPublicMetadataEnv } from "@/lib/env";

/**
 * Dynamic sitemap generator.
 *
 * Next.js calls this at build time (or on request if ISR/dynamic) to produce
 * `/sitemap.xml`. Static public routes stay build-safe; dynamic archive routes
 * can be added after Supabase projection data exists in the target environment.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public URL only — does not require Supabase keys at build time.
  const { NEXT_PUBLIC_APP_URL: baseUrl } = getPublicMetadataEnv();

  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/awakening-map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // ── Dynamic routes (future) ──────────────────────────────────────────────
  // Keep this file build-safe. If dynamic sitemap entries need database data,
  // fetch them through a server-only feature helper instead of importing
  // Supabase clients directly here.
  //
  // const topics = await getPublishedTopicsForSitemap()
  //
  // const topicRoutes: MetadataRoute.Sitemap = (topics ?? []).map((topic) => ({
  //   url: `${baseUrl}/topics/${topic.slug}`,
  //   lastModified: new Date(topic.updated_at),
  //   changeFrequency: "weekly" as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticRoutes,
    // ...postRoutes,
  ];
}
