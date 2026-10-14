-- =====================================================================
-- Farm Management SaaS — initial schema
-- Multi-tenant: every business table carries farm_id and is protected by
-- Row Level Security, so the same rules apply to the web app and to any
-- future mobile app that talks to Supabase directly.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Tenancy: farms + members
-- ---------------------------------------------------------------------
create table public.farms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  owner_id    uuid not null references auth.users (id),
  location    text,
  currency    text not null default 'BDT',
  has_dairy   boolean not null default true,
  has_layer   boolean not null default true,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.farm_members (
  farm_id     uuid not null references public.farms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'worker'
              check (role in ('owner', 'manager', 'worker', 'vet')),
  created_at  timestamptz not null default now(),
  primary key (farm_id, user_id)
);

create index farm_members_user_idx on public.farm_members (user_id);

-- security definer so policies on farm_members itself don't recurse
create or replace function public.is_farm_member(p_farm_id uuid)
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

create or replace function public.has_farm_role(p_farm_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farm_members
    where farm_id = p_farm_id and user_id = auth.uid() and role = any (p_roles)
  );
$$;

-- Creates a farm and makes the caller its owner in one step.
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
  v_farm_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.farms (name, owner_id, location, currency, has_dairy, has_layer)
  values (p_name, auth.uid(), p_location, coalesce(p_currency, 'BDT'), p_has_dairy, p_has_layer)
  returning id into v_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (v_farm_id, auth.uid(), 'owner');

  return v_farm_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Cattle & dairy
