# API Contracts

## Architecture Note

Тайное Бюро uses Server Actions for authenticated mutations and Route Handlers for public reads, external callbacks, cron jobs, and future internal webhooks.

Current implementation status:

- Existing scaffold routes for auth, Stripe, health, and cron remain unchanged.
- Secret Bureau public archive read routes for topics/sources are implemented.
- Secret Bureau admin/community routes below are target contracts until implemented.
- Public archive routes must read App DB projection, not Brain.

---

## Response Format

Success:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{ "ok": false, "error": "Human-readable message" }
```

---

## Public Archive Routes

### GET /api/topics

**Auth:** public

Reads published topic rows from `node_projection`.

Query params:

- `cursor`
- `limit`
- `q`

Response:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "pagination": { "cursor": null, "hasMore": false }
  }
}
```

### GET /api/topics/:slug

**Auth:** public

Reads one published topic projection by slug.

Response:

```json
{
  "ok": true,
  "data": {
    "topic": {},
    "related": [],
    "sources": []
  }
}
```

### GET /api/sources/:id

**Auth:** public

Reads one published source projection by App DB id or Brain node id, depending on implementation.

### GET /api/map/graph

**Auth:** public

Reads graph cache/projection, not live Brain.

Query params:

- `root`
- `depth`

If Brain graph subset support is missing, this route must return cached App DB data or a graceful unavailable state.

---

## Admin Knowledge Actions

Admin routes require authenticated editor/admin/super_admin access and audit logging.

### POST /api/admin/nodes

Creates a knowledge node through the current `src/lib/brain` create-node adapter shape.

MVP adapter support:

- Supported now: label/category/summary create via reviewed Brain HTTP route.
- Not supported yet: arbitrary payload/namespace semantics from the original architecture.

### PATCH /api/admin/nodes/:id

Updates a Brain node.

Status: blocked until local Brain C2 update contract is deployed/released and adapter-wired.

### POST /api/admin/edges

Creates a typed edge between Brain nodes.

Status: blocked until local Brain C3 edge create contract is deployed/released and adapter-wired.

### POST /api/admin/nodes/merge

Merges duplicate nodes into a primary node.

MVP adapter behavior:

- Loops the deployed Brain single-duplicate merge endpoint.
- Local Brain C8 bulk merge can replace this implementation after deployment/release and adapter wiring.

### POST /api/admin/sources/ingest

Starts source ingest.

Status:

- Generic Brain ingest exists.
- Local Brain C9 `source_studies_archive` profile exists, but app consumption is blocked until deployment/release and adapter wiring.

### POST /api/admin/nodes/:id/republish

Fetches approved Brain node data and upserts `node_projection`.

Status:

- Planned MVP sync path.
- Blocked until local Brain C4 `getNode` is deployed/released and adapter-wired, or an approved temporary workaround is used.

---

## AI Content Actions

### POST /api/admin/topics/:nodeId/generate-dossier

Creates an `ai_jobs` row and generates a dossier draft.

Required invariant:

- Every generated content block must contain non-empty `source_refs`.

### POST /api/admin/topics/:nodeId/generate-presentation

Creates a PDF presentation draft from a reviewed dossier or topic projection.

Prompt rule:

- The presentation prompt is admin-editable and should be loaded from
  `ai_prompt_templates` using `prompt_type = 'presentation_pdf'`.

### PATCH /api/admin/dossiers/:id

Stores editor changes in `edited_content`.

### POST /api/admin/dossiers/:id/publish

Publishes a reviewed dossier version if source validation passes.

### POST /api/admin/presentations/:id/export

Exports presentation artifacts as PDF.

Status: future route; exact PDF renderer is not selected yet.

---

## Community Routes

### GET /api/bureau/cities

**Auth:** public

Returns active bureau cities.

### GET /api/events

**Auth:** public

Returns published upcoming events.

### POST /api/applications

**Auth:** public or authenticated

Creates a join/event application after Zod validation and rate limiting.

Request:

```json
{
  "fullName": "Иван Иванов",
  "email": "ivan@example.com",
  "telegram": "@ivan",
  "cityId": "uuid",
  "eventId": "uuid",
  "motivation": "Почему хочу участвовать",
  "selectedTopic": "topic"
}
```

### PATCH /api/admin/applications/:id

**Auth:** curator/admin/super_admin

Changes application status and writes audit log.

---

## Internal / External Callbacks

### POST /api/webhooks/stripe

Existing scaffold route.

**Auth:** Stripe signature verification.

Handled events remain owned by the billing scaffold.

### GET /api/cron/cleanup

Existing scaffold route.

**Auth:** `Authorization: Bearer ${CRON_SECRET}`.

### POST /api/internal/brain-webhook

Future route for Brain `node.updated` / `node.merged` events.

Status: not implemented. MVP uses manual republish instead.

---

## Updating Contracts

When adding or changing a Route Handler or Server Action:

1. Document method, path, auth, request, response, and errors here.
2. Add Zod validation close to the handler/action.
3. Add or update colocated tests.
4. Confirm whether the route reads Brain, App DB, or projection cache.
5. Run lint, typecheck, tests, and the epic hallucination/dependency check.
