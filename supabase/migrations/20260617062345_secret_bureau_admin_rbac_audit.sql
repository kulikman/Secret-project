-- 20260617062345_secret_bureau_admin_rbac_audit.sql
-- Admin RBAC foundation for Тайное Бюро.
--
-- This migration intentionally does not add admin write policies. Future
-- domain-specific server actions must perform role checks and write audit logs
-- before using service-role writes for moderation, prompt editing, or publishing.

do $$
begin
  create type public.admin_role as enum (
    'super_admin',
    'admin',
    'editor',
    'curator',
    'support',
    'viewer'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_role_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.admin_role not null,
  granted_by  uuid references auth.users(id) on delete set null,
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint admin_role_assignments_user_unique unique (user_id)
);

create trigger admin_role_assignments_set_updated_at
  before update on public.admin_role_assignments
  for each row execute function public.set_updated_at();

create index if not exists admin_role_assignments_role_idx
  on public.admin_role_assignments(role);

alter table public.admin_role_assignments enable row level security;

grant select on table public.admin_role_assignments to authenticated;
grant select, insert, update, delete on table public.admin_role_assignments to service_role;

create policy "Users can read own admin role"
  on public.admin_role_assignments for select
  to authenticated
  using (auth.uid() = user_id);

-- Existing app tables: expose only read access where admin read policies need it.
grant select on table
  public.audit_logs,
  public.dossiers,
  public.presentations,
  public.slides,
  public.ai_jobs,
  public.ai_prompt_templates
to authenticated;

create policy "Admins can read all audit logs"
  on public.audit_logs for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin')
    )
  );

create policy "Curators can read applications"
  on public.applications for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'curator')
    )
  );

create policy "Curators can read bureau cities"
  on public.bureau_cities for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'curator')
    )
  );

create policy "Curators can read bureau events"
  on public.bureau_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'curator')
    )
  );

create policy "Curators can read photo reports"
  on public.photo_reports for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'curator')
    )
  );

create policy "Editors can read dossiers"
  on public.dossiers for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor')
    )
  );

create policy "Editors can read presentations"
  on public.presentations for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor')
    )
  );

create policy "Editors can read slides"
  on public.slides for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor')
    )
  );

create policy "Editors can read ai jobs"
  on public.ai_jobs for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor')
    )
  );

create policy "Editors can read prompt templates"
  on public.ai_prompt_templates for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_role_assignments as role_assignment
      where role_assignment.user_id = auth.uid()
        and role_assignment.role in ('super_admin', 'admin', 'editor')
    )
  );
