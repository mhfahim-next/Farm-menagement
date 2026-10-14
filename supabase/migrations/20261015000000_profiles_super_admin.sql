-- =====================================================================
-- Profile pictures, super admin, farm suspension, audit log, announcement
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profiles: avatar + super admin flag
-- ---------------------------------------------------------------------
alter table public.profiles
  add column avatar_url      text,
  add column is_super_admin  boolean not null default false;

-- Users may only edit their own display fields. Without this, the
-- "update self" policy would let anyone set is_super_admin = true.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- Farms: suspension, and plan/suspension can't be changed by the owner
-- ---------------------------------------------------------------------
alter table public.farms
  add column suspended boolean not null default false;

-- Owners/managers may only edit descriptive fields. plan and suspended are
-- changed through the admin_* functions below.
revoke update on public.farms from authenticated;
grant update (name, location, currency, has_dairy, has_layer) on public.farms to authenticated;

-- Membership regardless of suspension (needed to read your own farm row and
-- show a "suspended" notice instead of an empty app).
create or replace function public.is_member_of(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farm_members
    where farm_id = p_farm_id and user_id = auth.uid()
  );
$$;

-- Active membership: used by every data table policy, so a suspended farm's
-- data is locked for the web app and the mobile app alike.
create or replace function public.is_farm_member(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members m
    join public.farms f on f.id = m.farm_id
    where m.farm_id = p_farm_id and m.user_id = auth.uid() and not f.suspended
  );
$$;

create or replace function public.has_farm_role(p_farm_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_members m
    join public.farms f on f.id = m.farm_id
    where m.farm_id = p_farm_id and m.user_id = auth.uid()
      and m.role = any (p_roles) and not f.suspended
  );
$$;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_member_of(uuid) to authenticated;

drop policy "farms: members read" on public.farms;
create policy "farms: members read" on public.farms
  for select to authenticated using (public.is_member_of(id));

drop policy "farm_members: members read" on public.farm_members;
create policy "farm_members: members read" on public.farm_members
  for select to authenticated using (public.is_member_of(farm_id));

-- ---------------------------------------------------------------------
-- Super admin can read everything (writes go through admin_* functions
-- for auditing, except business data which they may fix directly).
-- ---------------------------------------------------------------------
create policy "profiles: super admin read" on public.profiles
  for select to authenticated using (public.is_super_admin());
create policy "farms: super admin read" on public.farms
  for select to authenticated using (public.is_super_admin());
