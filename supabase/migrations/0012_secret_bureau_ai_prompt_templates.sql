-- 0012_secret_bureau_ai_prompt_templates.sql
-- Editable prompt templates for AI content generation.
--
-- Presentation prompts must be editable through a future admin surface. This
-- table stores the versioned prompt text; generation jobs should reference the
-- prompt version they used.

create table if not exists public.ai_prompt_templates (
  id          uuid primary key default gen_random_uuid(),
  prompt_type text not null check (
    prompt_type in ('dossier', 'presentation_pdf', 'speech')
  ),
  title       text not null check (char_length(title) > 0),
  body        text not null check (char_length(body) > 0),
  version     integer not null default 1 check (version > 0),
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint ai_prompt_templates_type_version_unique
    unique (prompt_type, version)
);

create trigger ai_prompt_templates_set_updated_at
  before update on public.ai_prompt_templates
  for each row execute function public.set_updated_at();

create unique index if not exists ai_prompt_templates_one_active_per_type_idx
  on public.ai_prompt_templates(prompt_type)
  where is_active;

alter table public.ai_prompt_templates enable row level security;

grant select, insert, update, delete on table public.ai_prompt_templates
to service_role;

-- No anon/authenticated policies yet.
-- Admin editing requires an approved RBAC/admin surface.
