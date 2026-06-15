"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

/**
 * Route segment → human-readable label map.
 *
 * Add entries here when creating new routes. Dynamic segments (e.g. `[slug]`)
 * are resolved at render time via the `resolveLabel` prop.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  docs: "Docs",
  blog: "Blog",
  profile: "Profile",
  billing: "Billing",
  usage: "Usage",
  "api-keys": "API Keys",
  org: "Organizations",
  team: "Team",
  projects: "Projects",
  onboarding: "Onboarding",
  pricing: "Pricing",
  analytics: "Analytics",
  companies: "Companies",
  orgs: "Organizations",
  admin: "Admin",
  users: "Users",
};

export interface BreadcrumbItem {
  href: string;
  label: string;
  isCurrent: boolean;
}

interface BreadcrumbsProps {
  /**
   * Resolve a dynamic segment (e.g. `[slug]`) to a readable label.
   * Called for every segment not found in SEGMENT_LABELS.
   * Return `null` to use the raw segment as-is.
   */
  resolveLabel?: (segment: string, segments: string[]) => string | null;
  /** Additional CSS classes on the outer `<nav>`. */
  className?: string;
}

/**
 * Breadcrumb navigation that auto-generates from the current URL path.
 *
 * Renders: Dashboard › Companies › Acme Inc › Edit
 *
 * Usage:
 *   - Drop `<Breadcrumbs />` into any layout or page.
 *   - For dynamic routes, pass `resolveLabel` to map slugs to titles.
 *
 * @example
 *   // /docs/getting-started → Dashboard › Docs › Getting Started
 *   <Breadcrumbs resolveLabel={(seg) => seg.replace(/-/g, " ")} />
 *
 * @example
 *   // /projects/abc123 → Dashboard › Projects › My Project
 *   <Breadcrumbs resolveLabel={(seg) => projectMap[seg] ?? null} />
 */
export function Breadcrumbs({
  resolveLabel,
  className,
}: BreadcrumbsProps): React.ReactElement | null {
  const pathname = usePathname();

  const items = getBreadcrumbItems(pathname, { resolveLabel });
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("text-muted-foreground flex items-center gap-1.5 text-sm", className)}
    >
      <ol className="flex items-center gap-1.5">
        {items.map(({ href, label, isCurrent }) => (
          <Fragment key={href}>
            <li>
              {isCurrent ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={{ pathname: href }} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
            {!isCurrent && (
              <li aria-hidden="true" className="text-muted-foreground/40 select-none">
                ›
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

interface GetBreadcrumbItemsOptions {
  resolveLabel?: (segment: string, segments: string[]) => string | null;
}

/**
 * Build breadcrumb items from a URL pathname following the project's UX rules:
 * - No breadcrumbs on `/`, `/dashboard`, and `/settings*`
 * - No breadcrumbs for first-level list pages (e.g. `/companies`)
 * - Breadcrumbs always start with `Dashboard` → `/dashboard`
 */
export function getBreadcrumbItems(
  pathname: string,
  { resolveLabel }: GetBreadcrumbItemsOptions = {}
): BreadcrumbItem[] {
  if (pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/settings")) {
    return [];
  }

  const segments = pathname.split("/").filter(Boolean);
  const visibleSegments = segments.filter((s) => !s.startsWith("("));

  // First-level pages (lists from the sidebar) don't render breadcrumbs.
  if (visibleSegments.length <= 1) return [];

  const items: BreadcrumbItem[] = [{ href: "/dashboard", label: "Dashboard", isCurrent: false }];

  for (let index = 0; index < visibleSegments.length; index += 1) {
    const segment = visibleSegments[index];
    if (!segment) continue;
    const href = "/" + visibleSegments.slice(0, index + 1).join("/");
    const isCurrent = index === visibleSegments.length - 1;

    const label =
      resolveSpecialLabel(segment, visibleSegments) ??
      SEGMENT_LABELS[segment] ??
      resolveLabel?.(segment, visibleSegments) ??
      formatSegment(segment);

    items.push({ href, label, isCurrent });
  }

  // Mark the last item as current (no link in UI)
  const last = items[items.length - 1];
  if (last) {
    items[items.length - 1] = { ...last, isCurrent: true };
  }

  return items;
}

function resolveSpecialLabel(segment: string, segments: string[]): string | null {
  if (segment === "edit") return "Edit";

  if (segment === "new") {
    const section = segments[0] ?? "";
    const sectionLabel = SEGMENT_LABELS[section] ?? formatSegment(section);
    return `New ${singularize(sectionLabel)}`;
  }

  return null;
}

function singularize(label: string): string {
  if (label.endsWith("ies")) return label.slice(0, -3) + "y";
  if (label.endsWith("s") && label.length > 1) return label.slice(0, -1);
  return label;
}

/**
 * Converts a URL segment to a human-readable label.
 * `getting-started` → `Getting Started`
 * UUIDs are left as-is (they should be resolved via `resolveLabel`).
 */
function formatSegment(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
