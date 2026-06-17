# Admin Console

## Status

First safe shell is implemented in `/admin` and guarded by
`admin_role_assignments`.

The shell is intentionally read-only/product-planning oriented: it requires a
valid user session and an assigned admin role, but it does not expose admin data
mutations yet. Real moderation, Brain writes, prompt edits, PDF generation, API
key operations, and secret-related settings require domain-specific server
actions with audit logs.

## Goal

The admin console is the operational cockpit for Тайное Бюро:

- register and review people joining the community;
- manage generated PDF presentations and editable prompts;
- monitor API/service connections without exposing secrets;
- operate the registered member cabinet;
- run knowledge/Brain workflows safely;
- configure roles, audit, content policy, feature flags, legal text, and backups.

## Principles

1. Admin mutations require explicit role checks, RLS coverage, and audit logs.
2. Public archive pages keep reading App DB projection, never live Brain.
3. Secrets are never rendered in UI; admin screens show only configured/missing/masked status.
4. Generated dossiers and presentations stay source-first: every block/slide needs `source_refs`.
5. Presentation output for MVP is PDF, not PPTX.
6. Presentation prompt is admin-editable and must be versioned.
7. Checkout, billing, subscriptions, and paid entitlements are not part of the product.

## Modules

| Module             | What It Does                                                                          | Current Status | Main Dependencies                                  |
| ------------------ | ------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------- |
| Admin Overview     | Shows workstreams, blockers, readiness, and "forgotten" risks.                        | Shell ready    | None beyond auth session                           |
| Applications       | Reviews community registrations and event applications.                               | UI ready       | notifications, retention policy                    |
| PDF Presentations  | Tracks generated PDFs, slide/source validation, prompt versions, exports.             | Planned        | model/provider, PDF renderer, prompt editor action |
| API / Integrations | Shows Brain/Supabase/Resend/Vercel/PostHog/Sentry readiness and webhooks.             | Planned        | safe readiness helpers, no secret exposure         |
| Community Cabinet  | Defines registered user profile, application status, events, saved archive materials. | Planned        | member state schema, RLS, notifications            |
| Knowledge Ops      | Runs Brain authoring, ingest/review, merge, and manual republish.                     | Blocked        | live Brain project/token, deployed C1-C10, RBAC    |
| Settings           | Manages roles, prompts, audit, legal, feature flags, backups, incident mode.          | Planned        | RBAC schema, audit table/helper, owner decisions   |

## Applications Functionality

- Application list with filters by status, city, event, selected topic, date, curator, and source.
- Application detail card: full name, email, Telegram, motivation, city, event, consent state, timeline.
- Status pipeline: `new`, `in_review`, `approved`, `rejected`, `waitlisted`.
- Decision reason is stored in audit metadata; moderator notes, next follow-up date, and assigned curator need a future schema decision.
- Email/notification actions after Resend/notification setup.
- Duplicate public submissions are skipped by normalized email + city + event without revealing whether a prior application exists.
- CSV export for operational handoff.
- Anti-spam/rate-limit visibility for the public application route.
- Audit log for every status or personal-data change.

## PDF Presentation Functionality

- Registry of generated PDF presentations by topic, author, status, version, and created date.
- Slide-level review with title, body, speaker notes, visual guidance, and `source_refs`.
- Admin-editable `presentation_pdf` prompt with version history.
- Regenerate flow that creates a new draft linked to `parent_version`.
- Publish gate that blocks source-less slides.
- Export/download PDF artifacts.
- Job log: provider, duration, retry count, error, cost estimate, and output artifact.

Current prompt schema:

- `ai_prompt_templates`
- `prompt_type`: `presentation_pdf`, `dossier`, `speech`
- `version`
- `title`
- `body`
- `is_active`
- `created_by`
- `created_at`
- `updated_at`

## API / Integrations Functionality

- Brain readiness: configured project/slug, token present, last successful adapter check.
- Supabase readiness: project connected, migrations applied, typegen current.
- Resend readiness: sender domain, templates, last delivery error.
- Vercel readiness: environment variables present, deployment target, build health.
- PostHog/analytics readiness: client key presence and event flow.
- Sentry readiness: DSN status and latest production issues summary.
- Webhook health: last success, last failure, retry/dead-letter state.
- User API keys: prefix, owner, last used, expiration, revocation; never raw keys.
- Internal service credentials: only masked status and rotation metadata.

