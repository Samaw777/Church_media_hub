-- Media Team Hub — let the app email someone when they're assigned to a Sunday
-- Run this in your Supabase project's SQL Editor after 003_fix_missing_profiles.sql. Safe to run more than once.
--
-- Emails live in Supabase Auth, which the app can't read. This returns the address for one assignment
-- only, and only to an admin, so team members' emails are never exposed to the browser or other members.

create or replace function public.assignment_recipient(p_sunday date, p_role_id uuid)
returns table (member_name text, role_name text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select a.member_name, r.name, u.email::text
  from assignments a
  join roles r on r.id = a.role_id
  join members m on m.name = a.member_name
  join auth.users u on u.id = m.user_id
  where a.sunday = p_sunday
    and a.role_id = p_role_id
    and is_admin();
$$;

revoke all on function public.assignment_recipient(date, uuid) from public, anon;
grant execute on function public.assignment_recipient(date, uuid) to authenticated;
