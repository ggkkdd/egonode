-- =====================================================================
-- EGO-NODE — "Death by AI" survival game — Supabase schema
-- =====================================================================
-- Run this entire file once, top-to-bottom, in the Supabase SQL Editor.
-- It is idempotent and safe to re-run, and it upgrades an existing
-- (old exploration-game) database in place.
--
-- Prerequisite (one-time, dashboard):
--   Authentication → Providers → Anonymous Sign-ins → Enable
--   (Without this, signInAnonymously() returns "anonymous_provider_disabled".)
--
-- NOTE: Supabase is OPTIONAL. The game plays fully without it; this schema
-- only enables saving each player's best level and a log of their attempts.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. players
-- ---------------------------------------------------------------------
create table if not exists public.players (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text        not null,
  max_level_reached  integer     not null default 0,
  created_at         timestamptz not null default now()
);

-- Upgrade older installs that predate this column.
alter table public.players
  add column if not exists max_level_reached integer not null default 0;

-- ---------------------------------------------------------------------
-- 2. runs — one row per submitted survival plan (analytics log)
-- ---------------------------------------------------------------------
create table if not exists public.runs (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references public.players(id) on delete cascade,
  level           integer not null,
  scenario_title  text,
  user_plan       text not null,
  outcome         text not null check (outcome in ('SURVIVED', 'PERISHED')),
  created_at      timestamptz not null default now()
);

create index if not exists runs_player_id_idx on public.runs(player_id);

-- ---------------------------------------------------------------------
-- Auto-seed: when a new auth user appears (e.g. anonymous sign-in),
-- create a matching players row.
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
  insert into public.players (id, username)
  values (new.id, 'survivor-' || short_id)
  on conflict (id) do nothing;
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
alter table public.players enable row level security;
alter table public.runs    enable row level security;

-- players: a user can read and update only their own row.
drop policy if exists "players_select_own" on public.players;
create policy "players_select_own" on public.players
  for select using (auth.uid() = id);

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own" on public.players
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- runs: scoped to the owning player.
drop policy if exists "runs_select_own" on public.runs;
create policy "runs_select_own" on public.runs
  for select using (auth.uid() = player_id);

drop policy if exists "runs_insert_own" on public.runs;
create policy "runs_insert_own" on public.runs
  for insert with check (auth.uid() = player_id);
