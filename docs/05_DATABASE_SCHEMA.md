# Database Schema

## Database

Supabase Postgres is the App DB for Тайное Бюро. Brain owns the live knowledge graph; App DB owns public read projections, generated content, community data, audit logs, auth profiles, and operational state.

**Rules:**

- Every App DB schema change requires a new migration in `supabase/migrations/`.
- Do not edit existing migrations in place.
- RLS must be enabled on every app-owned table.
- Regenerate TypeScript types after schema changes.
- Brain node ids are soft references (`text`), not foreign keys.

---

## Existing Scaffold Tables

These tables already exist in the template and remain part of the platform foundation:

- `profiles`: Supabase Auth profile extension. Does not store admin roles.
- `admin_role_assignments`: internal RBAC assignment table for admin/editor/curator/support/viewer roles.
- `orgs` and `org_members`: organization scaffold.
- `notifications`: in-app notification scaffold.
- `api_keys`: optional public API key scaffold.
- `audit_logs`: admin/system audit trail.

Prefer extending or reusing `profiles` and `audit_logs` instead of creating parallel `users` or `audit_log` tables.

Admin/editor RBAC uses `admin_role_assignments` instead of `profiles.role`
because profiles are broadly readable by authenticated users in the scaffold.
Only trusted service-role code should write role assignments.

Payment-related template schema was removed by
`supabase/migrations/20260617124704_remove_payment_schema.sql`: the final schema
does not include `public.subscriptions` or `profiles.stripe_customer_id`.

### admin_role_assignments

Stores one admin role per user.

