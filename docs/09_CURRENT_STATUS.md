# Current Status

> **AI Agent:** Read this file at the start of every session before writing any code.
> Update this file after every completed task.
> Do not invent progress — only write what is confirmed from the current codebase.

---

## Last Updated

2026-06-17

## Current Phase

- [x] Setup (configuring template for this project)
- [ ] MVP Development
- [ ] Beta
- [ ] Production

---

## Currently Working On

All currently safe app-side epic foundations are complete or documented as
blocked. Remaining work needs external environment setup, remaining Brain
graph/ingest gaps, AI provider selection, PDF renderer/storage, or production
deployment context.

---

## Completed

- [x] Template scaffolded (Next.js 16, Supabase, email, onboarding, notifications, API keys, orgs)
- [x] Project renamed to Тайное Бюро
- [x] Local Brain code reviewed for capabilities C1-C10
- [x] Brain discovery matrix created in `docs/10_BRAIN_DISCOVERY.md`
- [x] Brain C1-C4 node/edge CRUD gaps implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C5 structured semantic search implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C6 bounded neighbors implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C7 graph intersections implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C8 transactional bulk merge implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C9 `source_studies_archive` ingest profile implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain C10 root/depth graph subset implemented locally in `/Users/DEV/Elaurion-Brain`
- [x] Brain server env contract added to app validation and `.env.example`
- [x] App-side Brain adapter plan created in `docs/11_PLATFORM_FOUNDATION.md`
- [x] Server-only Brain adapter skeleton created in `src/lib/brain/*`
- [x] Epic 1 Platform Foundation completed
- [x] `node_projection` App DB migration added for public archive read model
- [x] Projection validation/mapping helpers added in `src/features/knowledge`
- [x] Epic 4 public portal pages and projection read APIs added
- [x] AI content tables and source-first validators added
- [x] Community tables and public application submission route added
- [x] Epic guardrail script and operational runbooks added
- [x] External setup handoff documented in `docs/17_EXTERNAL_SETUP.md`
- [x] Admin console shell and decomposition added in `/admin` and `docs/18_ADMIN_CONSOLE.md`
- [x] Admin RBAC foundation added with `admin_role_assignments`, read-only RLS policies, and `requireAdminRole()`
- [x] Backend audit and epic decomposition documented in `docs/19_BACKEND_AUDIT_EPICS.md`
- [x] Backend API contracts synced with current route inventory
- [x] Public application intake rate limiting added
- [x] Application moderation backend actions added with RBAC and audit logging
- [x] `/admin/applications` wired to list/filter applications and submit audited status transitions
- [x] Public application duplicate handling added for normalized email + city + event
- [x] API response helpers added and API routes partially standardized
- [x] Request IDs added to standardized API envelopes, `X-Request-Id` headers, and cron/org log paths
- [x] Payment runtime and schema removed from product scope: no Stripe checkout, portal, webhook, pricing page, billing page, usage plan limits, Stripe env validation, or subscriptions table
- [x] Awakening Map foundation added with moderated topic suggestions and `/admin/awakening-map`
- [x] Presentation cache/generation contract added for 20-25 page PDF decks, Claude-compatible text generation, separate visual provider metadata, and stored artifacts
- [ ] Supabase project connected (SETUP-001)
- [x] Resend setup skipped by owner request; notifications remain provider-neutral/future only
- [ ] Core feature implemented

---

## In Progress

- [ ] None locally without resolving blockers below

---

## Blocked

- [ ] Live Brain project/slug `secret-bureau-public-archive` is not confirmed
- [ ] Scoped Brain token is not provisioned in app env
- [ ] Local Brain C1-C10 changes are not deployed/versioned for app consumption
- [ ] Epic 2 admin authoring/republish remains blocked by live Brain access and remaining ingestion/search strategy, not by basic node/edge CRUD
- [ ] Epic 3 ingest/review remains blocked by deploying Brain C9 and connecting app adapter/admin ingest flow
- [ ] Epic 5 model/provider generation and PDF presentation export remain unimplemented
- [ ] Epic 5 presentation prompt admin editor remains unimplemented
- [ ] Awakening Map admin list/detail and approve/reject/merge actions remain unimplemented
- [ ] Presentation text/visual generation workers and PDF storage/download routes remain unimplemented
- [ ] Epic 6 Graph Map remains blocked by deploying Brain C6/C7/C10 and connecting app-side graph cache/UI
- [ ] Epic 7 event publishing remains unimplemented
- [ ] Most domain admin mutations remain blocked; application status backend/UI is implemented, but admin JSON API route is not implemented
- [ ] Member cabinet data model remains blocked until profile/community membership scope is approved
- [ ] Backend audit found Supabase security-definer hardening, Brain adapter wiring, remaining API contract tests, and RLS scenario tests as remaining backend priorities

