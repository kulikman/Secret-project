# Runbooks

## Brain Outage

Public archive behavior:

- `/`, `/topics`, `/topics/:slug`, and `/sources/:id` must not call live Brain.
- Existing published pages should continue reading `node_projection`.
- Admin ingest, authoring, graph exploration, and republish can be degraded.

Operator checks:

```bash
pnpm guardrails
pnpm test -- src/features/knowledge src/app/api/topics src/app/api/sources
```

If public archive pages fail during Brain outage, search for accidental Brain
imports in public routes/pages:

```bash
rg "@/lib/brain|BRAIN_API_KEY|createBrainArchiveAdapter" src/app src/features
```

## Projection Repair

MVP projection sync is manual republish.

When a published page is stale:

1. Confirm the Brain node exists and is approved.
2. Re-run manual republish after Brain `getNode` / approved workaround exists.
3. Update `node_projection.is_stale = false` only after the snapshot is refreshed.
4. Record the admin action in `audit_logs`.

Do not make public pages read live Brain as a shortcut.

## Source-First AI Content

Before publishing generated content:

```bash
pnpm test -- src/features/ai-content
```

Required invariant:

- Every generated document has top-level `source_refs`.
- Every generated block has non-empty `source_refs`.
- Regeneration creates a draft linked through `parent_version`.

Do not add model/provider calls until cost, retry, and source validation behavior
are explicitly designed.

Presentation output:

- Export format is PDF, not PPTX.
- The presentation prompt must be loaded from editable `ai_prompt_templates`
  using `prompt_type = 'presentation_pdf'`.

## Community Applications

Public application submission uses `POST /api/applications` and normal Supabase
RLS, not the service-role client.

Expected behavior:

- Anonymous/authenticated users can insert only `status = 'new'` applications.
- Public users cannot set `reviewed_by` or `reviewed_at`.
- Admin moderation requires a future approved RBAC/admin surface.

## Standard Verification

Run after every epic or significant task:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm guardrails
git diff --check
```
