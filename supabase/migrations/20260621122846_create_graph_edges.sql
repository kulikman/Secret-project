-- Explicit public graph edge read model for Awakening Map.
--
-- Brain remains the knowledge source of truth. This table stores moderated,
-- publishable relation snapshots between public node_projection rows so the
-- map can render stable edges without parsing every node JSON payload.

create table if not exists public.graph_edges (
  id             uuid primary key default gen_random_uuid(),
  from_node_id   uuid not null references public.node_projection(id) on delete cascade,
  to_node_id     uuid not null references public.node_projection(id) on delete cascade,
  relation_type  text not null check (
    relation_type in (
      'related_to',
      'supported_by',
      'disputed_by',
      'mentions',
      'authored_by',
      'participated_in',
      'occurred_at',
      'belongs_to',
      'derived_from',
      'contradicts',
      'expands'
    )
  ),
  strength       numeric(3, 2) not null default 1.00 check (
    strength >= 0 and strength <= 1
  ),
  source_refs    jsonb not null default '[]',
  status         text not null default 'draft' check (
    status in ('draft', 'review', 'published', 'archived')
  ),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint graph_edges_distinct_nodes
    check (from_node_id <> to_node_id),
  constraint graph_edges_source_refs_is_array
    check (jsonb_typeof(source_refs) = 'array')
);

create trigger graph_edges_set_updated_at
  before update on public.graph_edges
  for each row execute function public.set_updated_at();

create index if not exists graph_edges_from_status_idx
  on public.graph_edges(status, from_node_id, to_node_id);

create index if not exists graph_edges_to_status_idx
  on public.graph_edges(status, to_node_id, from_node_id);

create index if not exists graph_edges_relation_status_idx
  on public.graph_edges(status, relation_type);

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.graph_edges enable row level security;

-- Supabase Data API access requires both grants and RLS policies.
grant select on table public.graph_edges to anon, authenticated;
grant select, insert, update, delete on table public.graph_edges to service_role;

-- Published graph edges are visible only when both endpoint snapshots are public.
create policy "Published graph edges are publicly readable"
  on public.graph_edges for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.node_projection as from_node
      where from_node.id = graph_edges.from_node_id
        and from_node.status = 'published'
    )
    and exists (
      select 1
      from public.node_projection as to_node
      where to_node.id = graph_edges.to_node_id
        and to_node.status = 'published'
    )
  );

-- No user-facing INSERT/UPDATE/DELETE policies.
-- Republish jobs should write through trusted service-role server code.