---

## Next Step

Continue with the next safe app-side slice: build `/admin/awakening-map` list/detail
for pending suggestions, then add audited approve/reject/merge actions. Claude/text
and visual AI provider calls should wait until provider/env choices are confirmed.

---

## Do Not Touch

These areas must not be changed without explicit discussion:

- `supabase/migrations/` — no manual edits, only new migration files
- `src/lib/supabase/admin.ts` — never import from client-side code
- `src/proxy.ts` — auth + security headers wiring
- Auth callback logic (`src/app/auth/callback/`)

---

## Known Issues

- Brain currently uses project scope, not the `namespace` primitive described in the product architecture.
- Brain C1-C10 node/edge/search/neighbors/intersections/bulk-merge/profiled-ingest/subgraph contracts exist only in the local `/Users/DEV/Elaurion-Brain` checkout until deployed/released.

---

## Recent Decisions

- 2026-06-15: MVP projection sync starts with manual republish; webhook remains future work.
- 2026-06-15: App Brain adapter uses reviewed Brain HTTP contracts directly; no `@elaurion/brain-sdk` dependency is added until the app can consume a real package/contract.
- 2026-06-15: `node_projection` foundation can proceed while Brain write APIs are blocked; admin RBAC/profile role changes are not made without separate confirmation.
- 2026-06-15: Presentation output is PDF, not PPTX; presentation prompts are editable through future admin-managed `ai_prompt_templates`.
- 2026-06-15: Brain basic graph CRUD C1-C4 should be consumed through SDK/API once the local Brain changes are deployed or versioned; do not add app-side fetch hacks for these capabilities.
- 2026-06-16: Brain structured semantic search C5 should be consumed through SDK `semanticSearch()` or `GET /search` once deployed; do not parse rendered `/context` output for app search.
- 2026-06-16: Brain bounded neighbors C6 should be consumed through SDK `getNeighbors()` or `GET /nodes/:id/neighbors` once deployed; do not build Graph Map from full `/graph` except seed/spike work.
- 2026-06-16: Brain graph intersections C7 should be consumed through SDK `getIntersections()` or `GET /nodes/:id/intersections` once deployed; use `via` as shared-node category filters, not a separate namespace primitive.
- 2026-06-16: Brain bulk merge C8 should be consumed through SDK `mergeNodes({ primaryNodeId, duplicateNodeIds })` or `POST /nodes/:id/merge` with `{ duplicateIds }` once deployed; legacy single merge remains supported.
- 2026-06-16: Brain profiled ingest C9 should be consumed through SDK `ingest({ source, content, profile: "source_studies_archive" })` or `POST /ingest` with `profile` once deployed; profile is persisted in ingest metadata and used by the worker prompt.
- 2026-06-16: Brain graph subset C10 should be consumed through SDK `getGraphSubset({ rootNodeId, depth })` or `GET /nodes/:id/subgraph` once deployed; production Graph Map must not depend on full `/graph`.
- 2026-06-16: Admin console starts as a protected read-only shell; real mutations require RBAC/RLS/audit first. Presentation output remains PDF, and `presentation_pdf` prompt editing is a future admin-managed feature.
- 2026-06-17: Admin roles are stored in `admin_role_assignments`, not `profiles`, to avoid leaking roles through broadly readable profile rows. `/admin` requires `requireAdminRole()`; most domain mutations still need audited server actions.
- 2026-06-17: Application status moderation has backend helpers with RBAC and audit logging; separate admin JSON API route wiring remains pending.
- 2026-06-17: `/admin/applications` now lists and filters applications and submits status transitions through the audited backend helper. A separate admin JSON API route is still not implemented.
- 2026-06-17: Public application duplicate handling is privacy-safe: duplicate normalized email/city/event submissions return the same `{ ok: true }` shape and do not insert a second row.
- 2026-06-17: Resend/notification trigger is intentionally skipped by owner request.
- 2026-06-17: `src/lib/api-response.ts` and `src/lib/api-auth.ts` start BE-03. Public archive, applications, cron, and org routes use standard JSON helpers.
- 2026-06-17: Payments are removed from product scope. Stripe checkout/portal/webhook routes, pricing/billing/usage pages, plan limits, payment email templates, Stripe env vars, the Stripe package dependency, `public.subscriptions`, and `profiles.stripe_customer_id` are removed.
- 2026-06-17: Standardized API responses include `requestId` and `X-Request-Id`; safe inbound `x-request-id` values are preserved, and cron/org logs include the response request id.

---

## Environment Status

| Environment | URL                   | Status            |
| ----------- | --------------------- | ----------------- |
| Local       | http://localhost:3000 | ⬜ Not verified   |
| Staging     | TBD                   | ⬜ Not configured |
| Production  | TBD                   | ⬜ Not deployed   |