create policy "farm_members: super admin read" on public.farm_members
  for select to authenticated using (public.is_super_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'cattle', 'milk_records', 'health_records', 'breeding_events',
    'flocks', 'flock_daily_logs', 'transactions'
  ]
  loop
    execute format(
      'create policy "%1$s: super admin read" on public.%1$I
         for select to authenticated using (public.is_super_admin())', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Audit log + system settings
-- ---------------------------------------------------------------------
create table public.admin_audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid references auth.users (id) on delete set null,
  actor_email  text,
  action       text not null,
  target_type  text,
  target_id    text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
create policy "audit: super admin read" on public.admin_audit_log
  for select to authenticated using (public.is_super_admin());
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create table public.system_settings (
  id                    integer primary key default 1 check (id = 1),
  announcement_en       text,
  announcement_bn       text,
  announcement_active   boolean not null default false,
  updated_at            timestamptz not null default now()
);

insert into public.system_settings (id) values (1);

alter table public.system_settings enable row level security;
create policy "settings: signed-in read" on public.system_settings
  for select to authenticated using (true);
revoke all on public.system_settings from anon, authenticated;
grant select on public.system_settings to authenticated;

-- ---------------------------------------------------------------------
-- Admin functions. Each one re-checks is_super_admin() itself, so the check
-- can't be skipped by calling the API directly.
-- ---------------------------------------------------------------------
create or replace function public.admin_assert()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_log(
  p_action text, p_target_type text, p_target_id text, p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log (actor_id, actor_email, action, target_type, target_id, details)
  values (auth.uid(), (select email from auth.users where id = auth.uid()),
          p_action, p_target_type, p_target_id, p_details);
end;
$$;

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform public.admin_assert();
  select jsonb_build_object(
    'users',           (select count(*) from auth.users),
    'users_7d',        (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_30d',       (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'banned_users',    (select count(*) from auth.users where banned_until is not null and banned_until > now()),
    'farms',           (select count(*) from public.farms),
    'suspended_farms', (select count(*) from public.farms where suspended),
    'cattle',          (select count(*) from public.cattle where deleted_at is null and status = 'active'),
    'flocks',          (select count(*) from public.flocks where deleted_at is null and status = 'active'),
    'milk_30d_liters', (select coalesce(sum(quantity_liters), 0) from public.milk_records where record_date > current_date - 30),
    'eggs_30d',        (select coalesce(sum(eggs_collected), 0) from public.flock_daily_logs where log_date > current_date - 30),
    'plans',           (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb)
                          from (select plan, count(*) n from public.farms group by plan) p)
  ) into result;
  return result;
end;
$$;

create or replace function public.admin_list_users(
  p_search text default null, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id uuid, email text, full_name text, phone text, avatar_url text,
  is_super_admin boolean, banned boolean,
  created_at timestamptz, last_sign_in_at timestamptz, farm_count bigint, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  return query
    select u.id, u.email::text, p.full_name, p.phone, p.avatar_url,
           coalesce(p.is_super_admin, false),
           (u.banned_until is not null and u.banned_until > now()),
           u.created_at, u.last_sign_in_at,
           (select count(*) from public.farm_members m where m.user_id = u.id),
           count(*) over ()
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p_search is null or p_search = ''
       or u.email ilike '%' || p_search || '%'
       or p.full_name ilike '%' || p_search || '%'
    order by u.created_at desc
    limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_list_farms(
  p_search text default null, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id uuid, name text, owner_id uuid, owner_email text, owner_name text,
  plan text, suspended boolean, currency text, has_dairy boolean, has_layer boolean,
  created_at timestamptz, members bigint, cattle bigint, flocks bigint, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  return query
    select f.id, f.name, f.owner_id, u.email::text, p.full_name,
           f.plan, f.suspended, f.currency, f.has_dairy, f.has_layer, f.created_at,
           (select count(*) from public.farm_members m where m.farm_id = f.id),
           (select count(*) from public.cattle c where c.farm_id = f.id and c.deleted_at is null and c.status = 'active'),
           (select count(*) from public.flocks k where k.farm_id = f.id and k.deleted_at is null and k.status = 'active'),
           count(*) over ()
    from public.farms f
    left join auth.users u on u.id = f.owner_id
    left join public.profiles p on p.id = f.owner_id
    where p_search is null or p_search = ''
       or f.name ilike '%' || p_search || '%'
       or u.email ilike '%' || p_search || '%'
    order by f.created_at desc
    limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_set_user_banned(p_user uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_user = auth.uid() then
    raise exception 'You cannot suspend your own account.';
  end if;

  update auth.users
     set banned_until = case when p_banned then now() + interval '100 years' else null end
   where id = p_user;
  if not found then raise exception 'User not found.'; end if;

  -- Sign them out everywhere right away.
  if p_banned then
    delete from auth.sessions where user_id = p_user;
  end if;

  perform public.admin_log(
    case when p_banned then 'user.suspend' else 'user.unsuspend' end, 'user', p_user::text);
end;
$$;

create or replace function public.admin_set_super_admin(p_user uuid, p_value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if not p_value and p_user = auth.uid() then
    raise exception 'You cannot remove your own super admin access.';
  end if;

  update public.profiles set is_super_admin = p_value where id = p_user;
  if not found then raise exception 'User not found.'; end if;

  perform public.admin_log(
    case when p_value then 'user.grant_super_admin' else 'user.revoke_super_admin' end,
    'user', p_user::text);
end;
$$;

create or replace function public.admin_delete_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  perform public.admin_assert();
  if p_user = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;
  if exists (select 1 from public.farms where owner_id = p_user) then
    raise exception 'This user owns farms. Delete or reassign the farms first.';
  end if;

  select email into v_email from auth.users where id = p_user;
  if v_email is null then raise exception 'User not found.'; end if;

  delete from auth.users where id = p_user;
  perform public.admin_log('user.delete', 'user', p_user::text, jsonb_build_object('email', v_email));
end;
$$;

create or replace function public.admin_set_farm_plan(p_farm uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_plan not in ('free', 'pro', 'business') then
    raise exception 'Unknown plan.';
  end if;

  update public.farms set plan = p_plan where id = p_farm;
  if not found then raise exception 'Farm not found.'; end if;

  perform public.admin_log('farm.set_plan', 'farm', p_farm::text, jsonb_build_object('plan', p_plan));
end;
$$;

create or replace function public.admin_set_farm_suspended(p_farm uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();

  update public.farms set suspended = p_suspended where id = p_farm;
  if not found then raise exception 'Farm not found.'; end if;

  perform public.admin_log(
    case when p_suspended then 'farm.suspend' else 'farm.unsuspend' end, 'farm', p_farm::text);
end;
$$;

create or replace function public.admin_delete_farm(p_farm uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  perform public.admin_assert();
  select name into v_name from public.farms where id = p_farm;
  if v_name is null then raise exception 'Farm not found.'; end if;

  delete from public.farms where id = p_farm;  -- cascades to all farm data
  perform public.admin_log('farm.delete', 'farm', p_farm::text, jsonb_build_object('name', v_name));
end;
$$;

create or replace function public.admin_set_announcement(
  p_en text, p_bn text, p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();

  update public.system_settings
     set announcement_en = nullif(trim(p_en), ''),
         announcement_bn = nullif(trim(p_bn), ''),
         announcement_active = coalesce(p_active, false),
         updated_at = now()
   where id = 1;

  perform public.admin_log('settings.announcement', 'system', '1',
    jsonb_build_object('active', p_active));
end;
$$;

-- Only signed-in users may call these (each also checks is_super_admin()).
do $$
declare
  f text;
begin
  foreach f in array array[
    'admin_assert()', 'admin_log(text, text, text, jsonb)', 'admin_stats()',
    'admin_list_users(text, integer, integer)', 'admin_list_farms(text, integer, integer)',
    'admin_set_user_banned(uuid, boolean)', 'admin_set_super_admin(uuid, boolean)',
    'admin_delete_user(uuid)', 'admin_set_farm_plan(uuid, text)',
    'admin_set_farm_suspended(uuid, boolean)', 'admin_delete_farm(uuid)',
    'admin_set_announcement(text, text, boolean)'
  ]
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- admin_log and admin_assert are internal helpers; hide them from the API.
revoke execute on function public.admin_log(text, text, text, jsonb) from authenticated;
revoke execute on function public.admin_assert() from authenticated;

-- Bootstrap helper for the first super admin. Run it from the SQL editor
-- (it is not callable through the API):
--   select public.grant_super_admin('you@example.com');
create or replace function public.grant_super_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set is_super_admin = true
   where id = (select id from auth.users where lower(email) = lower(p_email));
  if not found then raise exception 'No user with email %', p_email; end if;
end;
$$;

revoke execute on function public.grant_super_admin(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Profile pictures (Supabase Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public bucket: anyone can *view* a photo by URL. This policy lets the owner
-- list/find their own files, which Storage needs before it will replace or delete them.
create policy "avatars: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
