-- Media Team Hub — real auth, admin role, assigned schedule, screenshots
-- Run this in your Supabase project's SQL Editor after 001_init.sql has already been run.
-- Safe to run once.

-- ---------------------------------------------------------------------------
-- Members: link to a real Supabase Auth account, add a role
-- ---------------------------------------------------------------------------

alter table members add column if not exists user_id uuid unique references auth.users (id) on delete cascade;
alter table members add column if not exists role text not null default 'member' check (role in ('member', 'admin'));

-- Auto-create (or relink) a member row whenever someone signs up. Whoever signs up with the
-- email below becomes admin automatically — change/add emails here to add more admins later.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into members (user_id, name, role)
  values (
    new.id,
    display_name,
    case when new.email = 'samuellemma700@gmail.com' then 'admin' else 'member' end
  )
  on conflict (name) do update
    set user_id = excluded.user_id,
        role = case when members.role = 'admin' then 'admin' else excluded.role end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Helper functions used by every policy below
-- ---------------------------------------------------------------------------

create or replace function public.current_member_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from members where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from members where user_id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- New tables: admin-built assignment schedule
-- ---------------------------------------------------------------------------

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position int not null default 0
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  sunday date not null,
  role_id uuid not null references roles (id) on delete cascade,
  member_name text not null,
  assigned_by text,
  created_at timestamptz not null default now(),
  unique (sunday, role_id)
);

insert into roles (name, position)
select v.name, v.position
from (values ('Streaming / Wirecast', 0), ('ProPresenter / Slides', 1), ('Audio', 2)) as v(name, position)
where not exists (select 1 from roles);

-- ---------------------------------------------------------------------------
-- Screenshot attachments on the issue log
-- ---------------------------------------------------------------------------

alter table issues add column if not exists screenshot_url text;

-- ---------------------------------------------------------------------------
-- Row Level Security — replace the old "anyone with the link" policies with
-- ones that require a real logged-in account. Self-service actions (marking
-- your own availability, checking yourself in, reporting an issue, ticking
-- off checklist items, editing shared settings/screenshots) stay open to any
-- logged-in member. Editing the checklist template and building the
-- assignment schedule is admin-only.
-- ---------------------------------------------------------------------------

alter table roles enable row level security;
alter table assignments enable row level security;

drop policy if exists "public full access" on members;
drop policy if exists "public full access" on availability;
drop policy if exists "public full access" on checkins;
drop policy if exists "public full access" on issues;
drop policy if exists "public full access" on checklist_items;
drop policy if exists "public full access" on checklist_state;
drop policy if exists "public full access" on settings;

-- members
create policy "members: read all" on members for select to authenticated using (true);
create policy "members: update own or admin" on members for update to authenticated
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());
create policy "members: admin delete" on members for delete to authenticated using (is_admin());

-- availability
create policy "availability: read all" on availability for select to authenticated using (true);
create policy "availability: write own or admin" on availability for insert to authenticated
  with check (member_name = current_member_name() or is_admin());
create policy "availability: update own or admin" on availability for update to authenticated
  using (member_name = current_member_name() or is_admin())
  with check (member_name = current_member_name() or is_admin());

-- checkins
create policy "checkins: read all" on checkins for select to authenticated using (true);
create policy "checkins: write own or admin" on checkins for insert to authenticated
  with check (member_name = current_member_name() or is_admin());
create policy "checkins: update own or admin" on checkins for update to authenticated
  using (member_name = current_member_name() or is_admin())
  with check (member_name = current_member_name() or is_admin());

-- issues
create policy "issues: read all" on issues for select to authenticated using (true);
create policy "issues: insert own" on issues for insert to authenticated
  with check (reporter = current_member_name());
create policy "issues: update own or admin" on issues for update to authenticated
  using (reporter = current_member_name() or is_admin())
  with check (reporter = current_member_name() or is_admin());
create policy "issues: delete own or admin" on issues for delete to authenticated
  using (reporter = current_member_name() or is_admin());

-- checklist_items (the template) — admin only
create policy "checklist_items: read all" on checklist_items for select to authenticated using (true);
create policy "checklist_items: admin write" on checklist_items for insert to authenticated with check (is_admin());
create policy "checklist_items: admin update" on checklist_items for update to authenticated using (is_admin()) with check (is_admin());
create policy "checklist_items: admin delete" on checklist_items for delete to authenticated using (is_admin());

-- checklist_state — collaborative, any logged-in member
create policy "checklist_state: read all" on checklist_state for select to authenticated using (true);
create policy "checklist_state: write all" on checklist_state for insert to authenticated with check (true);
create policy "checklist_state: update all" on checklist_state for update to authenticated using (true) with check (true);

-- settings — collaborative (chat link, stream-setup screenshots), any logged-in member
create policy "settings: read all" on settings for select to authenticated using (true);
create policy "settings: write all" on settings for insert to authenticated with check (true);
create policy "settings: update all" on settings for update to authenticated using (true) with check (true);

-- roles — admin only manages the list, everyone reads it
create policy "roles: read all" on roles for select to authenticated using (true);
create policy "roles: admin write" on roles for insert to authenticated with check (is_admin());
create policy "roles: admin update" on roles for update to authenticated using (is_admin()) with check (is_admin());
create policy "roles: admin delete" on roles for delete to authenticated using (is_admin());

-- assignments — admin only builds the schedule, everyone reads it
create policy "assignments: read all" on assignments for select to authenticated using (true);
create policy "assignments: admin write" on assignments for insert to authenticated with check (is_admin());
create policy "assignments: admin update" on assignments for update to authenticated using (is_admin()) with check (is_admin());
create policy "assignments: admin delete" on assignments for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage: a public bucket for screenshots (stream-setup steps, issue reports)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

drop policy if exists "screenshots: public read" on storage.objects;
drop policy if exists "screenshots: authenticated insert" on storage.objects;
drop policy if exists "screenshots: authenticated update" on storage.objects;
drop policy if exists "screenshots: authenticated delete" on storage.objects;

create policy "screenshots: public read" on storage.objects for select using (bucket_id = 'screenshots');
create policy "screenshots: authenticated insert" on storage.objects for insert to authenticated with check (bucket_id = 'screenshots');
create policy "screenshots: authenticated update" on storage.objects for update to authenticated using (bucket_id = 'screenshots');
create policy "screenshots: authenticated delete" on storage.objects for delete to authenticated using (bucket_id = 'screenshots');

-- ---------------------------------------------------------------------------
-- Realtime — live-sync the new tables too
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table roles;
alter publication supabase_realtime add table assignments;
