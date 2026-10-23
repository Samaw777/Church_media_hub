-- Media Team Hub — fix accounts that can sign in but have no member profile
-- Run this in your Supabase project's SQL Editor after 002_auth_and_admin.sql. Safe to run more than once.
--
-- The old sign-up trigger matched profiles by name, so a second person signing up with a name
-- already in use took over that profile and left the original account with none. This replaces it:
-- an unclaimed profile with the same name is still reclaimed, but a profile that already belongs to
-- someone is never taken; the newcomer gets a numbered name instead (e.g. "Sam 2").

-- Creates (or reclaims) the member profile for one account. Not callable from the app directly.
create or replace function public.ensure_member(uid uuid, user_email text, full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 1;
  want_role text := case when user_email = 'samuellemma700@gmail.com' then 'admin' else 'member' end;
begin
  if exists (select 1 from members where user_id = uid) then
    if want_role = 'admin' then
      update members set role = 'admin' where user_id = uid;
    end if;
    return;
  end if;

  base := coalesce(nullif(trim(full_name), ''), split_part(user_email, '@', 1));

  -- Reclaim a profile with this name that isn't linked to any account yet.
  update members
     set user_id = uid,
         role = case when role = 'admin' then 'admin' else want_role end
   where name = base and user_id is null;
  if found then
    return;
  end if;

  candidate := base;
  while exists (select 1 from members where name = candidate) loop
    n := n + 1;
    candidate := base || ' ' || n;
  end loop;

  insert into members (user_id, name, role) values (uid, candidate, want_role);
end;
$$;

revoke execute on function public.ensure_member(uuid, text, text) from public, anon, authenticated;

-- New sign-ups go through the safe function above.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform ensure_member(new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Lets a signed-in person repair their own missing profile (the app calls this automatically).
create or replace function public.ensure_my_member()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u record;
begin
  select id, email, raw_user_meta_data ->> 'full_name' as full_name
    into u
    from auth.users
   where id = auth.uid();
  if u.id is null then
    return;
  end if;
  perform ensure_member(u.id, u.email, u.full_name);
end;
$$;

revoke execute on function public.ensure_my_member() from public, anon;
grant execute on function public.ensure_my_member() to authenticated;

-- Repair every existing account that currently has no profile.
do $$
declare
  u record;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data ->> 'full_name' as full_name
      from auth.users au
     where not exists (select 1 from members m where m.user_id = au.id)
  loop
    perform public.ensure_member(u.id, u.email, u.full_name);
  end loop;
end;
$$;

-- Make sure the admin account is admin.
update members
   set role = 'admin'
 where user_id in (select id from auth.users where email = 'samuellemma700@gmail.com');
