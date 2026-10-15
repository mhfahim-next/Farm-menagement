-- =====================================================================
-- Doctors (veterinary) accounts, team invitations, vet permissions
--
-- * A user is a farmer (default) or a doctor. Doctors sign up on their own
--   page with a registration number; a super admin can mark them verified.
-- * Farm owners invite people by email. The invitee accepts after logging in
--   (nobody can be added to a farm without agreeing).
-- * A "vet" member can read a farm's animal records and write health and
--   breeding records only. Vets never see finances and never use a team seat.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profiles: account type + doctor details
-- ---------------------------------------------------------------------
alter table public.profiles
  add column account_type     text not null default 'farmer' check (account_type in ('farmer', 'doctor')),
  add column doctor_reg_no    text check (doctor_reg_no is null or char_length(doctor_reg_no) <= 60),
  add column doctor_specialty text check (doctor_specialty is null or char_length(doctor_specialty) <= 60),
  add column doctor_verified  boolean not null default false;

-- Doctors may edit their own details; verification is admin-only.
grant update (doctor_reg_no, doctor_specialty) on public.profiles to authenticated;

-- Changing the registration number removes the verified badge.
create or replace function public.reset_doctor_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.doctor_reg_no is distinct from old.doctor_reg_no
     and auth.uid() is not null and not public.is_super_admin() then
    new.doctor_verified := false;
  end if;
  return new;
end;
$$;

create trigger profiles_reset_doctor_verification
  before update of doctor_reg_no on public.profiles
  for each row execute function public.reset_doctor_verification();

-- New users: pick up the account type and doctor details given at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doctor boolean := (new.raw_user_meta_data ->> 'account_type') = 'doctor';
begin
  insert into public.profiles (id, full_name, phone, account_type, doctor_reg_no, doctor_specialty)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', '')),
    case when v_doctor then 'doctor' else 'farmer' end,
    case when v_doctor then nullif(left(trim(new.raw_user_meta_data ->> 'doctor_reg_no'), 60), '') end,
    case when v_doctor then nullif(left(trim(new.raw_user_meta_data ->> 'doctor_specialty'), 60), '') end
  );
  return new;
end;
$$;