## Registered Member Cabinet

The registered community member should eventually see:

- profile: name, email, Telegram, city, interests, privacy preferences;
- application status and next steps;
- event registrations and attendance history;
- saved topics and archive collections;
- published PDF presentations and closed community materials they can access;
- notifications and digest preferences;
- consent management: privacy, communications, photo/video;
- data export/delete request entry point.

## Settings

- Role matrix: `super_admin`, `admin`, `editor`, `curator`, `support`, `viewer`.
- Feature flags: applications, public map, PDF generation, Brain ingest, community cabinet.
- Prompt templates: presentation PDF, dossier, summaries, event copy.
- Content policy: source-first rules, publication rules, editorial checklist.
- Legal text: privacy policy links, consent text, disclaimers, data retention periods.
- Audit explorer: actor, action, entity, before/after, request id, timestamp.
- Backups/export: applications, members, prompts, generated artifacts, audit logs.
- Incident mode: temporarily disable generation, ingest, public applications, or exports.

## What Was Easy To Forget

- Admin RBAC must be real, not just "logged in".
- RLS must prevent regular users from reading applications and generated drafts.
- Every admin mutation must write audit logs.
- Prompt editing needs versions, approvals, rollback, and "which prompt generated this PDF".
- Generated content needs cost controls and retry limits.
- Public users need consent/privacy flows before community operations scale.
- API screens must not leak secrets.
- Search and filters are not optional once there are dozens of applications or PDFs.
- Incident mode and operational runbooks save time when Brain/model/provider is down.
- Backups and exports should be planned before launch, not after the first panic.

## Epic Decomposition

### Epic A: Admin RBAC + Audit Foundation

Goal: make the admin surface safe for real data.

Acceptance criteria:

- roles are stored in App DB or a clearly approved auth metadata strategy;
- admin RLS policies exist for applications, prompts, generated artifacts, and audit logs;
- `requireAdminRole()` or equivalent server-only helper exists;
- every mutation writes an audit record;
- tests prove regular authenticated users cannot use admin mutations.

Status: foundation implemented; domain-specific write actions are still pending.

### Epic B: Applications Operations

Goal: let curators process people registering for the community.

Acceptance criteria:

- admin can list and filter applications;
- admin can open one application detail page;
- curator/admin can change status with a decision reason;
- user receives a notification after decision once email is configured;
- all changes are auditable.

Current implemented slice:

- `src/features/community/api/moderation.ts` exposes list/detail/status transition helpers.
- `/admin/applications` lists, filters, and renders application detail cards.
- Status transitions require `requireAdminRole(APPLICATION_MODERATION_ROLES)`.
- Status transitions update `status`, `reviewed_by`, `reviewed_at`, and write `admin.application_status_changed`.
- Duplicate handling is implemented; notifications and optional curator notes are still pending.

### Epic C: Prompt Templates + PDF Presentations

Goal: generate and manage source-first PDF presentations.

Acceptance criteria:

- `presentation_pdf` prompt is editable in admin and versioned;
- generation creates an `ai_jobs` row and draft presentation;
- source-first validator blocks slides without `source_refs`;
- export produces a PDF artifact;
- previous versions remain accessible.

### Epic D: API / Integration Control Plane

Goal: show operational readiness without leaking secrets.

Acceptance criteria:

- service cards show configured/missing/healthy/error status;
- no raw token or key values are rendered;
- webhook and job errors are visible;
- key rotation is logged;
- runbooks link from each integration.

### Epic E: Member Cabinet

Goal: give registered community members a useful account area.

Acceptance criteria:

- user can see their application status;
- user can manage profile and consent settings;
- user can see available events and materials;
- RLS prevents access to another member's data;
- admin decisions change what the member can access.

### Epic F: Knowledge Ops

Goal: connect admin authoring to Brain and projection.

Acceptance criteria:

- admin/editor can create or update knowledge through the server-only Brain adapter;
- ingest/review works with `source_studies_archive`;
- manual republish updates `node_projection`;
- stale projection and broken source references are visible;
- public pages remain available during Brain outage.

## Current Safe Next Step

Move to BE-03 API contract standardization. Optional Resend notification work and BE-01
Supabase RLS/security-definer hardening are intentionally skipped for now by owner request, but
BE-01 is still needed before production.
