-- Media Team Hub — initial schema
-- Run this in your Supabase project's SQL Editor (or via `supabase db push`
-- if you're using the Supabase CLI). Safe to run once on a fresh project.

create extension if not exists pgcrypto;

-- Team members (name-only identity, no password — see README for the tradeoffs)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Weekly availability, one row per (sunday, member)
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  sunday date not null,
  member_name text not null,
  status text not null check (status in ('yes', 'no', 'maybe')),
  updated_at timestamptz not null default now(),
  unique (sunday, member_name)
);

-- Sunday check-ins
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  sunday date not null,
  member_name text not null,
  checked_in_at timestamptz not null default now(),
  unique (sunday, member_name)
);

-- Troubleshooting issue log
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  reporter text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Master checklist template (shared across all Sundays)
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Per-Sunday checklist completion state
create table if not exists checklist_state (
  id uuid primary key default gen_random_uuid(),
  sunday date not null,
  item_id uuid not null references checklist_items (id) on delete cascade,
  done boolean not null default false,
  done_by text,
  done_at timestamptz,
  unique (sunday, item_id)
);

-- Free-form key/value settings (group chat link, stream-setup screenshot URLs, etc.)
create table if not exists settings (
  key text primary key,
  value text not null default ''
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This app has no login — anyone with the URL can act as any name. That's a
-- deliberate simplicity tradeoff for a small volunteer team, not an oversight.
-- These policies allow the anon (public) key full read/write access. Do not
-- reuse this schema for anything that needs real access control.
-- ---------------------------------------------------------------------------

alter table members enable row level security;
alter table availability enable row level security;
alter table checkins enable row level security;
alter table issues enable row level security;
alter table checklist_items enable row level security;
alter table checklist_state enable row level security;
alter table settings enable row level security;

create policy "public full access" on members for all using (true) with check (true);
create policy "public full access" on availability for all using (true) with check (true);
create policy "public full access" on checkins for all using (true) with check (true);
create policy "public full access" on issues for all using (true) with check (true);
create policy "public full access" on checklist_items for all using (true) with check (true);
create policy "public full access" on checklist_state for all using (true) with check (true);
create policy "public full access" on settings for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime — lets everyone's screen update live as teammates check in,
-- mark availability, tick off checklist items, or log issues.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table members;
alter publication supabase_realtime add table availability;
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table checklist_items;
alter publication supabase_realtime add table checklist_state;
