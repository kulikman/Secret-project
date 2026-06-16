-- 0010_secret_bureau_ai_content.sql
-- App-owned AI content pipeline tables.
--
-- This migration stores generated/reviewed artifacts and job state only.
-- It does not call model providers and does not change auth/billing logic.

create table if not exists public.dossiers (
  id              uuid primary key default gen_random_uuid(),
  topic_node_id   text not null,
  status          text not null default 'draft' check (
    status in ('draft', 'review', 'needs_source', 'published', 'archived')
  ),
  raw_output      jsonb not null default '{}',
  edited_content  jsonb not null default '{}',
  source_refs     jsonb not null default '[]',
  parent_version  uuid references public.dossiers(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint dossiers_raw_output_is_object
    check (jsonb_typeof(raw_output) = 'object'),
  constraint dossiers_edited_content_is_object
    check (jsonb_typeof(edited_content) = 'object'),
  constraint dossiers_source_refs_is_array
    check (jsonb_typeof(source_refs) = 'array')
);

create trigger dossiers_set_updated_at
  before update on public.dossiers
  for each row execute function public.set_updated_at();

create index if not exists dossiers_topic_status_idx
  on public.dossiers(topic_node_id, status);

create index if not exists dossiers_parent_version_idx
  on public.dossiers(parent_version)
  where parent_version is not null;

create table if not exists public.presentations (
  id              uuid primary key default gen_random_uuid(),
  topic_node_id   text not null,
  dossier_id      uuid references public.dossiers(id) on delete set null,
  status          text not null default 'draft' check (
    status in ('draft', 'review', 'needs_source', 'published', 'archived')
  ),
  title           text not null check (char_length(title) > 0),
  parent_version  uuid references public.presentations(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger presentations_set_updated_at
  before update on public.presentations
  for each row execute function public.set_updated_at();

create index if not exists presentations_topic_status_idx
  on public.presentations(topic_node_id, status);

create index if not exists presentations_dossier_id_idx
  on public.presentations(dossier_id)
  where dossier_id is not null;

create table if not exists public.slides (
  id               uuid primary key default gen_random_uuid(),
  presentation_id  uuid not null references public.presentations(id) on delete cascade,
  position         integer not null check (position > 0),
  title            text not null check (char_length(title) > 0),
  body             jsonb not null default '{}',
  speaker_notes    text,
  source_refs      jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint slides_body_is_object
    check (jsonb_typeof(body) = 'object'),
  constraint slides_source_refs_is_array
    check (jsonb_typeof(source_refs) = 'array'),
  constraint slides_position_unique
    unique (presentation_id, position)
);

create trigger slides_set_updated_at
  before update on public.slides
  for each row execute function public.set_updated_at();

create table if not exists public.ai_jobs (
  id              uuid primary key default gen_random_uuid(),
  job_type        text not null check (
    job_type in ('dossier_generation', 'presentation_generation', 'speech_generation')
  ),
  topic_node_id   text,
  status          text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'canceled')
  ),
  input           jsonb not null default '{}',
  output          jsonb not null default '{}',
  error           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint ai_jobs_input_is_object
    check (jsonb_typeof(input) = 'object'),
  constraint ai_jobs_output_is_object
    check (jsonb_typeof(output) = 'object')
);

create trigger ai_jobs_set_updated_at
  before update on public.ai_jobs
  for each row execute function public.set_updated_at();

create index if not exists ai_jobs_type_status_idx
  on public.ai_jobs(job_type, status);

create index if not exists ai_jobs_topic_node_id_idx
  on public.ai_jobs(topic_node_id)
  where topic_node_id is not null;

alter table public.dossiers enable row level security;
alter table public.presentations enable row level security;
alter table public.slides enable row level security;
alter table public.ai_jobs enable row level security;

grant select, insert, update, delete on table
  public.dossiers,
  public.presentations,
  public.slides,
  public.ai_jobs
to service_role;

-- No anon/authenticated policies yet.
-- Admin/editor access requires an approved RBAC migration and server actions.
