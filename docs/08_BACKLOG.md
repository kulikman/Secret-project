# Backlog

## How to Use

Work through tasks **one at a time**. Before starting a task:

1. Read `09_CURRENT_STATUS.md`
2. Read `10_AI_RULES.md` (in `.claude/rules/`)
3. Read `04_ARCHITECTURE.md`
4. Move task status to `In Progress`
5. After completion: update `09_CURRENT_STATUS.md` and mark `Done`

## Statuses

`Todo` · `In Progress` · `Review` · `Testing` · `Done` · `Blocked`

## Priorities

`P0: Critical` · `P1: Important` · `P2: Normal` · `P3: Later`

---

## Secret Bureau P0 Tasks

---

### BE-00: Backend audit docs sync

**Priority:** P0 | **Status:** Done

**Description:** Align backend contracts and route inventory with the actual code before implementing more backend epics.

**Acceptance Criteria:**

- [x] Backend audit exists in `docs/19_BACKEND_AUDIT_EPICS.md`.
- [x] `docs/06_API_CONTRACTS.md` documents current route inventory.
- [x] Implemented public route params and response shapes match docs.
- [x] Future/scaffold routes are explicitly marked.

---

### BE-02A: Rate limit public application intake

**Priority:** P0 | **Status:** Done

**Description:** Protect `POST /api/applications` against basic spam before adding admin moderation.

**Acceptance Criteria:**

- [x] Public application submissions are rate limited by client IP and normalized email.
- [x] Throttled requests return `429` and do not touch Supabase.
- [x] Route tests cover successful, invalid, and rate-limited submissions.
- [x] API contract documents the rate limit.

---

### BE-02B: Add application moderation backend actions

**Priority:** P0 | **Status:** Done

**Description:** Add the server-only backend layer for curator/admin application moderation without wiring UI or public admin API routes yet.

**Acceptance Criteria:**

- [x] Curator/admin/super_admin can list and filter applications through `requireAdminRole(APPLICATION_MODERATION_ROLES)`.
- [x] Curator/admin/super_admin can read one application detail through the RLS client.
- [x] Status changes use the service-role client only after admin role verification.
- [x] Status changes store reviewer/reviewed timestamp and write `admin.application_status_changed`.
- [x] Tests prove denied users do not reach Supabase writes.

---

### BE-02C: Wire application moderation admin UI

**Priority:** P0 | **Status:** Done

**Description:** Connect the RBAC-gated moderation helpers to `/admin/applications` without adding a separate admin JSON API route yet.

**Acceptance Criteria:**

- [x] `/admin/applications` lists applications for curator/admin/super_admin.
- [x] Admin can filter applications by status.
- [x] Admin can view application detail fields in the list card.
- [x] Admin can submit status transitions with a decision reason.
- [x] Viewers without moderation role see a restricted state instead of application data.

---

### BE-02D: Add privacy-safe application duplicate handling

**Priority:** P0 | **Status:** Done

**Description:** Avoid duplicate public application rows for the same email/city/event without exposing whether an email already applied.

**Acceptance Criteria:**

- [x] Public application route checks for an existing normalized email + city + event before insert.
- [x] Duplicate submissions return the same successful response shape as fresh submissions.
- [x] Duplicate submissions do not call the RLS insert path again.
- [x] Route tests cover duplicate handling and email normalization.

---

### BE-03A: Add shared API response helpers for API routes

**Priority:** P1 | **Status:** Done

**Description:** Start API contract standardization after payment runtime routes are removed from product scope.

**Acceptance Criteria:**

- [x] Shared Route Handler response helpers exist in `src/lib/api-response.ts`.
- [x] Public archive, applications, cron, and org routes use `{ ok, data/error }` envelopes.
- [x] `/api/orgs` returns JSON `401` instead of redirecting to login.
- [x] Zod validation errors can include issue summaries.
- [x] Route/helper tests cover success, unauthenticated, invalid input, not found, and errors for the updated scope.

