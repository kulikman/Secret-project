-- 0011_secret_bureau_community.sql
-- Community module tables for cities, events, applications, and photo reports.
--
-- Public reads are limited to published rows. Public application insert is
-- allowed only for new, unreviewed applications.

create table if not exists public.bureau_cities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null check (char_length(name) > 0),
  description  text,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger bureau_cities_set_updated_at
  before update on public.bureau_cities
  for each row execute function public.set_updated_at();

create index if not exists bureau_cities_status_idx
  on public.bureau_cities(status);

create table if not exists public.bureau_events (
  id           uuid primary key default gen_random_uuid(),
  city_id      uuid references public.bureau_cities(id) on delete set null,
  slug         text not null unique,
  title        text not null check (char_length(title) > 0),
  description  text,
  starts_at    timestamptz,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger bureau_events_set_updated_at
  before update on public.bureau_events
  for each row execute function public.set_updated_at();

create index if not exists bureau_events_status_starts_at_idx
  on public.bureau_events(status, starts_at);

create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  city_id         uuid references public.bureau_cities(id) on delete set null,
  event_id        uuid references public.bureau_events(id) on delete set null,
  full_name       text not null check (char_length(full_name) > 0),
  email           text not null,
  telegram        text,
  motivation      text,
  selected_topic  text,
  status          text not null default 'new' check (
    status in ('new', 'in_review', 'approved', 'rejected', 'waitlisted')
  ),
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create index if not exists applications_status_created_at_idx
  on public.applications(status, created_at desc);

create index if not exists applications_user_id_idx
  on public.applications(user_id)
  where user_id is not null;

create table if not exists public.photo_reports (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.bureau_events(id) on delete set null,
  city_id     uuid references public.bureau_cities(id) on delete set null,
  title       text not null check (char_length(title) > 0),
  body        jsonb not null default '{}',
  media       jsonb not null default '[]',
  status      text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint photo_reports_body_is_object
    check (jsonb_typeof(body) = 'object'),
  constraint photo_reports_media_is_array
    check (jsonb_typeof(media) = 'array')
);

create trigger photo_reports_set_updated_at
  before update on public.photo_reports
  for each row execute function public.set_updated_at();

create index if not exists photo_reports_status_created_at_idx
  on public.photo_reports(status, created_at desc);

alter table public.bureau_cities enable row level security;
alter table public.bureau_events enable row level security;
alter table public.applications enable row level security;
alter table public.photo_reports enable row level security;

grant select on table public.bureau_cities, public.bureau_events, public.photo_reports
to anon, authenticated;

grant insert on table public.applications
to anon, authenticated;

grant select on table public.applications
to authenticated;

grant select, insert, update, delete on table
  public.bureau_cities,
  public.bureau_events,
  public.applications,
  public.photo_reports
to service_role;

create policy "Published bureau cities are publicly readable"
  on public.bureau_cities for select
  to anon, authenticated
  using (status = 'published');

create policy "Published bureau events are publicly readable"
  on public.bureau_events for select
  to anon, authenticated
  using (status = 'published');

create policy "Published photo reports are publicly readable"
  on public.photo_reports for select
  to anon, authenticated
  using (status = 'published');

create policy "Public can submit new applications"
  on public.applications for insert
  to anon, authenticated
  with check (
    status = 'new'
    and (user_id is null or user_id = auth.uid())
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "Users can read own applications"
  on public.applications for select
  to authenticated
  using (user_id = auth.uid());

-- Admin moderation policies require an approved RBAC migration.
