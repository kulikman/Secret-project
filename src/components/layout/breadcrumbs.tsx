"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

/**
 * Route segment → human-readable label map.
 *
 * Add entries here when creating new routes. Dynamic segments (e.g. `[slug]`)
 * are resolved at render time via `labels` or the `resolveLabel` prop.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  docs: "Docs",
  blog: "Blog",
  profile: "Profile",
  "api-keys": "API Keys",
  org: "Organizations",
  team: "Team",
  projects: "Projects",
  onboarding: "Onboarding",
  topics: "Темы",
  sources: "Источники",
  analytics: "Analytics",
  companies: "Companies",
  orgs: "Organizations",
  admin: "Админка",
  api: "API",
  applications: "Заявки",
  "awakening-map": "Карта пробуждения",
  community: "Сообщество",
  knowledge: "Знания",
  presentations: "Презентации",
  users: "Users",
  awakening: "Пробуждение",
  map: "Карта",
};

export interface BreadcrumbItem {
  href: string;
  label: string;
  isCurrent: boolean;
}

interface BreadcrumbsProps {
  /**
   * Serializable segment → label map for Server Components.
   * Prefer this on app route pages because function props cannot cross
   * the Server → Client boundary.
   */
  labels?: Record<string, string>;
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
 *   - For dynamic routes from Server Components, pass `labels`.
 *   - For dynamic routes fully inside Client Components, `resolveLabel` is supported.
 *
 * @example
 *   // /projects/abc123 → Dashboard › Projects › My Project
 *   <Breadcrumbs labels={{ abc123: "My Project" }} />
 *
 * @example
 *   // Client Component only: /projects/abc123 → Dashboard › Projects › My Project
 *   <Breadcrumbs resolveLabel={(seg) => projectMap[seg] ?? null} />
 */
export function Breadcrumbs({
  labels,
  resolveLabel,
  className,
}: BreadcrumbsProps): React.ReactElement | null {
  const pathname = usePathname();

  const items = getBreadcrumbItems(pathname, { labels, resolveLabel });
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
  labels?: Record<string, string>;
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
  { labels, resolveLabel }: GetBreadcrumbItemsOptions = {}
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
      labels?.[segment] ??
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
