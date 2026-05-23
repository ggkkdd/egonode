-- =====================================================================
-- Egonode — Supabase schema bootstrap
-- =====================================================================
-- Run this entire file once, top-to-bottom, in the Supabase SQL Editor.
--
-- Prerequisite (one-time, dashboard):
--   Authentication → Providers → Anonymous Sign-ins → Enable
--   (Without this, signInAnonymously() returns an "anonymous_provider_disabled" error.)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. players
-- ---------------------------------------------------------------------
create table if not exists public.players (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text        not null,
  current_theme   text        default 'origin',
  cognitive_tags  text[]      not null default '{}',
  is_banned       boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. artifacts
-- ---------------------------------------------------------------------
create table if not exists public.artifacts (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  name              text not null,
  description       text,
  is_curiosity_key  boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists artifacts_player_id_idx on public.artifacts(player_id);

-- ---------------------------------------------------------------------
-- Auto-seed: when a new auth user appears (e.g. anonymous sign-in),
-- create a matching players row and a starter artifact.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  short_id text := substr(replace(new.id::text, '-', ''), 1, 6);
begin
  insert into public.players (id, username, cognitive_tags)
  values (new.id, 'anon-' || short_id, array['novice', 'curious'])
  on conflict (id) do nothing;

  insert into public.artifacts (player_id, name, description, is_curiosity_key)
  values (
    new.id,
    'Brass Keycard',
    'Cool to the touch. Etched with the symbol of an open eye.',
    true
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------
alter table public.players   enable row level security;
alter table public.artifacts enable row level security;

-- players: a user can read and update their own row only,
-- and banned users cannot write.
drop policy if exists "players_select_own" on public.players;
create policy "players_select_own" on public.players
  for select using (auth.uid() = id);

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own" on public.players
  for update
  using  (auth.uid() = id and not is_banned)
  with check (auth.uid() = id);

-- artifacts: scoped to the owning player; banned users blocked from inserts.
drop policy if exists "artifacts_select_own" on public.artifacts;
create policy "artifacts_select_own" on public.artifacts
  for select using (auth.uid() = player_id);

drop policy if exists "artifacts_insert_own" on public.artifacts;
create policy "artifacts_insert_own" on public.artifacts
  for insert with check (
    auth.uid() = player_id
    and not exists (
      select 1 from public.players p
      where p.id = auth.uid() and p.is_banned
    )
  );

drop policy if exists "artifacts_delete_own" on public.artifacts;
create policy "artifacts_delete_own" on public.artifacts
  for delete using (auth.uid() = player_id);