-- ---------------------------------------------------------------------
create table public.cattle (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references public.farms (id) on delete cascade,
  tag_number      text not null,
  name            text,
  breed           text,
  sex             text not null default 'female' check (sex in ('female', 'male')),
  category        text not null default 'cow'
                  check (category in ('cow', 'heifer', 'calf', 'bull', 'steer')),
  status          text not null default 'active'
                  check (status in ('active', 'sold', 'dead')),
  date_of_birth   date,
  purchase_date   date,
  purchase_price  numeric(12, 2),
  mother_id       uuid references public.cattle (id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (farm_id, tag_number),
  unique (id, farm_id)
);

create table public.milk_records (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  cattle_id        uuid not null,
  record_date      date not null default current_date,
  session          text not null default 'morning'
                   check (session in ('morning', 'evening', 'other')),
  quantity_liters  numeric(8, 2) not null check (quantity_liters >= 0),
  fat_percent      numeric(4, 2) check (fat_percent between 0 and 15),
  notes            text,
  created_by       uuid default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (cattle_id, farm_id) references public.cattle (id, farm_id) on delete cascade,
  unique (cattle_id, record_date, session)
);

create index milk_records_farm_date_idx on public.milk_records (farm_id, record_date desc);

create table public.health_records (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  cattle_id         uuid not null,
  record_date       date not null default current_date,
  record_type       text not null default 'treatment'
                    check (record_type in ('vaccination', 'treatment', 'checkup', 'deworming')),
  description       text not null,
  medicine          text,
  vet_name          text,
  cost              numeric(12, 2),
  withdrawal_until  date,
  created_by        uuid default auth.uid() references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  foreign key (cattle_id, farm_id) references public.cattle (id, farm_id) on delete cascade
);

create index health_records_cattle_idx on public.health_records (cattle_id, record_date desc);

create table public.breeding_events (
  id                     uuid primary key default gen_random_uuid(),
  farm_id                uuid not null references public.farms (id) on delete cascade,
  cattle_id              uuid not null,
  event_date             date not null default current_date,
  event_type             text not null
                         check (event_type in ('heat', 'insemination', 'pregnancy_check', 'calving', 'dry_off')),
  bull_or_semen          text,
  result                 text,
  expected_calving_date  date,
  notes                  text,
  created_by             uuid default auth.uid() references auth.users (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  foreign key (cattle_id, farm_id) references public.cattle (id, farm_id) on delete cascade
);

create index breeding_events_cattle_idx on public.breeding_events (cattle_id, event_date desc);

-- ---------------------------------------------------------------------
-- Layer chickens (managed per flock, not per bird)
-- ---------------------------------------------------------------------
create table public.flocks (
  id                     uuid primary key default gen_random_uuid(),
  farm_id                uuid not null references public.farms (id) on delete cascade,
  name                   text not null,
  breed                  text,
  shed                   text,
  placed_date            date not null default current_date,
  age_at_placement_weeks integer not null default 0 check (age_at_placement_weeks >= 0),
  initial_count          integer not null check (initial_count > 0),
  status                 text not null default 'active'
                         check (status in ('active', 'sold', 'culled')),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz,
  unique (id, farm_id)
);

create table public.flock_daily_logs (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references public.farms (id) on delete cascade,
  flock_id        uuid not null,
  log_date        date not null default current_date,
  eggs_collected  integer not null default 0 check (eggs_collected >= 0),
  eggs_broken     integer not null default 0 check (eggs_broken >= 0),
  mortality       integer not null default 0 check (mortality >= 0),
  culled          integer not null default 0 check (culled >= 0),
  feed_kg         numeric(10, 2) check (feed_kg >= 0),
  water_liters    numeric(10, 2) check (water_liters >= 0),
  notes           text,
  created_by      uuid default auth.uid() references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (flock_id, farm_id) references public.flocks (id, farm_id) on delete cascade,
  unique (flock_id, log_date)
);

create index flock_daily_logs_farm_date_idx on public.flock_daily_logs (farm_id, log_date desc);

-- Live bird count per flock, computed from the daily logs.
create view public.flock_stats
with (security_invoker = true)
as
select
  f.id as flock_id,
  f.farm_id,
  f.initial_count,
  coalesce(sum(l.mortality), 0)::int as total_mortality,
  coalesce(sum(l.culled), 0)::int as total_culled,
  (f.initial_count - coalesce(sum(l.mortality), 0) - coalesce(sum(l.culled), 0))::int as current_count,
  coalesce(sum(l.eggs_collected), 0)::int as total_eggs,
  coalesce(sum(l.feed_kg), 0)::numeric as total_feed_kg
from public.flocks f
left join public.flock_daily_logs l on l.flock_id = f.id
group by f.id;

-- ---------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references public.farms (id) on delete cascade,
  txn_date     date not null default current_date,
  txn_type     text not null check (txn_type in ('income', 'expense')),
  module       text not null default 'general' check (module in ('dairy', 'layer', 'general')),
  category     text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  description  text,
  created_by   uuid default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index transactions_farm_date_idx on public.transactions (farm_id, txn_date desc);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'farms', 'cattle', 'milk_records', 'health_records',
    'breeding_events', 'flocks', 'flock_daily_logs', 'transactions'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.farms        enable row level security;
alter table public.farm_members enable row level security;

create policy "profiles: read self and co-members" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.farm_members me
      join public.farm_members them on them.farm_id = me.farm_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "farms: members read" on public.farms
  for select to authenticated using (public.is_farm_member(id));

create policy "farms: owner/manager update" on public.farms
  for update to authenticated
  using (public.has_farm_role(id, array['owner', 'manager']))
  with check (public.has_farm_role(id, array['owner', 'manager']));

create policy "farms: owner delete" on public.farms
  for delete to authenticated using (public.has_farm_role(id, array['owner']));

create policy "farm_members: members read" on public.farm_members
  for select to authenticated using (public.is_farm_member(farm_id));

create policy "farm_members: owner manages" on public.farm_members
  for all to authenticated
  using (public.has_farm_role(farm_id, array['owner']))
  with check (public.has_farm_role(farm_id, array['owner']));

-- Same policy set for every tenant-scoped data table:
-- members can read/insert/update, owners & managers can delete.
do $$
declare
  t text;
begin
  foreach t in array array[
    'cattle', 'milk_records', 'health_records', 'breeding_events',
    'flocks', 'flock_daily_logs', 'transactions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "%1$s: members read" on public.%1$I
         for select to authenticated using (public.is_farm_member(farm_id))', t);

    execute format(
      'create policy "%1$s: members insert" on public.%1$I
         for insert to authenticated with check (public.is_farm_member(farm_id))', t);

    execute format(
      'create policy "%1$s: members update" on public.%1$I
         for update to authenticated
         using (public.is_farm_member(farm_id))
         with check (public.is_farm_member(farm_id))', t);

    execute format(
      'create policy "%1$s: owner/manager delete" on public.%1$I
         for delete to authenticated
         using (public.has_farm_role(farm_id, array[''owner'', ''manager'']))', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_farm(text, text, text, boolean, boolean) to authenticated;
grant execute on function public.is_farm_member(uuid) to authenticated;
grant execute on function public.has_farm_role(uuid, text[]) to authenticated;
revoke execute on function public.create_farm(text, text, text, boolean, boolean) from anon, public;
