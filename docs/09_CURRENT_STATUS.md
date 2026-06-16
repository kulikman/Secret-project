# Current Status

> **AI Agent:** Read this file at the start of every session before writing any code.
> Update this file after every completed task.
> Do not invent progress — only write what is confirmed from the current codebase.

---

## Last Updated

2026-06-16

## Current Phase

- [x] Setup (configuring template for this project)
- [ ] MVP Development
- [ ] Beta
- [ ] Production

---

## Currently Working On

All currently safe app-side epic foundations are complete or documented as
blocked. Remaining work needs external environment setup, remaining Brain
graph/ingest gaps, RBAC approval, or production deployment context.

---

## Completed

- [x] Template scaffolded (Next.js 16, Supabase, Stripe, email, onboarding, notifications, API keys, orgs)
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
- [ ] Supabase project connected (SETUP-001)
- [ ] Stripe configured (SETUP-002)
- [ ] Resend configured (SETUP-003)
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
- [ ] Epic 6 Graph Map remains blocked by deploying Brain C6/C7/C10 and connecting app-side graph cache/UI
- [ ] Epic 7 admin moderation/event publishing remains blocked by RBAC/admin surface approval

---

## Next Step

Resolve blockers: live Brain project/token, deploy/version Brain C1-C10
changes, connect Supabase, approve RBAC/admin surface, and wire app adapter
consumption.

---

## Do Not Touch

These areas must not be changed without explicit discussion:

- `supabase/migrations/` — no manual edits, only new migration files
- `src/lib/supabase/admin.ts` — never import from client-side code
- `src/proxy.ts` — auth + security headers wiring
- Payment webhook logic (`src/app/api/webhooks/stripe/`)
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

---

## Environment Status

| Environment | URL                   | Status            |
| ----------- | --------------------- | ----------------- |
| Local       | http://localhost:3000 | ⬜ Not verified   |
| Staging     | TBD                   | ⬜ Not configured |
| Production  | TBD                   | ⬜ Not deployed   |
