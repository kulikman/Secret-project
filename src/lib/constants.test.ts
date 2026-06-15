import { describe, it, expect } from "vitest";

import { ROUTES } from "./constants";

/**
 * Sync guard: every nested route segment in `ROUTES` must have a label
 * registered in `SEGMENT_LABELS` (breadcrumbs.tsx) — otherwise a typo
 * or a forgotten label produces an ugly title-cased segment in prod.
 *
 * The test is intentionally co-located here (not in breadcrumbs.test.ts)
 * because the source of truth is `ROUTES`, and importing the LABELS map
 * via dynamic import keeps `"use client"` boundaries clean.
 */
describe("ROUTES <-> SEGMENT_LABELS sync", () => {
  it("every nested segment in ROUTES has a label or is a known root", async () => {
    const breadcrumbsModule = await import("@/components/layout/breadcrumbs");
    expect(breadcrumbsModule.getBreadcrumbItems).toBeTypeOf("function");

    // SEGMENT_LABELS is internal to breadcrumbs.tsx — duplicate the keys
    // here as a snapshot. Treat this list as the canonical "labels exist"
    // registry; update both files together when adding a route.
    const SEGMENT_LABELS_KNOWN = new Set([
      "dashboard",
      "settings",
      "docs",
      "blog",
      "profile",
      "billing",
      "usage",
      "api-keys",
      "org",
      "onboarding",
      "pricing",
      "team",
      "projects",
      "analytics",
      "companies",
      "orgs",
      "admin",
      "users",
    ]);

    const SPECIAL_DYNAMIC = new Set(["edit", "new"]);
    const ROOT_LEVEL = new Set(["", "login", "signup", "forgot-password", "reset-password"]);

    for (const path of Object.values(ROUTES)) {
      const segments = path.split("/").filter(Boolean);
      // Skip first segment for top-level pages (no breadcrumb).
      const nested = segments.slice(1);
      for (const seg of nested) {
        const ok = SEGMENT_LABELS_KNOWN.has(seg) || SPECIAL_DYNAMIC.has(seg) || ROOT_LEVEL.has(seg);
        expect(ok, `Route segment "${seg}" (in ${path}) has no label in SEGMENT_LABELS`).toBe(true);
      }
    }
  });
});