---

### BRAIN-001: Confirm live Brain project for public archive

**Priority:** P0 | **Status:** Blocked

**Description:** Create or confirm a dedicated Brain project/slug for the public archive.

**Recommended slug:** `secret-bureau-public-archive`

**Acceptance Criteria:**

- [ ] Brain project/slug exists.
- [ ] App team knows whether to use `BRAIN_PROJECT_ID` or `BRAIN_PROJECT_SLUG`.
- [ ] No private Founder OS project/token is reused by the app.

---

### BRAIN-002: Provision scoped Brain token

**Priority:** P0 | **Status:** Blocked

**Description:** Provision a Brain project key or writable agent key limited to the Secret Bureau public archive project.

**Acceptance Criteria:**

- [ ] Token is added only through local/Vercel env.
- [ ] Token is not committed or pasted into docs/chat.
- [ ] Token cannot access unrelated Brain projects unless intentionally founder-scoped.

---

### SETUP-000: Complete external setup handoff

**Priority:** P0 | **Status:** Done

**Description:** Document exact external setup requirements for Brain, Supabase, Vercel, env variables, and deployment verification without committing secrets.

**Acceptance Criteria:**

- [x] Brain project/token requirements are documented.
- [x] Supabase project/migration/typegen steps are documented.
- [x] Vercel env/deployment setup is documented.
- [x] Secret handling rules are explicit.
- [x] PDF presentation and editable prompt clarification is captured.

---

### BRAIN-003: Close Brain SDK/API node and edge CRUD gaps

**Priority:** P0 | **Status:** Done

**Description:** Implement the direct node and edge CRUD capabilities documented as C1-C4 in `docs/10_BRAIN_DISCOVERY.md`.

**Acceptance Criteria:**

- [x] `createNode` SDK method exists.
- [x] `updateNode`, `createEdge`, and `getNode` contracts are available.
- [x] Brain API routes enforce project scope for node/edge operations.
- [x] Brain SDK/MCP/API tests pass locally.

---

### BRAIN-004: Close remaining Brain graph/search/ingest gaps

**Priority:** P0 | **Status:** Todo

**Description:** Brain capabilities C1-C10 are implemented locally; finish release/consumption planning and projection sync strategy.

**Acceptance Criteria:**

- [x] Structured semantic search contract is available locally in Brain.
- [x] Neighbors endpoint supports `depth` and `edgeTypes` locally in Brain.
- [x] Intersections endpoint exists locally in Brain.
- [x] Bulk merge is implemented transactionally in Brain.
- [x] Ingest profile strategy is decided.
- [x] `source_studies_archive` ingest profile is available locally in Brain.
- [x] Root/depth graph subset endpoint exists locally in Brain.
- [ ] Projection sync webhook/change event strategy is decided.

---

### APP-001: Add app-side Brain adapter plan

**Priority:** P0 | **Status:** Done

**Description:** Design the app adapter interface around Secret Bureau capabilities while adapting to the real Brain SDK.

**Acceptance Criteria:**

- [x] Adapter method names match app needs: create/update/get/merge/republish/search.
- [x] Adapter hides Brain project vs namespace mismatch from feature code.
- [x] Adapter never leaks Brain token to client code.

---

### APP-002: Implement server-only Brain adapter skeleton

**Priority:** P0 | **Status:** Done

**Description:** Create `src/lib/brain/*` with typed server-only adapter methods. Implement existing Brain SDK calls and explicit `not implemented` errors for missing capabilities.

**Acceptance Criteria:**

- [x] Brain adapter imports are server-only.
- [x] Existing Brain API methods are wrapped behind Secret Bureau method names.
- [x] Missing capabilities fail with typed errors.
- [x] Unit tests prove `BRAIN_API_KEY` is not exposed to client env.

---

### APP-003: Replace generic SaaS product docs with Secret Bureau docs

