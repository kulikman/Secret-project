# External Setup & Access

## Epic

Remaining Epic E1: External Setup & Access

## Status

Blocked on external credentials and project provisioning.

## Goal

Prepare all external systems needed for Тайное Бюро without committing secrets
or reusing private Founder OS Brain access.

---

## Required External Systems

### 1. Brain

Required:

- Dedicated Brain project or slug for public archive.
- Recommended slug: `secret-bureau-public-archive`.
- Scoped project key or writable agent key limited to that project.
- Confirmation whether the app should use `BRAIN_PROJECT_ID` or
  `BRAIN_PROJECT_SLUG`.
- Deployment or release of local Brain C1-C10 changes from
  `/Users/DEV/Elaurion-Brain`: SDK/API `createNode`, `getNode`, `updateNode`,
  `createEdge`, structured `semanticSearch`, bounded `getNeighbors`, and graph
  `getIntersections`, transactional bulk `mergeNodes`, and profiled
  `source_studies_archive` ingest, plus root/depth `getGraphSubset`.

Environment variables:

```text
BRAIN_API_URL
BRAIN_API_KEY
BRAIN_PROJECT_ID
BRAIN_PROJECT_SLUG
```

Rules:

- Do not paste `BRAIN_API_KEY` into docs, code, commits, or chat.
- Do not reuse private Founder OS tokens.
- Add the key through `.env.local` locally and Vercel env in deployment.

Verification after provisioning:

```bash
cd /Users/DEV/Elaurion-Brain
pnpm lint
pnpm typecheck
pnpm test

cd /Users/DEV/Secret-project
pnpm guardrails
pnpm test -- src/lib/brain
```

### 2. Supabase

Required:

- Supabase project for Тайное Бюро.
- Project URL.
- Anon key.
- Service role key.
- Linked local CLI project.
- Migrations applied.
- Types regenerated from the live project.

Environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID
```

Setup commands:

```bash
pnpm supabase link --project-ref <project-ref>
pnpm supabase db push
pnpm supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/database.ts
```

Supabase Data API note:

- Public read/insert tables include explicit `grant` statements plus RLS
  policies.
- This follows the current Supabase model where grants and RLS both matter.

### 3. Vercel

Required:

- Vercel project linked to repository.
- Environment variables copied into Preview and Production scopes.
- Production domain decided.

Verification:

```bash
pnpm build
```

### 4. Optional Integrations

Stripe, Resend, PostHog, and Sentry are scaffolded but not required for the
first archive smoke unless a release decision says otherwise.

---

## Presentation Clarification

Presentation output is PDF, not PPTX.

The presentation generation prompt must be editable in the admin surface. The
App DB contract for that is `ai_prompt_templates` with:

```text
prompt_type = 'presentation_pdf'
```

Admin UI and RBAC for editing this prompt are not implemented yet.

---

## Exit Criteria

- [ ] Brain project/slug exists.
- [ ] Scoped Brain token is provisioned only in env.
- [ ] Brain C1-C10 node/edge/search/neighbors/intersections/bulk-merge/profiled-ingest/subgraph changes are deployed or released for app use.
- [ ] Supabase project is linked.
- [ ] All migrations are applied.
- [ ] `src/types/database.ts` is regenerated from Supabase.
- [ ] Vercel project exists with required env vars.
- [ ] `pnpm build` passes with deployment env.
- [ ] No secret appears in git diff.

---

## Handoff Checklist For Codex

Before continuing to Epic E2/E4 implementation, verify:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm guardrails
git diff --check
```

If any external secret is missing, stop and ask the user to add it through the
appropriate local/Vercel environment UI. Never ask the user to paste secrets
into chat.
