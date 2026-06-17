# Backend Audit + Epic Decomposition

## Status

Date: 2026-06-17

Scope: Next.js Route Handlers, Server Actions, Supabase migrations/RLS, Brain adapter,
cron jobs, env validation, audit logging, and backend tests.

This is an audit/decomposition document. It does not mark implementation complete unless the current
codebase already proves it.

## Current Backend Map

| Area                          | Current State                                                                                                                | Main Files                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public archive API            | Implemented from `node_projection`; no live Brain dependency.                                                                | `src/app/api/topics/*`, `src/app/api/sources/[id]/route.ts`, `src/features/knowledge/*`          |
| Public applications           | Zod validation, rate limit, privacy-safe duplicate handling, RLS insert, and admin moderation UI/backend exist.              | `src/app/api/applications/route.ts`, `src/features/community/*`, `src/app/admin/applications/*`  |
| Admin RBAC                    | `admin_role_assignments`, `requireAdminRole()`, and application status write action exist; most write actions still pending. | `src/lib/admin-auth.ts`, `supabase/migrations/20260617062345_secret_bureau_admin_rbac_audit.sql` |
| Audit logs                    | `audit_logs` table and `writeAuditLog()` exist; application status changes are wired, many future admin actions are not.     | `src/lib/audit.ts`, `supabase/migrations/0003_audit_log.sql`                                     |
| Brain adapter                 | Server-only skeleton exists; C2-C10 deployed consumption remains blocked.                                                    | `src/lib/brain/*`                                                                                |
| AI content                    | Tables, prompt templates, and source-first validators exist; no model/PDF pipeline.                                          | `src/features/ai-content/*`, migrations `0010`, `0012`                                           |
| Payments                      | Removed from product scope; no checkout, portal, webhook, pricing, billing UI, or paid entitlements.                         | No runtime payment files remain                                                                  |
| Cron/maintenance              | Cleanup cron protected by `CRON_SECRET`; example route remains scaffold-only.                                                | `src/app/api/cron/*`, `src/features/maintenance/*`                                               |
| Security headers/auth refresh | Next 16 `src/proxy.ts` refreshes Supabase session and sets headers.                                                          | `src/proxy.ts`, `src/lib/security-headers.ts`, `src/lib/supabase/middleware.ts`                  |

## Confirmed Strengths

- Protected app routes use `supabase.auth.getUser()` through `requireUser()` or direct calls.
- Public archive reads App DB projection only, preserving Brain outage behavior.
- RLS is enabled on app-owned tables and Supabase local schema lint currently passes.
- Service-role client is marked `server-only`.
- Admin roles are isolated from `profiles`, avoiding role leakage through broadly readable profile rows.
- Tests cover projection helpers, public archive routes, public application inserts/rate limits, application moderation helpers, Brain adapter guardrails, cron auth, API key verification, and admin role helper.
- Supabase April 2026 Data API change is accounted for by explicit grants on new tables that need API access.

## Backend Findings

### P0: Must Fix Before Real Admin/Production

1. Most admin write operations are not implemented yet.
   Evidence: `/admin` is RBAC-gated and application status backend action exists, but UI wiring, prompt editing, republish, and generation actions are still planned.
   Impact: product still cannot operate fully from admin without additional UI/API work or external tooling.

2. Existing `security definer` functions live in `public` schema.
   Evidence: migrations `0001`, `0004`, and `0008` create security-definer functions in `public`.
   Impact: Supabase current guidance recommends avoiding security-definer functions in exposed schemas. Existing functions have narrow `search_path`, but this still deserves a hardening epic before production.

3. Brain-backed admin flows are blocked by external Brain deployment/versioning.
   Evidence: adapter throws `BRAIN_CAPABILITY_NOT_IMPLEMENTED` for update/get/search/neighbors/intersections/subgraph/profiled ingest.
   Impact: knowledge authoring, ingest, graph map, and republish cannot be completed in app yet.

### P1: Important Next

1. API response style is partially inconsistent.
   Evidence: public archive, applications, orgs, and cron use shared helpers; some future admin APIs are not implemented yet.
   Impact: frontend/admin consumers still need per-route handling until BE-03 is completed.

2. Protected API redirect semantics are fixed for `/api/orgs`; remaining future API routes need the same pattern.
   Evidence: `src/lib/api-auth.ts` is used by `/api/orgs`.
   Impact: new JSON endpoints should avoid login redirects and return JSON `401`.

3. API key Server Actions need stronger input validation and error surfacing.
   Evidence: create/rename/delete trim values but do not use Zod or consistently throw on failed delete/update.
   Impact: weak UX/debuggability and harder security testing.

4. Public API contract docs drift from implementation.
   Evidence: docs mention cursor/q for `GET /api/topics`; implementation uses page/limit only.
   Impact: future Codex agents may implement against wrong contracts.

5. Readiness health is stateless only.
   Evidence: `/api/health` never checks DB, Brain, email, or Redis.
   Impact: uptime monitor can stay green while critical backend dependencies are broken.

6. Brain HTTP client has no timeout/retry/circuit breaker.
   Evidence: `BrainHttpClient` uses fetch directly.
   Impact: hung upstream calls can degrade admin/server actions.