Key fields:

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `role admin_role not null`
- `granted_by uuid references auth.users(id)`
- `reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

RLS:

- authenticated users can read only their own admin assignment;
- service role can write assignments;
- other admin tables use this table for read-policy checks.

---

## Secret Bureau Read Model

### node_projection

Public archive read model written by manual republish or future Brain webhook sync.

| Field         | Type        | Required | Notes                                                                                     |
| ------------- | ----------- | :------: | ----------------------------------------------------------------------------------------- |
| id            | uuid        |    ✅    | App DB primary key                                                                        |
| brain_node_id | text        |    ✅    | Unique soft reference to Brain node                                                       |
| node_type     | text        |    ✅    | `topic`, `source`, `claim`, `person`, `organization`, `event`, `tag`, `document`, `video` |
| slug          | text        |          | Public URL slug for topics/sources                                                        |
| title         | text        |    ✅    | Public title                                                                              |
| summary       | text        |          | Short public summary                                                                      |
| content       | jsonb       |    ✅    | Renderable snapshot, e.g. localized body/source refs                                      |
| status        | text        |    ✅    | `draft`, `review`, `published`, `archived`                                                |
| credibility   | text        |          | Source credibility, e.g. `A`, `B`, `C`, `D`                                               |
| claim_status  | text        |          | `supported`, `disputed`, `weak`, `unknown`, `needs_source`                                |
| source_refs   | jsonb       |    ✅    | Source/claim ids used by the published snapshot                                           |
| is_stale      | boolean     |    ✅    | Republish needed                                                                          |
| published_at  | timestamptz |          | First/latest publish time                                                                 |
| created_at    | timestamptz |    ✅    |                                                                                           |
| updated_at    | timestamptz |    ✅    |                                                                                           |

Recommended indexes:

```sql
CREATE UNIQUE INDEX idx_node_projection_brain_node_id ON public.node_projection(brain_node_id);
CREATE INDEX idx_node_projection_type_status ON public.node_projection(node_type, status);
CREATE INDEX idx_node_projection_slug ON public.node_projection(slug) WHERE slug IS NOT NULL;
```

### graph_edges

Explicit public edge read model for the Awakening Map. It stores moderated
relation snapshots between published `node_projection` rows while Brain remains
the source of truth.

| Field         | Type        | Required | Notes                                                                                                                                       |
| ------------- | ----------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| id            | uuid        |    ✅    | App DB primary key                                                                                                                          |
| from_node_id  | uuid        |    ✅    | FK to `node_projection.id`                                                                                                                  |
| to_node_id    | uuid        |    ✅    | FK to `node_projection.id`                                                                                                                  |
| relation_type | text        |    ✅    | `related_to`, `supported_by`, `disputed_by`, `mentions`, `authored_by`, `participated_in`, `occurred_at`, `belongs_to`, `derived_from`, `contradicts`, `expands` |
| strength      | numeric     |    ✅    | `0..1` confidence/weight for visual priority                                                                                                |
| source_refs   | jsonb       |    ✅    | Evidence refs for the edge itself                                                                                                           |
| status        | text        |    ✅    | `draft`, `review`, `published`, `archived`                                                                                                  |
| created_at    | timestamptz |    ✅    |                                                                                                                                             |
| updated_at    | timestamptz |    ✅    |                                                                                                                                             |

Recommended indexes:

```sql
CREATE INDEX graph_edges_from_status_idx ON public.graph_edges(status, from_node_id, to_node_id);
CREATE INDEX graph_edges_to_status_idx ON public.graph_edges(status, to_node_id, from_node_id);
CREATE INDEX graph_edges_relation_status_idx ON public.graph_edges(status, relation_type);
```

RLS:

- anon/authenticated can read only `published` edges;
- a published edge is visible only when both endpoint `node_projection` rows are also `published`;
- no public insert/update/delete policies;
- service-role server actions can write curated edge snapshots after RBAC/audit checks.

### awakening_topic_suggestions

Queue of new Awakening Map topic ideas submitted by users or admins. Public
submissions are never published directly; they remain `pending` until an admin
reviews them.

Key fields:

- `id uuid primary key`
- `title text not null`
- `slug text`
- `summary text`
- `description text`
- `related_node_refs jsonb not null default '[]'`
- `source_refs jsonb not null default '[]'`
- `status text not null default 'pending'`
- `suggested_by uuid references auth.users(id)`
- `reviewed_by uuid references auth.users(id)`
- `reviewed_at timestamptz`
- `decision_reason text`
- `promoted_node_projection_id uuid references node_projection(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

RLS:

- anon/authenticated can insert only `pending` suggestions;
- authenticated users can read their own suggestions;
- super_admin/admin/editor/curator can read and review suggestions;
- service role keeps full operational access for audited server actions.

---

## AI Content Tables

### dossiers

Stores versioned dossier drafts and reviewed/published content for a topic.

Key fields:

- `id uuid primary key`
- `topic_node_id text not null`
- `status text not null`
- `raw_output jsonb not null default '{}'`
- `edited_content jsonb not null default '{}'`
- `source_refs jsonb not null default '[]'`
- `parent_version uuid references dossiers(id)`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### presentations

Stores versioned presentation metadata linked to a topic and optional dossier.

Key fields:

- `id uuid primary key`
- `topic_node_id text not null`
- `dossier_id uuid references dossiers(id)`
- `status text not null`
- `title text not null`
- `page_count integer not null default 20` (`20..25`)
- `prompt_template_id uuid references ai_prompt_templates(id)`
- `prompt_template_version integer`
- `text_provider text not null default 'anthropic_claude'`
- `text_model text`
- `visual_provider text not null default 'visual_ai_pending'`
- `visual_model text`
- `generation_input jsonb not null default '{}'`
- `narrative_text text`
- `artifact_storage_path text`
- `artifact_url text`
- `artifact_mime_type text` (`application/pdf` when present)
- `cache_key text unique when present`
- `generated_at timestamptz`
- `exported_at timestamptz`
- `parent_version uuid references presentations(id)`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### slides

Stores individual slide content and speaker notes.

Key fields:

- `id uuid primary key`
- `presentation_id uuid not null references presentations(id) on delete cascade`
- `position integer not null`
- `title text not null`
- `body jsonb not null default '{}'`
- `speaker_notes text`
- `layout jsonb not null default '{}'`
- `visual_prompt text`
- `visual_asset jsonb not null default '{}'`
- `source_refs jsonb not null default '[]'`

### ai_jobs

Tracks generation jobs for dossiers, presentations, and speech assets.

Key fields:

- `id uuid primary key`
- `job_type text not null`
- `topic_node_id text`
- `presentation_id uuid references presentations(id)`
- `provider text`
- `model text`
- `status text not null`
- `input jsonb not null default '{}'`
- `output jsonb not null default '{}'`
- `error text`
- `started_at timestamptz`
- `finished_at timestamptz`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### ai_prompt_templates

Stores admin-editable prompt templates for generation flows.

Key fields:

- `id uuid primary key`
- `prompt_type text not null`
- `title text not null`
- `body text not null`
- `version integer not null`
- `is_active boolean not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Presentation generation uses `prompt_type = 'presentation_pdf'`.

---

## Community Tables

### bureau_cities

Cities where Тайное Бюро has community presence.

Key fields:

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `description text`
- `status text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### bureau_events

Public or member events linked to cities.

Key fields:

- `id uuid primary key`
- `city_id uuid references bureau_cities(id)`
- `slug text unique not null`
- `title text not null`
- `description text`
- `starts_at timestamptz`
- `status text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### applications

Join/event applications from visitors or authenticated users.

Key fields:

- `id uuid primary key`
- `user_id uuid references profiles(id)`
- `city_id uuid references bureau_cities(id)`
- `event_id uuid references bureau_events(id)`
- `full_name text not null`
- `email text not null`
- `telegram text`
- `motivation text`
- `selected_topic text`
- `status text not null`
- `reviewed_by uuid references profiles(id)`
- `reviewed_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### photo_reports

Published event/city photo reports.

Key fields:

- `id uuid primary key`
- `event_id uuid references bureau_events(id)`
- `city_id uuid references bureau_cities(id)`
- `title text not null`
- `body jsonb not null default '{}'`
- `media jsonb not null default '[]'`
- `status text not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

---

## Migration Workflow

```bash
pnpm supabase migration new create_secret_bureau_core_tables
pnpm supabase db reset
pnpm supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/database.ts
```