**Priority:** P0 | **Status:** Done

**Description:** Remove remaining generic template scope from product documentation and align architecture, schema, API contracts, and roles with Secret Bureau MVP.

**Acceptance Criteria:**

- [x] Product docs describe Тайное Бюро instead of a generic SaaS template.
- [x] App DB docs cover Secret Bureau read models and community tables.
- [x] API contracts document planned public/admin Secret Bureau routes.
- [x] Existing auth contracts are preserved; payment/billing contracts are removed from product scope.

---

### APP-004: Add node_projection app-side foundation

**Priority:** P0 | **Status:** Done

**Description:** Add the App DB read-model migration and typed projection helpers that can be used by future manual republish without calling live Brain from public pages.

**Acceptance Criteria:**

- [x] New migration creates `node_projection` without editing old migrations.
- [x] RLS allows public reads only for `published` projections.
- [x] Service-role-only write model is preserved by not adding user write policies.
- [x] TypeScript database contract includes `node_projection`.
- [x] Projection helpers reject unsupported Brain categories instead of inventing types.
- [x] Unit tests cover projection mapping and publish validation.

---

### APP-005: Add public portal projection reads

**Priority:** P0 | **Status:** Done

**Description:** Implement the first public portal routes and pages from `node_projection` so public archive rendering does not depend on live Brain.

**Acceptance Criteria:**

- [x] `/` no longer uses generic template landing copy.
- [x] `/topics` renders published topic projections.
- [x] `/topics/:slug` renders one published topic projection.
- [x] `/sources/:id` renders one published source projection.
- [x] Public API routes read App DB projection only.
- [x] Route/helper tests cover public projection reads.
- [x] No Brain adapter import is used by public portal routes/pages.

---

### APP-006: Add AI content source-first foundation

**Priority:** P0 | **Status:** Done

**Description:** Add App DB tables and source-first validators for dossiers, presentations, slides, and AI jobs without adding model/provider dependencies.

**Acceptance Criteria:**

- [x] New migration creates `dossiers`, `presentations`, `slides`, and `ai_jobs`.
- [x] RLS is enabled on all new AI content tables.
- [x] No anon/authenticated policies expose draft AI content.
- [x] TypeScript database contract includes AI content tables.
- [x] Generated blocks without `source_refs` fail validation.
- [x] Publish validation blocks source-less output.
- [x] Regeneration helper links new draft to `parent_version`.

---

### APP-007: Add community foundation and public application route

**Priority:** P0 | **Status:** Done

**Description:** Add App DB community tables and a public application submission route without implementing admin moderation before RBAC is approved.

**Acceptance Criteria:**

- [x] New migration creates `bureau_cities`, `bureau_events`, `applications`, and `photo_reports`.
- [x] RLS is enabled on all new community tables.
- [x] Published cities/events/photo reports are public read-only.
- [x] Public users can insert only new, unreviewed applications.
- [x] `POST /api/applications` validates input with Zod before Supabase insert.
- [x] Route/helper tests cover public application submission.
- [x] Admin moderation is not implemented without RBAC confirmation.

---

### APP-008: Add epic guardrails and runbooks

**Priority:** P0 | **Status:** Done

**Description:** Add repeatable guardrail checks and operational runbooks for Brain outage, projection repair, source-first AI content, and community applications.

**Acceptance Criteria:**

- [x] `pnpm guardrails` checks public portal boundaries and key invariants.
- [x] Runbooks document Brain outage behavior.
- [x] Runbooks document projection repair rules.
- [x] Runbooks document source-first AI content checks.
- [x] Runbooks document community application RLS expectations.
- [x] No new dependencies are added.

---

### APP-009: Add admin console shell and decomposition

**Priority:** P0 | **Status:** Done

**Description:** Create a safe admin console shell and document the full admin scope before enabling
real moderation, PDF generation, prompt editing, or integration controls.

