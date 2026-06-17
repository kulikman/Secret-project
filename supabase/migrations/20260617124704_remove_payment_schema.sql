-- Payments are explicitly out of scope for Тайное Бюро.
-- Keep migration history intact, but remove the legacy SaaS billing schema
-- from any database that applies the full migration chain.

drop table if exists public.subscriptions;

alter table public.profiles
  drop column if exists stripe_customer_id;