7. Cron example route is still present but not scheduled.
   Evidence: `vercel.json` schedules only `/api/cron/cleanup`.
   Impact: extra exposed endpoint, albeit protected by `CRON_SECRET`.

8. Admin read policies exist, but there are no RLS regression tests with real test users.
   Evidence: Vitest mocks helpers, but no local Supabase RLS scenario tests.
   Impact: policy regressions can slip through.

### P2: Hardening / Production Quality

1. Request IDs exist in standardized API responses and selected log paths; full trace propagation across all future admin/server actions is still pending.
2. No webhook delivery log/dead-letter model.
3. No application retention policy.
4. No PDF artifact storage policy.
5. No seed data for admin, applications, prompt templates, and public archive smoke tests.
6. No E2E coverage for admin RBAC, application moderation, and public archive.
7. No dedicated readiness dashboard for Brain/Supabase/Vercel/AI providers/Sentry/PostHog.

## Epic Decomposition

### Epic BE-00: Backend Audit / Docs Sync

Goal: keep backend docs accurate enough for Codex handoff.

Tasks:

- Align `docs/06_API_CONTRACTS.md` with actual route params and response shapes.
- Add backend audit findings to backlog/status.
- Add a route inventory table with owner, auth mode, data source, and test coverage.
- Remove or label scaffold-only endpoints such as `/api/cron/example`.

Acceptance criteria:

- API docs match implementation or clearly mark future contracts.
- Every backend route has auth mode documented: public, authenticated, admin, cron, webhook.
- No known stale role-storage statements or non-existent prompt fields remain in docs.

### Epic BE-01: Supabase Security Hardening

Goal: make RLS/auth/admin foundations production-safe.

Tasks:

- Review `security definer` functions in public schema and move hardened helper functions to a private schema where feasible.
- Add local RLS regression tests for anonymous, authenticated member, curator, editor, admin, and super_admin roles.
- Add a trusted bootstrap path for first `super_admin` assignment.
- Confirm grants for Data API exposure after Supabase April 2026 table exposure change.
- Add admin role assignment audit flow.

Acceptance criteria:

- Regular authenticated users cannot read admin-only application rows, prompt templates, AI drafts, or audit logs.
- Admin role assignments are not writable by regular users.
- Supabase `db lint --local` passes.
- Role assignment/revocation writes audit logs.

### Epic BE-02: Application Intake + Moderation Backend

Goal: make community registration operational and safe.

Tasks:

- Keep `POST /api/applications` rate limiting covered by tests.
- Add optional duplicate handling by email/event/city. Done in `src/app/api/applications/route.ts`.
- Add admin list query with filters: status, city, event, date, selected topic. Done in `src/features/community/api/moderation.ts`.
- Add application detail query. Done in `src/features/community/api/moderation.ts`.
- Add audited status transition action for curator/admin/super_admin. Done in `src/features/community/api/moderation.ts`.
- Add decision reason, reviewer, reviewed timestamp, and optional notification trigger. Decision reason is audit metadata; reviewer/timestamp are stored; notification trigger is skipped by owner request.
- Wire admin UI or JSON routes to the backend helpers. UI is wired in `/admin/applications`; separate JSON route is not implemented.

Acceptance criteria:

- Public application route rejects abusive request bursts.
- Curator/admin can change status only through `requireAdminRole(APPLICATION_MODERATION_ROLES)`.
- Every status transition writes `admin.application_status_changed` audit log.
- Regular member cannot moderate another user's application.

### Epic BE-03: Admin API + Response Contract Standardization

Goal: give frontend/admin code predictable backend behavior.

Tasks:

- Introduce shared JSON response helpers for Route Handlers.
- Replace redirects inside API routes with JSON `401` where route is API-only. Done for `/api/orgs`.
- Normalize validation errors with Zod issue summaries. Done for helper + `/api/orgs`.
- Add request ID support in responses and logs. Done for standardized API helpers/routes.
- Decide whether public APIs use page/limit or cursor; update docs and code consistently. Done for current public archive docs/code.

Acceptance criteria:

- API routes consistently return `{ ok: true, data }` or `{ ok: false, error }`.
- API consumers never receive HTML/login redirects for JSON endpoints.
- Route tests cover unauthenticated, invalid input, not found, and success cases.

Current implementation:

- `src/lib/api-response.ts` centralizes success/error/validation/unauthorized responses.
- `src/lib/api-auth.ts` gives API routes a non-redirecting Supabase user check.
- Standardized API responses include `requestId` and `X-Request-Id`; safe inbound `x-request-id` values are preserved, otherwise a UUID is generated.
- Public archive, public applications, cron, and org routes use shared helpers.
- Payment routes were removed from product scope and are not part of BE-03.

### Epic BE-04: Brain Adapter + Projection Sync

Goal: connect app backend to deployed Brain safely.

Tasks:

- Confirm live Brain project/slug and scoped token.
- Wire deployed Brain C2-C10 contracts into `src/lib/brain`.
- Add timeout/retry/circuit-breaker behavior to Brain HTTP calls.
- Build manual republish server action from Brain node to `node_projection`.
- Add stale projection detection and repair flow.
- Add audit logs for create/update/merge/republish.

