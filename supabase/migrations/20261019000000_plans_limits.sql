-- =====================================================================
-- Subscription plans that actually limit what a farm can do
--
-- plans            : price, limits and features per plan (admin-editable; the
--                    home page reads it too)
-- triggers         : stop a farm from exceeding its plan (cattle, flocks,
--                    team members, farms), for web and mobile alike
-- requests         : upgrade requests and support messages from farm owners;
--                    farms on a plan with priority support are flagged
-- =====================================================================

create table public.plans (
  key               text primary key check (key ~ '^[a-z][a-z0-9_]{1,29}$'),
  name_en           text not null check (char_length(name_en) between 1 and 40),
  name_bn           text check (name_bn is null or char_length(name_bn) <= 40),
  price_monthly     numeric(10, 2) check (price_monthly >= 0),   -- BDT; null = "contact us"
  max_cattle        integer check (max_cattle >= 0),             -- null = unlimited
  max_flocks        integer check (max_flocks >= 0),
  max_members       integer check (max_members >= 1),            -- team seats; vets don't count
  max_farms         integer check (max_farms >= 1),
  can_export        boolean not null default false,
  priority_support  boolean not null default false,
  active            boolean not null default true,
  sort_order        integer not null default 0,
  updated_at        timestamptz not null default now()
);

insert into public.plans
  (key, name_en, name_bn, price_monthly, max_cattle, max_flocks, max_members, max_farms, can_export, priority_support, sort_order)
values
  ('free',     'Free',     'ফ্রি',     0,    25,   1,    1,    1,    false, false, 10),
  ('pro',      'Pro',      'প্রো',     999,  300,  10,   5,    1,    true,  false, 20),
  ('business', 'Business', 'বিজনেস',  null, null, null, null, null, true,  true,  30);

-- farms.plan used to be a fixed list; it now points at the plans table.
alter table public.farms drop constraint farms_plan_check;
alter table public.farms
  add constraint farms_plan_fkey foreign key (plan) references public.plans (key);

create or replace function public.validate_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.key <> old.key then
    raise exception 'A plan''s code cannot be changed.' using errcode = '23514';
  end if;
  if new.key = 'free' and not new.active then
    raise exception 'The Free plan is the default for new farms and cannot be hidden.' using errcode = '23514';
  end if;
  new.name_en := trim(new.name_en);
  new.name_bn := nullif(trim(new.name_bn), '');
  new.updated_at := now();
  return new;
end;
$$;

create trigger plans_validate
  before insert or update on public.plans
  for each row execute function public.validate_plan();

create or replace function public.audit_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    perform public.admin_log(
      case when tg_op = 'INSERT' then 'plans.create' else 'plans.update' end,
      'plan', new.key, jsonb_build_object('name', new.name_en, 'active', new.active));
  end if;
  return new;
end;
$$;

create trigger plans_audit
  after insert or update on public.plans
  for each row execute function public.audit_plan();

alter table public.plans enable row level security;
create policy "plans: read" on public.plans for select to anon, authenticated using (true);
create policy "plans: super admin insert" on public.plans
  for insert to authenticated with check (public.is_super_admin());
create policy "plans: super admin update" on public.plans
  for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

revoke all on public.plans from anon, authenticated;
grant select on public.plans to anon, authenticated;
grant insert, update on public.plans to authenticated;

-- Payment instructions shown on the plan page (bKash / Nagad / bank …).
alter table public.system_settings
  add column payment_instructions_en text,
  add column payment_instructions_bn text;

