-- 0009_secret_bureau_node_projection.sql
-- App DB read model for public Secret Bureau archive pages.
--
-- Brain remains the knowledge source of truth. This table stores renderable
-- snapshots so public pages can stay available when Brain is degraded.

create table if not exists public.node_projection (
  id             uuid primary key default gen_random_uuid(),
  brain_node_id  text not null unique,
  node_type      text not null check (
    node_type in ('topic', 'source', 'claim', 'person', 'organization', 'event', 'tag')
  ),
  slug           text unique,
  title          text not null check (char_length(title) > 0),
  summary        text,
  content        jsonb not null default '{}',
  status         text not null default 'draft' check (
    status in ('draft', 'review', 'published', 'archived')
  ),
  credibility    text check (credibility is null or credibility in ('A', 'B', 'C', 'D')),
  claim_status   text check (
    claim_status is null
    or claim_status in ('supported', 'disputed', 'weak', 'unknown', 'needs_source')
  ),
  source_refs    jsonb not null default '[]',
  is_stale       boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint node_projection_content_is_object
    check (jsonb_typeof(content) = 'object'),
  constraint node_projection_source_refs_is_array
    check (jsonb_typeof(source_refs) = 'array'),
  constraint node_projection_public_slug_required
    check (
      status <> 'published'
      or node_type not in ('topic', 'source')
      or slug is not null
    )
);

create trigger node_projection_set_updated_at
  before update on public.node_projection
  for each row execute function public.set_updated_at();

create index if not exists node_projection_type_status_idx
  on public.node_projection(node_type, status);

create index if not exists node_projection_slug_idx
  on public.node_projection(slug)
  where slug is not null;

create index if not exists node_projection_published_at_idx
  on public.node_projection(published_at desc)
  where status = 'published';

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.node_projection enable row level security;

-- Supabase Data API access requires both grants and RLS policies.
grant select on table public.node_projection to anon, authenticated;

-- Published archive rows are public read models.
create policy "Published node projections are publicly readable"
  on public.node_projection for select
  to anon, authenticated
  using (status = 'published');

-- No user-facing INSERT/UPDATE/DELETE policies.
-- Republish jobs should write through trusted service-role server code.