create or replace function public.admin_set_doctor_verified(p_user uuid, p_value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.profiles set doctor_verified = p_value
   where id = p_user and account_type = 'doctor';
  if not found then raise exception 'Doctor not found.'; end if;
  perform public.admin_log(
    case when p_value then 'user.verify_doctor' else 'user.unverify_doctor' end, 'user', p_user::text);
end;
$$;
revoke execute on function public.admin_set_doctor_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_doctor_verified(uuid, boolean) to authenticated;

-- admin_list_users now also reports doctor details.
drop function public.admin_list_users(text, integer, integer);
create function public.admin_list_users(
  p_search text default null, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id uuid, email text, full_name text, phone text, avatar_url text,
  is_super_admin boolean, banned boolean,
  created_at timestamptz, last_sign_in_at timestamptz, farm_count bigint,
  account_type text, doctor_reg_no text, doctor_specialty text, doctor_verified boolean,
  total_count bigint
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
           coalesce(p.account_type, 'farmer'), p.doctor_reg_no, p.doctor_specialty,
           coalesce(p.doctor_verified, false),
           count(*) over ()
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p_search is null or p_search = ''
       or u.email ilike '%' || p_search || '%'
       or p.full_name ilike '%' || p_search || '%'
       or p.doctor_reg_no ilike '%' || p_search || '%'
    order by u.created_at desc
    limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0);
end;
$$;
revoke execute on function public.admin_list_users(text, integer, integer) from public, anon;
grant execute on function public.admin_list_users(text, integer, integer) to authenticated;

-- Doctor accounts serve farms; they don't own one.
create or replace function public.create_farm(
  p_name      text,
  p_location  text default null,
  p_currency  text default 'BDT',
  p_has_dairy boolean default true,
  p_has_layer boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_farm_id   uuid;
  v_owned     integer;
  v_cap       integer;
  v_unlimited boolean;
  v_plan      text := 'free';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if (select account_type from public.profiles where id = auth.uid()) = 'doctor' then
    raise exception 'DOCTOR_ACCOUNT' using errcode = '42501';
  end if;

  select count(*) into v_owned from public.farms where owner_id = auth.uid();

  if v_owned > 0 then
    select coalesce(bool_or(p.max_farms is null), false), max(p.max_farms)
      into v_unlimited, v_cap
    from public.farms f join public.plans p on p.key = f.plan
    where f.owner_id = auth.uid();

    if not v_unlimited and v_owned >= coalesce(v_cap, 1) and not public.is_super_admin() then
      raise exception 'PLAN_LIMIT:farms:%', coalesce(v_cap, 1) using errcode = '23514';
    end if;

    select f.plan into v_plan
    from public.farms f join public.plans p on p.key = f.plan
    where f.owner_id = auth.uid()
    order by p.sort_order desc
    limit 1;
  end if;

  insert into public.farms (name, owner_id, location, currency, has_dairy, has_layer, plan)
  values (p_name, auth.uid(), p_location, coalesce(p_currency, 'BDT'), p_has_dairy, p_has_layer, v_plan)
  returning id into v_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (v_farm_id, auth.uid(), 'owner');

  return v_farm_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Team membership: only through invitations
-- ---------------------------------------------------------------------
-- The old policy let an owner insert any user id straight into farm_members.
drop policy "farm_members: owner manages" on public.farm_members;

create policy "farm_members: owner removes" on public.farm_members
  for delete to authenticated
  using (public.has_farm_role(farm_id, array['owner']) and role <> 'owner');

revoke insert, update on public.farm_members from authenticated;

create table public.farm_invites (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  email         text not null check (email = lower(trim(email)) and char_length(email) between 5 and 200),
  role          text not null check (role in ('manager', 'worker', 'vet')),
  invited_by    uuid default auth.uid() references auth.users (id) on delete set null,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);

create unique index farm_invites_one_pending on public.farm_invites (farm_id, email) where status = 'pending';
create index farm_invites_email_idx on public.farm_invites (email) where status = 'pending';

create or replace function public.prepare_farm_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max     integer;
  v_count   integer;
begin
  new.email := lower(trim(new.email));
  new.invited_by := auth.uid();
  new.status := 'pending';
  new.responded_at := null;

  if new.role = 'manager' and not public.has_farm_role(new.farm_id, array['owner']) then
    raise exception 'Only the owner can invite a manager.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.farm_members m join auth.users u on u.id = m.user_id
    where m.farm_id = new.farm_id and lower(u.email) = new.email
  ) then
    raise exception 'ALREADY_MEMBER' using errcode = '23505';
  end if;

  -- Seats: members + people already invited (doctors are free).
  if new.role <> 'vet' and not public.is_super_admin() then
    select p.max_members into v_max
    from public.farms f join public.plans p on p.key = f.plan where f.id = new.farm_id;
    if v_max is not null then
      select (select count(*) from public.farm_members m where m.farm_id = new.farm_id and m.role <> 'vet')
           + (select count(*) from public.farm_invites i where i.farm_id = new.farm_id and i.status = 'pending' and i.role <> 'vet')
        into v_count;
      if v_count >= v_max then
        raise exception 'PLAN_LIMIT:members:%', v_max using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger farm_invites_prepare
  before insert on public.farm_invites
  for each row execute function public.prepare_farm_invite();

alter table public.farm_invites enable row level security;

create policy "invites: owner/manager read" on public.farm_invites
  for select to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']));
create policy "invites: owner/manager create" on public.farm_invites
  for insert to authenticated
  with check (public.has_farm_role(farm_id, array['owner', 'manager']));

revoke all on public.farm_invites from anon, authenticated;
grant select on public.farm_invites to authenticated;
grant insert (farm_id, email, role) on public.farm_invites to authenticated;

-- Invitations addressed to the signed-in user's email.
create or replace function public.my_pending_invites()
returns table (id uuid, farm_id uuid, farm_name text, role text, invited_by_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.farm_id, f.name, i.role, p.full_name, i.created_at
  from public.farm_invites i
  join public.farms f on f.id = i.farm_id and not f.suspended
  left join public.profiles p on p.id = i.invited_by
  where i.status = 'pending'
    and i.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by i.created_at desc;
$$;

create or replace function public.respond_farm_invite(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv  public.farm_invites;
  v_type text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into v_inv from public.farm_invites
  where id = p_id and status = 'pending'
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  for update;
  if not found then raise exception 'INVITE_NOT_FOUND' using errcode = 'P0002'; end if;

  if not p_accept then
    update public.farm_invites set status = 'declined', responded_at = now() where id = p_id;
    return;
  end if;

  select account_type into v_type from public.profiles where id = auth.uid();
  if v_inv.role = 'vet' and v_type <> 'doctor' then
    raise exception 'VET_NEEDS_DOCTOR_ACCOUNT' using errcode = '42501';
  end if;
  if v_inv.role <> 'vet' and v_type = 'doctor' then
    raise exception 'DOCTOR_CANNOT_STAFF' using errcode = '42501';
  end if;

  insert into public.farm_members (farm_id, user_id, role)
  values (v_inv.farm_id, auth.uid(), v_inv.role)
  on conflict (farm_id, user_id) do nothing;

  update public.farm_invites set status = 'accepted', responded_at = now() where id = p_id;
end;
$$;

create or replace function public.revoke_farm_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_farm uuid;
begin
  select farm_id into v_farm from public.farm_invites where id = p_id and status = 'pending';
  if v_farm is null or not public.has_farm_role(v_farm, array['owner', 'manager']) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.farm_invites set status = 'revoked', responded_at = now() where id = p_id;
end;
$$;

-- Leave a farm you belong to (owners can't: delete or transfer the farm instead).
create or replace function public.leave_farm(p_farm uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.farm_members
   where farm_id = p_farm and user_id = auth.uid() and role <> 'owner';
  if not found then raise exception 'Owners cannot leave their own farm.' using errcode = '42501'; end if;
end;
$$;

revoke execute on function
  public.my_pending_invites(), public.respond_farm_invite(uuid, boolean),
  public.revoke_farm_invite(uuid), public.leave_farm(uuid)
  from public, anon;
grant execute on function
  public.my_pending_invites(), public.respond_farm_invite(uuid, boolean),
  public.revoke_farm_invite(uuid), public.leave_farm(uuid)
  to authenticated;

-- ---------------------------------------------------------------------
-- Vet permissions: read animal records, write health & breeding only,
-- never see finances.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  write_all text := 'public.has_farm_role(farm_id, array[''owner'', ''manager'', ''worker''])';
  write_vet text := 'public.is_farm_member(farm_id)';
  w text;
begin
  foreach t in array array[
    'cattle', 'milk_records', 'health_records', 'breeding_events',
    'flocks', 'flock_daily_logs', 'transactions'
  ]
  loop
    execute format('drop policy %I on public.%I', t || ': members read', t);
    execute format('drop policy %I on public.%I', t || ': members insert', t);
    execute format('drop policy %I on public.%I', t || ': members update', t);

    if t = 'transactions' then
      execute format(
        'create policy %I on public.%I for select to authenticated using (%s)',
        t || ': staff read', t, write_all);
    else
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_farm_member(farm_id))',
        t || ': members read', t);
    end if;

    w := case when t in ('health_records', 'breeding_events') then write_vet else write_all end;
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (%s)',
      t || ': writers insert', t, w);
    execute format(
      'create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
      t || ': writers update', t, w, w);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Fixed dropdown lists may be seeded by migrations / server code (no signed-in
-- user); only people using the API are blocked from adding to them.
-- ---------------------------------------------------------------------
create or replace function public.validate_dropdown_option()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_editable boolean;
begin
  select editable into v_editable from public.dropdown_lists where key = new.list_key;

  if tg_op = 'INSERT' then
    if not coalesce(v_editable, false) and auth.uid() is not null then
      raise exception 'New options cannot be added to this list.' using errcode = '23514';
    end if;
    if auth.uid() is not null then
      new.can_hide := true;
    end if;
  else
    if new.list_key <> old.list_key or new.value <> old.value then
      raise exception 'An option''s code cannot be changed.' using errcode = '23514';
    end if;
    new.can_hide := old.can_hide;
    if not new.active and not old.can_hide then
      raise exception 'This option is required by the app and cannot be hidden.' using errcode = '23514';
    end if;
  end if;

  if new.list_key = 'cattle_category' then
    if coalesce(new.meta ->> 'sex', '') not in ('female', 'male') then
      raise exception 'Choose female or male for this animal type.' using errcode = '23514';
    end if;
    new.meta := jsonb_build_object(
      'sex', new.meta ->> 'sex',
      'milking', coalesce((new.meta ->> 'milking')::boolean, false) and new.meta ->> 'sex' = 'female'
    );
  elsif new.list_key = 'finance_category' then
    if coalesce(new.meta ->> 'txn_type', '') not in ('income', 'expense') then
      raise exception 'Choose income or expense for this category.' using errcode = '23514';
    end if;
  elsif new.list_key = 'health_preset' then
    if coalesce(new.meta ->> 'record_type', '') not in
       ('vaccination', 'parasite_control', 'deworming', 'treatment', 'checkup') then
      raise exception 'Choose a valid health record type.' using errcode = '23514';
    end if;
    if coalesce(trim(new.meta ->> 'product'), '') = '' then
      raise exception 'Enter the product name.' using errcode = '23514';
    end if;
    if coalesce(new.meta ->> 'interval_days', '0') !~ '^\d{1,4}$' then
      raise exception 'Repeat interval must be a whole number of days.' using errcode = '23514';
    end if;
  elsif new.list_key = 'currency' then
    if new.value !~ '^[A-Z]{3}$' then
      raise exception 'Currency code must be 3 capital letters, e.g. BDT.' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.active and not new.active and not exists (
    select 1 from public.dropdown_options o
    where o.list_key = new.list_key and o.value <> new.value and o.active
  ) then
    raise exception 'At least one option must stay visible.' using errcode = '23514';
  end if;

  new.label_en := trim(new.label_en);
  new.label_bn := nullif(trim(new.label_bn), '');
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- More admin-managed dropdowns
-- ---------------------------------------------------------------------
insert into public.dropdown_lists (key, editable, sort_order) values
  ('member_role',      false, 140),
  ('doctor_specialty', true,  150);

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide) values
  ('member_role', 'owner',   'Owner',    'মালিক',            10, false),
  ('member_role', 'manager', 'Manager',  'ম্যানেজার',        20, false),
  ('member_role', 'worker',  'Worker',   'কর্মী',            30, false),
  ('member_role', 'vet',     'Vet',      'পশু চিকিৎসক',     40, false);

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order) values
  ('doctor_specialty', 'Cattle & dairy',       'Cattle & dairy',       'গবাদিপশু ও ডেইরি',      10),
  ('doctor_specialty', 'Poultry',              'Poultry',              'পোল্ট্রি',                20),
  ('doctor_specialty', 'Reproduction & AI',    'Reproduction & AI',    'প্রজনন ও কৃত্রিম প্রজনন', 30),
  ('doctor_specialty', 'Surgery',              'Surgery',              'সার্জারি',                40),
  ('doctor_specialty', 'General practice',     'General practice',     'সাধারণ চিকিৎসা',         50),
  ('doctor_specialty', 'Other',                'Other',                'অন্যান্য',                  999);
