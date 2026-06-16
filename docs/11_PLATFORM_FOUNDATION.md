# Platform Foundation

## Epic

Epic 1: Platform Foundation

## Date

2026-06-15

## Status

Done.

## Goal

Prepare the existing Next.js/Supabase template for Secret Bureau-specific
development without changing auth, billing, or payment behavior.

## Current Baseline

Already present in the repository:

- Next.js 16 App Router.
- React 19.2.
- TypeScript strict.
- Tailwind v4.
- Supabase clients and auth scaffold.
- Stripe billing scaffold.
- Zod env validation.
- `GET /api/health` stateless health endpoint.

## Brain Env Contract

Server-only variables:

```text
BRAIN_API_URL
BRAIN_API_KEY
BRAIN_PROJECT_ID
BRAIN_PROJECT_SLUG
```

Rules:

- `BRAIN_API_KEY` is never exposed in client env.
- If `BRAIN_API_KEY` is set, either `BRAIN_PROJECT_ID` or `BRAIN_PROJECT_SLUG`
  must also be set.
- If a Brain project binding is set, `BRAIN_API_KEY` must also be set.
- Recommended project slug: `secret-bureau-public-archive`.
- Token provisioning remains outside git and chat.

## App-Side Brain Adapter Plan

The app should not call `@elaurion/brain-sdk` directly from feature code.
Instead, create a server-only adapter that exposes Secret Bureau's required
capabilities and hides current Brain SDK/API mismatches.

Recommended location:

```text
src/lib/brain/
  client.ts
  adapter.ts
  types.ts
  projection.ts
```

Proposed adapter interface:

```ts
export interface BrainArchiveAdapter {
  createNode(input: ArchiveNodeCreateInput): Promise<ArchiveNode>;
  updateNode(nodeId: string, patch: ArchiveNodePatch): Promise<ArchiveNode>;
  createEdge(input: ArchiveEdgeCreateInput): Promise<ArchiveEdge>;
  getNode(nodeId: string): Promise<ArchiveNode>;
  semanticSearch(input: ArchiveSearchInput): Promise<ArchiveSearchResult[]>;
  getNeighbors(input: ArchiveNeighborsInput): Promise<ArchiveGraph>;
  getIntersections(input: ArchiveIntersectionsInput): Promise<ArchiveIntersection[]>;
  mergeNodes(input: ArchiveMergeInput): Promise<ArchiveMergeResult>;
  enqueueIngest(input: ArchiveIngestInput): Promise<ArchiveIngestJob>;
  getGraphSubset(input: ArchiveGraphSubsetInput): Promise<ArchiveGraph>;
}
```

Implementation phases:

- Phase 1: create adapter types and runtime guards.
- Phase 2: wrap real SDK methods that exist today: `ingest`, `getNodes`,
  `getGraph`, `mergeNodes`, `getContext`.
- Phase 3: add explicit `not implemented` errors for missing capabilities so
  admin routes fail clearly instead of silently drifting.
- Phase 4: replace temporary gaps as local Brain-side endpoints are
  deployed/released and adapter-wired.

Security rules:

- Adapter imports must be server-only.
- No Brain token can be read in Client Components.
- Public routes must read App DB projection, not live Brain.
- Admin routes may call adapter only after auth/RBAC checks.

## Brain Adapter Skeleton

Implemented location:

```text
src/lib/brain/
  adapter.ts
  client.ts
  errors.ts
  index.ts
  types.ts
```

Current wrapped Brain capabilities:

- `createNode` wraps `POST /api/v1/brain/:pid/nodes`.
- `listNodes` wraps `GET /api/v1/brain/:pid/nodes`.
- `getRenderedContext` wraps `GET /api/v1/brain/:pid/context`.
- `mergeNodes` loops the deployed Brain single-duplicate merge endpoint; local Brain C8 bulk merge is pending deployment/release and adapter wiring.
- `enqueueIngest` wraps generic ingest only when no profile is requested.
- `getFullGraph` wraps `GET /api/v1/brain/:pid/graph`.

