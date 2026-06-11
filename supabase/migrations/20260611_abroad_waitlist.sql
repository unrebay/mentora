-- Waitlist for international (diaspora) early access — /abroad landing page.
-- Inserts happen ONLY server-side via service role (API route /api/abroad-waitlist).
-- RLS is enabled with no policies: anon/authenticated have no access at all.

create table if not exists public.abroad_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'ru' check (locale in ('ru', 'en')),
  source text not null default 'abroad_page',
  created_at timestamptz not null default now()
);

alter table public.abroad_waitlist enable row level security;

comment on table public.abroad_waitlist is 'Early-access waitlist for international card payments (diaspora wave). Service-role only.';
