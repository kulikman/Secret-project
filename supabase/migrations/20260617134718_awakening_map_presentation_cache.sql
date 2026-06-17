-- 20260617134718_awakening_map_presentation_cache.sql
-- Awakening Map topic suggestions and PDF presentation cache metadata.
--
-- This migration does not add model SDKs, secrets, billing, or auth changes.
-- Generation providers are stored as metadata so workers can be wired later
-- through audited server actions and environment-managed credentials.

create table if not exists public.awakening_topic_suggestions (
  id                          uuid primary key default gen_random_uuid(),
  title                       text not null check (char_length(title) > 1),
  slug                        text,
  summary                     text,
  description                 text,
  related_node_refs           jsonb not null default '[]',
  source_refs                 jsonb not null default '[]',
  status                      text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'merged')
  ),
  suggested_by                uuid references auth.users(id) on delete set null,
  reviewed_by                 uuid references auth.users(id) on delete set null,
  reviewed_at                 timestamptz,
  decision_reason             text,
  promoted_node_projection_id uuid references public.node_projection(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint awakening_topic_suggestions_slug_format
    check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint awakening_topic_suggestions_related_refs_is_array
    check (jsonb_typeof(related_node_refs) = 'array'),
  constraint awakening_topic_suggestions_source_refs_is_array
    check (jsonb_typeof(source_refs) = 'array')
);

create trigger awakening_topic_suggestions_set_updated_at
  before update on public.awakening_topic_suggestions
  for each row execute function public.set_updated_at();

create index if not exists awakening_topic_suggestions_status_created_idx
  on public.awakening_topic_suggestions(status, created_at desc);

create index if not exists awakening_topic_suggestions_suggested_by_idx
  on public.awakening_topic_suggestions(suggested_by)
  where suggested_by is not null;

create index if not exists awakening_topic_suggestions_promoted_projection_idx
  on public.awakening_topic_suggestions(promoted_node_projection_id)
  where promoted_node_projection_id is not null;

alter table public.awakening_topic_suggestions enable row level security;

grant insert on table public.awakening_topic_suggestions to anon;
grant select, insert, update on table public.awakening_topic_suggestions to authenticated;
grant select, insert, update, delete on table public.awakening_topic_suggestions to service_role;

create policy "Public can suggest awakening topics"
  on public.awakening_topic_suggestions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and decision_reason is null
    and promoted_node_projection_id is null
    and (
      (auth.role() = 'anon' and suggested_by is null)
      or (auth.role() = 'authenticated' and suggested_by = auth.uid())
    )
  );

create policy "Users can read own awakening topic suggestions"
  on public.awakening_topic_suggestions for select
  to authenticated
  using (suggested_by = auth.uid());

create policy "Editors can read awakening topic suggestions"
  on public.awakening_topic_suggestions for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor', 'curator')
    )
  );

create policy "Editors can review awakening topic suggestions"
  on public.awakening_topic_suggestions for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor', 'curator')
    )
  )
  with check (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor', 'curator')
    )
  );

alter table public.presentations
  add column if not exists page_count integer not null default 20,
  add column if not exists prompt_template_id uuid references public.ai_prompt_templates(id) on delete set null,
  add column if not exists prompt_template_version integer,
  add column if not exists text_provider text not null default 'anthropic_claude',
  add column if not exists text_model text,
  add column if not exists visual_provider text not null default 'visual_ai_pending',
  add column if not exists visual_model text,
  add column if not exists generation_input jsonb not null default '{}',
  add column if not exists narrative_text text,
  add column if not exists artifact_storage_path text,
  add column if not exists artifact_url text,
  add column if not exists artifact_mime_type text,
  add column if not exists cache_key text,
  add column if not exists generated_at timestamptz,
  add column if not exists exported_at timestamptz;

do $$
begin
  alter table public.presentations
    add constraint presentations_page_count_range
    check (page_count between 20 and 25);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.presentations
    add constraint presentations_generation_input_is_object
    check (jsonb_typeof(generation_input) = 'object');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.presentations
    add constraint presentations_artifact_pdf_only
    check (artifact_mime_type is null or artifact_mime_type = 'application/pdf');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.presentations
    add constraint presentations_cache_key_non_empty
    check (cache_key is null or char_length(cache_key) > 0);
exception
  when duplicate_object then null;
end $$;

create unique index if not exists presentations_cache_key_unique_idx
  on public.presentations(cache_key)
  where cache_key is not null;

create index if not exists presentations_artifact_download_idx
  on public.presentations(topic_node_id, generated_at desc)
  where artifact_storage_path is not null;

create index if not exists presentations_prompt_template_idx
  on public.presentations(prompt_template_id)
  where prompt_template_id is not null;

alter table public.slides
  add column if not exists layout jsonb not null default '{}',
  add column if not exists visual_prompt text,
  add column if not exists visual_asset jsonb not null default '{}';

do $$
begin
  alter table public.slides
    add constraint slides_layout_is_object
    check (jsonb_typeof(layout) = 'object');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.slides
    add constraint slides_visual_asset_is_object
    check (jsonb_typeof(visual_asset) = 'object');
exception
  when duplicate_object then null;
end $$;

alter table public.ai_jobs
  add column if not exists presentation_id uuid references public.presentations(id) on delete set null,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;

alter table public.ai_jobs
  drop constraint if exists ai_jobs_job_type_check;

alter table public.ai_jobs
  add constraint ai_jobs_job_type_check
  check (
    job_type in (
      'dossier_generation',
      'presentation_generation',
      'presentation_text_generation',
      'presentation_visual_generation',
      'presentation_pdf_export',
      'speech_generation'
    )
  );

create index if not exists ai_jobs_presentation_id_idx
  on public.ai_jobs(presentation_id)
  where presentation_id is not null;