**Acceptance Criteria:**

- [x] `/admin` protected shell exists.
- [x] Admin sections cover applications, PDF presentations, API/integrations, community cabinet, knowledge ops, and settings.
- [x] Scope includes the user cabinet for a registered community member.
- [x] Presentation output is PDF, not PPTX.
- [x] Presentation prompt is planned as admin-editable.
- [x] Missing operational concerns are documented.
- [x] No auth, CI, or secret logic is changed.

---

### APP-010: Implement admin RBAC and audit foundation

**Priority:** P0 | **Status:** Done

**Description:** Add real admin/editor/curator role enforcement before any admin mutation is exposed.

**Acceptance Criteria:**

- [x] Role storage strategy is approved.
- [x] Server-only admin role helper exists.
- [x] RLS policies protect admin reads; writes remain closed until audited server actions.
- [x] Admin audit action types are reserved for future mutations.
- [x] Tests prove regular authenticated users without an assignment cannot access admin roles.

---

### APP-011: Implement application moderation

**Priority:** P0 | **Status:** Done

**Description:** Let curators/admins process community applications now that RBAC foundation exists.

**Acceptance Criteria:**

- [x] Backend can list and filter applications.
- [x] Backend can view one application detail.
- [x] Backend can change status with a decision reason in audit metadata.
- [x] Status changes are auditable.
- [x] Public/authenticated non-admin users cannot reach moderation writes.
- [x] Admin UI exposes list/detail/status change.
- [x] Optional duplicate handling by email/event/city is added.
- [x] Optional notification trigger is skipped by owner request.

---

### APP-012: Implement PDF presentation prompt and export pipeline

**Priority:** P0 | **Status:** Blocked

**Description:** Add admin-editable `presentation_pdf` prompt templates and source-first PDF export.

**Acceptance Criteria:**

- [x] `ai_prompt_templates` schema is approved and migrated.
- [ ] Prompt versions are visible in admin.
- [ ] Generation creates `ai_jobs` and draft presentation rows.
- [ ] Slides without `source_refs` cannot be published.
- [ ] Export produces PDF artifacts, not PPTX.

---

## Infrastructure Setup Tasks

---

### SETUP-001: Configure Supabase project

**Priority:** P0 | **Status:** Todo

**Description:** Connect Тайное Бюро to a real Supabase project.

**Steps:**

1. Create project at supabase.com
2. Copy project URL and anon key to `.env.local`
3. Copy service role key to `.env.local`
4. Run `pnpm supabase link --project-ref <id>`
5. Run `pnpm supabase db push` to apply migrations

**Acceptance Criteria:**

- [ ] `pnpm dev` connects to Supabase without errors
- [ ] Auth sign-up creates a row in `profiles`

---

### SETUP-002: Payment Setup Removed From Scope

**Priority:** P0 | **Status:** Done

**Description:** Payments will not exist in the product. Stripe/checkout/portal/webhook setup is intentionally removed.

**Steps:**

1. Do not create payment products, prices, checkout flows, or webhook endpoints.
2. Do not add Stripe env vars to `.env.local` or Vercel.
3. Keep pricing, subscription, billing UI, and entitlement gates out of MVP scope.

**Acceptance Criteria:**

- [x] Runtime payment routes are absent.
- [x] Stripe env vars are absent from `.env.example` and env validation.
- [x] Stripe dependency is absent from `package.json`.

---

### SETUP-003: Configure Resend email

**Priority:** P1 | **Status:** Todo

**Steps:**

1. Add domain in Resend dashboard and verify DNS
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env.local`
3. Test welcome email on signup

---

### SETUP-004: Configure PostHog analytics

**Priority:** P2 | **Status:** Todo

**Steps:**

1. Create project at posthog.com
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`

---

## Product Tasks

New product work should be added as a concrete task with an epic number, priority,
status, acceptance criteria, likely files, and verification notes.