Current explicit typed gaps:

- `updateNode` until local Brain C2 is deployed/released and adapter-wired
- `createEdge` until local Brain C3 is deployed/released and adapter-wired
- `getNode` until local Brain C4 is deployed/released and adapter-wired
- `semanticSearch` until local Brain C5 is deployed/released and adapter-wired
- `getNeighbors` until local Brain C6 is deployed/released and adapter-wired
- `getIntersections` until local Brain C7 is deployed/released and adapter-wired
- `enqueueIngest(profile)` until local Brain C9 is deployed/released and the
  adapter is wired to pass the profile field
- `getGraphSubset` until local Brain C10 is deployed/released and the adapter is
  wired to the subgraph endpoint

Fact check:

- No `@elaurion/brain-sdk` dependency was added because it is not installed in
  this app.
- The adapter uses the real Brain HTTP contracts reviewed in
  `docs/10_BRAIN_DISCOVERY.md`.
- Unwired local Brain C2-C10 capabilities throw
  `BRAIN_CAPABILITY_NOT_IMPLEMENTED` instead of pretending the app adapter has
  already consumed deployed/released contracts.

Dependency check:

- No new runtime or dev dependencies were added.
- Brain token access remains server-only through `getServerEnv()`.

## Initial App DB Migration Plan

Do not edit existing template migrations in place. Add new migrations when
implementation starts.

First Secret Bureau migration group:

- `node_projection`
- `dossiers`
- `presentations`
- `slides`
- `ai_jobs`
- `bureau_cities`
- `bureau_events`
- `applications`
- `photo_reports`
- `audit_log` or align with existing `audit_logs`

Important open schema decision:

- The template already has `profiles`, `subscriptions`, `orgs`,
  `org_members`, `notifications`, `api_keys`, and `audit_logs`.
- The architecture document uses `users` and `audit_log`.
- Prefer adapting the product schema to existing `profiles` and `audit_logs`
  unless there is a strong reason to introduce parallel user/audit tables.

## API / Route Foundation

Keep mutations behind Server Actions or authenticated Route Handlers.

Initial app routes to document before implementation:

- `POST /api/admin/nodes/:id/republish`
- `GET /api/topics`
- `GET /api/topics/:slug`
- `GET /api/sources/:id`
- `GET /api/map/graph`
- `POST /api/applications`
- Future: `POST /api/internal/brain-webhook`

## Health / Readiness Plan

Current route:

- `GET /api/health`: stateless live check.

Recommended Secret Bureau split:

- `GET /health/live`: app process is alive, no external dependency checks.
- `GET /health/ready`: checks App DB and reports Brain availability.

Brain readiness rule:

- Brain unavailable means admin ingest/republish may be degraded.
- Brain unavailable must not make published public archive pages fail.
- `ready` can return degraded status while public SSR/ISR continues reading
  from App DB projection.

## Epic 1 Exit Criteria

- Brain env contract exists in app code and `.env.example`.
- App-side adapter plan is documented.
- Initial App DB migration direction is documented.
- Health/readiness behavior is documented.
- Auth/payment internals remain unchanged.

## Epic 1 Verification

Hallucination check:

- Brain adapter methods are split between reviewed existing Brain HTTP contracts
  and explicit `BRAIN_CAPABILITY_NOT_IMPLEMENTED` errors.
- Product docs mark planned routes/tables as target contracts, not implemented
  code.
- Live Brain project/token remains documented as blocked, not assumed.

Dependency check:

- No new runtime or dev dependencies were added.
- `@elaurion/brain-sdk` is not listed in `package.json`; the app uses a
  server-only HTTP adapter until a consumable SDK contract is available.
- Auth, payment, billing, CI, and `.env` secrets were not changed.
