# Epics

## Statuses

`Not Started` · `In Progress` · `Blocked` · `Review` · `Done`

---

## Epic 0: Discovery + Architecture Freeze

**Status:** Blocked

**Goal:** Verify Brain capabilities before implementing knowledge features.

**Scope:**

- Validate Brain SDK/API against capabilities `C1-C10`.
- Confirm project/namespace isolation strategy.
- Confirm ingest profile support.
- Confirm projection invalidation strategy.
- Produce app-side and Brain-side blocker lists.

**Current Output:**

- See `docs/10_BRAIN_DISCOVERY.md`.

**Acceptance Criteria:**

- [x] Local Brain code reviewed.
- [x] Capability matrix drafted.
- [x] Brain-side blockers listed.
- [x] App-side next steps listed.
- [ ] Live Secret Bureau Brain project/slug confirmed.
- [ ] Scoped Brain token provisioned through environment variables.
- [ ] Decision made on whether to implement Brain gaps before Epic 2.

---

## Epic 1: Platform Foundation

**Status:** Done

**Goal:** Prepare the app foundation for Secret Bureau-specific development.

**Scope:**

- Keep Next.js 16 + React 19.2 + Tailwind v4 stack.
- Add/confirm app env schema for Brain integration.
- Prepare Supabase schema direction for community and projection tables.
- Align docs/backlog with the product architecture.
- Keep auth/payment internals unchanged unless explicitly approved.

**Acceptance Criteria:**

- [x] Product docs no longer describe generic SaaS template scope.
- [x] App env schema includes Brain connection variables.
- [x] Initial App DB migration plan is documented.
- [x] Health/readiness strategy is documented.

---

## Epic 2: Knowledge Authoring + Projection

**Status:** Blocked

**Goal:** Let admins create/edit knowledge in Brain and publish App DB read projections.

**Blocked By:**

- Brain SDK/API gaps from `docs/10_BRAIN_DISCOVERY.md`.
- Live Brain project/token not yet confirmed.

**Scope:**

- Brain adapter in app.
- Admin knowledge routes.
- Manual republish flow.
- `node_projection` read model.
- Audit trail for admin actions.

**Current App-Side Output:**

- `node_projection` App DB migration added.
- Projection validation/mapping helpers added in `src/features/knowledge`.
- Republish remains blocked by missing direct Brain `getNode` / update contracts.

**Acceptance Criteria:**

- [ ] Editor can create a topic/source through the app.
- [ ] Data is written to Brain.
- [ ] Manual republish writes projection to App DB.
- [ ] Public routes do not call live Brain.

---

## Epic 3: Ingest + Review Workflow

**Status:** Blocked

**Goal:** Convert sources into reviewed knowledge entities.

**Blocked By:**

- Deployment/release of local Brain C9 `source_studies_archive` ingest profile.
- Knowledge authoring/projection not implemented.

**Scope:**

- Source ingest trigger.
- Review queue.
- Merge duplicate nodes.
- Publish reviewed projections.

**Acceptance Criteria:**

- [ ] Admin can ingest 5-10 sources.
- [ ] Brain creates pending entities/facts/relations.
- [ ] Editor can review and publish.

---

## Epic 4: Public Portal

**Status:** Done

**Goal:** Publish SEO-friendly archive pages from App DB projection.

**Scope:**

- `/`
- `/topics`
- `/topics/:slug`
- `/sources/:id`
- SSR/ISR from `node_projection`.
- SEO metadata and sitemap.
- Graceful degradation when Brain is unavailable.

**Acceptance Criteria:**

- [x] Published topic page renders from App DB.
- [x] Existing public pages remain available when Brain is unavailable.

**Current Output:**

- Public landing page updated for Тайное Бюро.
- `GET /api/topics`, `GET /api/topics/:slug`, and `GET /api/sources/:id`
  read `node_projection`.
- `/topics`, `/topics/:slug`, and `/sources/:id` pages render from App DB
  projection helpers.
- `/topics` added to static sitemap entries.

---

## Epic 5: AI Content Pipeline

**Status:** In Progress

**Goal:** Generate dossiers, presentations, and speech assets from reviewed knowledge.

**Scope:**

- `ai_jobs`.
- Dossier generation.
- Presentation generation.
- Source-first validation.
- Version history.
- PDF presentation export.
- Admin-editable presentation prompt.

**Acceptance Criteria:**

- [x] Every generated block has `source_refs`.
- [x] Publishing is blocked when sources are missing.
- [x] Regeneration creates a new version.

**Current Foundation Output:**

- AI content tables migration added for `dossiers`, `presentations`, `slides`,
  and `ai_jobs`.
- Source-first validators added in `src/features/ai-content`.
- No model/provider calls are implemented yet.
- PDF presentation export remains future work.
- Presentation prompt must be editable through a future admin surface.

---

## Epic 6: Graph / Awakening Map

**Status:** Blocked

**Goal:** Render an interactive graph of topics and intersections.

**Blocked By:**

- Deployment/release of local Brain C6/C7/C10 neighbors/intersections/subgraph
  contracts.
- App-side graph cache/UI wiring.

**Scope:**

- Graph cache.
- Sigma.js map.
- 1-hop and 2-hop exploration.
- Filters by relation/category.

**Acceptance Criteria:**

- [ ] Root topic shows related entities and neighboring topics.
- [ ] Map does not depend on full live Brain graph for production usage.

---

## Epic 7: Community Module

**Status:** In Progress

**Goal:** Implement cities, events, applications, and photo reports in App DB.

**Scope:**

- Bureau cities.
- Events.
- Applications.
- Admin moderation.
- Curator/editor/admin permissions.

**Acceptance Criteria:**

- [x] User can submit an application.
- [ ] Admin can change application status.
- [ ] Event can be created and published.

**Current Foundation Output:**

- Community tables migration added for cities, events, applications, and photo
  reports.
- `POST /api/applications` validates and inserts public applications through
  the RLS client.
- Admin moderation remains blocked by the approved RBAC/admin surface.

---

## Epic 8: Hardening + Go-Live

**Status:** In Progress

**Goal:** Prepare the system for production operations.

**Scope:**

- E2E smoke tests.
- Rate limits.
- Retry/timeout policies.
- Projection repair tooling.
- Cost observability.
- Runbooks.

**Acceptance Criteria:**

- [ ] Critical paths are covered by smoke tests.
- [ ] Failures are diagnosable via logs/trace ids.
- [x] Brain outage behavior is documented and tested.

**Current Foundation Output:**

- `pnpm guardrails` verifies public portal / Brain dependency boundaries.
- Operational runbooks added in `docs/16_RUNBOOKS.md`.
- Full production hardening still requires deployed environments and E2E smoke
  tests.
