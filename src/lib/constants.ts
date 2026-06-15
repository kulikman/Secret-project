import { siteConfig } from "@/config/site";

/**
 * Static display-name fallback for places that can't await `getClientEnv()`
 * (inline copy in default metadata, error pages, etc.). For runtime-tunable
 * values read `getClientEnv().NEXT_PUBLIC_APP_NAME` instead.
 *
 * @public
 */
export const APP_NAME: string = siteConfig.name;

/**
 * Canonical route map.
 *
 * Only routes that physically exist in `src/app/` belong here — Next 16
 * typed routes will fail `tsc` if you reference a non-existent path.
 * When you add a new top-level route, register it here AND in
 * `SEGMENT_LABELS` (breadcrumbs.tsx).
 *
 * Rules:
 *   - Every nested route must have a navigable parent (no dead intermediate URLs).
 *   - Use descriptive nouns as segments, not abbreviations or numeric IDs alone.
 *   - Dynamic segments: `/projects/[id]`, never `/p/[id]`.
 */
export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  settings: "/settings",
  settingsBilling: "/settings/billing",
  settingsUsage: "/settings/usage",
  settingsApiKeys: "/settings/api-keys",
  settingsOrg: "/settings/org",
} as const;

/** @public */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