create or replace function public.admin_set_payment_instructions(p_en text, p_bn text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.system_settings
     set payment_instructions_en = nullif(trim(p_en), ''),
         payment_instructions_bn = nullif(trim(p_bn), ''),
         updated_at = now()
   where id = 1;
  perform public.admin_log('settings.payment', 'system', '1');
end;
$$;
revoke execute on function public.admin_set_payment_instructions(text, text) from public, anon;
grant execute on function public.admin_set_payment_instructions(text, text) to authenticated;

-- admin_set_farm_plan now validates against the plans table.
create or replace function public.admin_set_farm_plan(p_farm uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if not exists (select 1 from public.plans where key = p_plan) then
    raise exception 'Unknown plan.';
  end if;

  update public.farms set plan = p_plan where id = p_farm;
  if not found then raise exception 'Farm not found.'; end if;

  perform public.admin_log('farm.set_plan', 'farm', p_farm::text, jsonb_build_object('plan', p_plan));
end;
$$;

-- ---------------------------------------------------------------------
-- Limits. The message "PLAN_LIMIT:<what>:<max>" is translated by the app.
-- Super admins and server-side jobs (no signed-in user) are not limited.
-- Existing data is never deleted when a plan is lowered; only *new* additions
-- are blocked until the farm is back under the limit.
-- ---------------------------------------------------------------------
create or replace function public.check_cattle_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max   integer;
  v_count integer;
begin
  if new.status = 'active' and new.deleted_at is null
     and (tg_op = 'INSERT' or old.status <> 'active' or old.deleted_at is not null)
     and auth.uid() is not null and not public.is_super_admin() then
    select p.max_cattle into v_max
    from public.farms f join public.plans p on p.key = f.plan
    where f.id = new.farm_id;

    if v_max is not null then
      select count(*) into v_count from public.cattle c
      where c.farm_id = new.farm_id and c.status = 'active' and c.deleted_at is null and c.id <> new.id;
      if v_count >= v_max then
        raise exception 'PLAN_LIMIT:cattle:%', v_max using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger cattle_check_limit
  before insert or update of status, deleted_at on public.cattle
  for each row execute function public.check_cattle_limit();

create or replace function public.check_flock_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max   integer;
  v_count integer;
begin
  if new.status = 'active' and new.deleted_at is null
     and (tg_op = 'INSERT' or old.status <> 'active' or old.deleted_at is not null)
     and auth.uid() is not null and not public.is_super_admin() then
    select p.max_flocks into v_max
    from public.farms f join public.plans p on p.key = f.plan
    where f.id = new.farm_id;

    if v_max is not null then
      select count(*) into v_count from public.flocks k
      where k.farm_id = new.farm_id and k.status = 'active' and k.deleted_at is null and k.id <> new.id;
      if v_count >= v_max then
        raise exception 'PLAN_LIMIT:flocks:%', v_max using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger flocks_check_limit
  before insert or update of status, deleted_at on public.flocks
  for each row execute function public.check_flock_limit();

-- Team seats. Veterinary doctors never use a seat: one doctor serves many farms.
create or replace function public.check_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max   integer;
  v_count integer;
begin
  if new.role <> 'vet' and auth.uid() is not null and not public.is_super_admin() then
    select p.max_members into v_max
    from public.farms f join public.plans p on p.key = f.plan
    where f.id = new.farm_id;

    if v_max is not null then
      select count(*) into v_count from public.farm_members m
      where m.farm_id = new.farm_id and m.role <> 'vet';
      if v_count >= v_max then
        raise exception 'PLAN_LIMIT:members:%', v_max using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger farm_members_check_limit
  before insert on public.farm_members
  for each row execute function public.check_member_limit();

-- A user may own more than one farm only on a plan with max_farms = null
-- (unlimited) or a higher cap. Extra farms inherit that plan.
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
  v_farm_id  uuid;
  v_owned    integer;
  v_cap      integer;
  v_unlimited boolean;
  v_plan     text := 'free';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
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

    -- inherit the best plan the user already pays for
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
-- Upgrade requests and support messages
-- ---------------------------------------------------------------------
create table public.requests (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references public.farms (id) on delete cascade,
  requested_by    uuid default auth.uid() references auth.users (id) on delete set null,
  kind            text not null check (kind in ('upgrade', 'support')),
  plan_requested  text references public.plans (key),
  subject         text check (subject is null or char_length(subject) <= 120),
  message         text check (message is null or char_length(message) <= 2000),
  priority        boolean not null default false,
  status          text not null default 'open' check (status in ('open', 'approved', 'rejected', 'resolved')),
  admin_reply     text check (admin_reply is null or char_length(admin_reply) <= 2000),
  resolved_by     uuid references auth.users (id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  check (kind <> 'upgrade' or plan_requested is not null),
  check (kind <> 'support' or (message is not null and char_length(trim(message)) > 0))
);

-- one open upgrade request per farm
create unique index requests_one_open_upgrade
  on public.requests (farm_id) where kind = 'upgrade' and status = 'open';
create index requests_status_idx on public.requests (status, priority desc, created_at);

-- Users can't choose their own priority or status.
create or replace function public.prepare_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.priority := coalesce(
    (select p.priority_support from public.farms f join public.plans p on p.key = f.plan where f.id = new.farm_id),
    false);
  new.status := 'open';
  new.admin_reply := null;
  new.resolved_by := null;
  new.resolved_at := null;
  new.requested_by := auth.uid();
  if new.kind = 'upgrade' and new.plan_requested = (select plan from public.farms where id = new.farm_id) then
    raise exception 'The farm is already on this plan.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger requests_prepare
  before insert on public.requests
  for each row execute function public.prepare_request();

alter table public.requests enable row level security;

create policy "requests: owner/manager read" on public.requests
  for select to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']) or public.is_super_admin());
create policy "requests: owner/manager create" on public.requests
  for insert to authenticated
  with check (public.has_farm_role(farm_id, array['owner', 'manager']));
create policy "requests: cancel own open upgrade" on public.requests
  for delete to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']) and status = 'open');

revoke all on public.requests from anon, authenticated;
grant select, delete on public.requests to authenticated;
grant insert (farm_id, kind, plan_requested, subject, message) on public.requests to authenticated;

create or replace function public.admin_resolve_request(p_id uuid, p_approve boolean, p_reply text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.requests;
begin
  perform public.admin_assert();
  select * into r from public.requests where id = p_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if r.status <> 'open' then raise exception 'This request has already been handled.'; end if;

  if r.kind = 'upgrade' and p_approve then
    update public.farms set plan = r.plan_requested where id = r.farm_id;
  end if;

  update public.requests
     set status = case
           when r.kind = 'upgrade' and p_approve then 'approved'
           when r.kind = 'upgrade' then 'rejected'
           else 'resolved' end,
         admin_reply = nullif(trim(p_reply), ''),
         resolved_by = auth.uid(),
         resolved_at = now()
   where id = p_id;

  perform public.admin_log(
    case when r.kind = 'upgrade' and p_approve then 'request.approve'
         when r.kind = 'upgrade' then 'request.reject'
         else 'request.resolve' end,
    'request', p_id::text,
    jsonb_build_object('farm', r.farm_id, 'plan', r.plan_requested));
end;
$$;
revoke execute on function public.admin_resolve_request(uuid, boolean, text) from public, anon;
grant execute on function public.admin_resolve_request(uuid, boolean, text) to authenticated;