Acceptance criteria:

- Public pages never call live Brain.
- Editor/admin can republish one node into App DB projection.
- Brain outage returns controlled admin errors and does not break published public pages.
- Adapter tests cover all wired C1-C10 contracts.

### Epic BE-05: AI Content + PDF Generation Backend

Goal: generate source-first dossiers and PDF presentations.

Tasks:

- Add prompt template read/write actions guarded by editor/admin role.
- Add generation job creation for dossier and presentation.
- Add provider abstraction for model calls without leaking API keys.
- Add slide-level source-first validation.
- Add PDF renderer/export pipeline and artifact storage policy.
- Add cost/rate limits and retry/cancel flow.

Acceptance criteria:

- Presentation prompt `presentation_pdf` is editable and versioned through admin.
- Generation creates `ai_jobs` and draft rows.
- Publishing/export is blocked when any block/slide lacks `source_refs`.
- Export artifact is PDF, not PPTX.

### Epic BE-06: Member Cabinet Backend

Goal: support a registered community member account area.

Tasks:

- Define member status and consent model.
- Add user-facing application status query.
- Add event registration model if event participation is in MVP.
- Add saved topics/material access model.
- Add privacy/export/delete request entry points.
- Add provider-neutral notification preferences only if notifications are re-approved.

Acceptance criteria:

- Member can read only their own application/member state.
- Admin decisions change member access in a testable way.
- Consent state is stored and auditable.

### Epic BE-07: Integrations + API Control Plane

Goal: make external dependencies observable and controllable without exposing secrets.

Tasks:

- Add read-only readiness checks for Supabase, Brain, Vercel env, AI providers, PostHog, and Sentry.
- Add masked integration status model.
- Add webhook delivery log and retry/dead-letter design.
- Wire `verifyApiKey()` into first real external API route or remove user-facing API key feature from MVP.
- Add API usage counters/rate limits.

Acceptance criteria:

- Admin sees configured/missing/healthy/error without raw secrets.
- Webhook failures are visible.
- API key usage updates are tested.
- No secret values are returned by any admin API.

### Epic BE-08: Payment Surface Removed

Goal: keep payment, billing, subscription, and paid entitlement features out of the product unless a new owner-approved architecture decision is created.

Tasks:

- Keep Stripe env vars, routes, dependency, pricing page, billing/usage pages, and plan gates absent.
- Keep `20260617124704_remove_payment_schema.sql` in the migration chain so legacy DB subscription fields/tables are removed.
- Reject future tasks that reintroduce payment code without a new explicit decision.

Acceptance criteria:

- Runtime code has no payment provider dependency.
- There are no user-facing checkout, pricing, billing, or subscription screens.
- Documentation names payments as out of scope, not as a pending setup task.

### Epic BE-09: Observability + Operations

Goal: make backend failures diagnosable before production.

Tasks:

- Add `/api/health/ready` or admin readiness route for DB/Brain/email/storage checks.
- Add structured logs with request IDs.
- Add Sentry server instrumentation if production env is configured.
- Add runbooks for Brain outage, failed generation, failed webhook, spam attack, and migration rollback.
- Add retention/cleanup jobs for applications, audit logs, AI jobs, and generated artifacts.

Acceptance criteria:

- Operators can distinguish deploy health from dependency readiness.
- Critical backend errors include request/action context.
- Scheduled cleanup is documented and covered by tests.

### Epic BE-10: Backend Test + Release Infrastructure

Goal: prevent backend regressions as Codex continues implementation.

Tasks:

- Add local Supabase test workflow for migrations + RLS.
- Add E2E smoke tests for auth, public archive, application submit, admin RBAC, and cron auth.
- Add contract tests for route response envelopes.
- Add seed fixtures for topics, sources, applications, roles, prompt templates.
- Add CI step for `supabase db lint --local` or equivalent when local DB is available.

Acceptance criteria:

- Backend changes cannot merge without lint/typecheck/unit tests.
- RLS tests prove cross-user and non-admin access is denied.
- Seed data can recreate a demo backend locally.

## Suggested Implementation Order

1. BE-00 Backend Audit / Docs Sync.
2. BE-01 Supabase Security Hardening.
3. BE-02 Application Intake + Moderation Backend.
4. BE-03 Admin API + Response Contract Standardization.
5. BE-04 Brain Adapter + Projection Sync.
6. BE-05 AI Content + PDF Generation Backend.
7. BE-06 Member Cabinet Backend.
8. BE-07 Integrations + API Control Plane.
9. BE-08 Payment Surface Removed.
10. BE-09 Observability + Operations.
11. BE-10 Backend Test + Release Infrastructure.

## Immediate Next Task

BE-00, BE-02, and the first BE-03 response-helper slice are complete. Continue with:

1. Add remaining API contract tests for any standardized route gaps.
2. Continue admin/backend epics without reintroducing payment scope.
3. Move to BE-04 only after live Brain access/deployed C2-C10 contracts are available.

This sequence reduces abuse/security risk before adding more admin write actions.
