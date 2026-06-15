import type { MetadataRoute } from "next";

import { getPublicMetadataEnv } from "@/lib/env";

/**
 * Dynamic sitemap generator.
 *
 * Next.js calls this at build time (or on request if ISR/dynamic) to produce
 * `/sitemap.xml`. Add new static routes manually; fetch dynamic routes
 * (blog posts, docs, products) from Supabase.
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
    // Add more static routes as the product grows:
    // { url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.8 },
    // { url: `${baseUrl}/docs`, lastModified: new Date(), priority: 0.7 },
  ];

  // ── Dynamic routes (example) ─────────────────────────────────────────────
  // Keep this file build-safe. If dynamic sitemap entries need database data,
  // fetch them through a server-only feature helper instead of importing
  // Supabase clients directly here.
  //
  // const posts = await getPublishedPostsForSitemap()
  //
  // const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: new Date(post.updated_at),
  //   changeFrequency: "weekly" as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticRoutes,
    // ...postRoutes,
  ];
}
