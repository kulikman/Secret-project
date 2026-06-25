-- Editable hotspot/reference cluster registry for the Awakening Map.
--
-- The public UI can keep using the static in-repo taxonomy as a fallback, but
-- this table is the App DB read model for moderated hotspot bounds, labels, and
-- matching metadata once admins start curating sectors from the console.

create table if not exists public.awakening_reference_clusters (
  id                  text primary key,
  group_id            text not null check (
    group_id in (
      'metaphysics',
      'spiritual-practice',
      'psychedelics',
      'galactic-federations',
      'ancient-civilizations',
      'secret-space-program',
      'hidden-infrastructure',
      'earth-conspiracy',
      'suppressed-science'
    )
  ),
  label               text not null check (char_length(label) > 0),
  summary             text not null check (char_length(summary) between 1 and 320),
  bounds              jsonb not null,
  key_topics          jsonb not null default '[]',
  keywords            jsonb not null default '[]',
  matcher             jsonb not null default '{"slugExact":[],"titleIncludes":[]}',
  related_cluster_ids jsonb not null default '[]',
  status              text not null default 'review' check (
    status in ('draft', 'review', 'published', 'archived')
  ),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint awakening_reference_clusters_bounds_object
    check (jsonb_typeof(bounds) = 'object'),
  constraint awakening_reference_clusters_key_topics_array
    check (jsonb_typeof(key_topics) = 'array' and jsonb_array_length(key_topics) between 2 and 6),
  constraint awakening_reference_clusters_keywords_array
    check (jsonb_typeof(keywords) = 'array' and jsonb_array_length(keywords) >= 1),
  constraint awakening_reference_clusters_matcher_object
    check (jsonb_typeof(matcher) = 'object'),
  constraint awakening_reference_clusters_related_array
    check (jsonb_typeof(related_cluster_ids) = 'array')
);

create trigger awakening_reference_clusters_set_updated_at
  before update on public.awakening_reference_clusters
  for each row execute function public.set_updated_at();

create index if not exists awakening_reference_clusters_status_idx
  on public.awakening_reference_clusters(status, group_id);

alter table public.awakening_reference_clusters enable row level security;

grant select on table public.awakening_reference_clusters to anon, authenticated;
grant select, insert, update, delete on table public.awakening_reference_clusters to service_role;

create policy "Published awakening reference clusters are publicly readable"
  on public.awakening_reference_clusters for select
  to anon, authenticated
  using (status = 'published');

-- No user-facing INSERT/UPDATE/DELETE policies.
-- Admin mutations should write through trusted service-role server actions.
