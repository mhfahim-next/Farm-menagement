-- =====================================================================
-- More kinds of farm: goats & sheep, cattle fattening (Qurbani),
-- broiler & Sonali batches
--
-- farms.has_goat / has_fattening / has_broiler : what the farm keeps
-- cattle.species      : cattle, goat or sheep, set from the animal type
--                       (doe, buck, khashi, ewe, ram … are new types)
-- cattle.is_fattening : the animal is being fattened for sale (Qurbani)
-- fattening_settings  : per farm: sale date, daily cost and price per kg
-- flocks.kind         : layer, broiler or sonali; meat batches have chick
--                       price, sample weights in the daily log, and
--                       bird sales (sales.product = 'birds')
-- module              : money can now be booked to fattening, goat or
--                       broiler as well as dairy, layer and general, so
--                       cost per litre / per egg stays clean
-- plans.max_goats     : goats and sheep have their own plan limit
-- =====================================================================

-- ---------------------------------------------------------------------
-- What the farm keeps
-- ---------------------------------------------------------------------
alter table public.farms
  add column if not exists has_goat boolean not null default false,
  add column if not exists has_fattening boolean not null default false,
  add column if not exists has_broiler boolean not null default false;

drop function if exists public.create_farm(text, text, text, boolean, boolean);
create or replace function public.create_farm(
  p_name text,
  p_location text default null,
  p_currency text default 'BDT',
  p_has_dairy boolean default true,
  p_has_layer boolean default true,
  p_has_goat boolean default false,
  p_has_fattening boolean default false,
  p_has_broiler boolean default false
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

  insert into public.farms (name, owner_id, location, currency, has_dairy, has_layer, has_goat, has_fattening, has_broiler, plan)
  values (p_name, auth.uid(), p_location, coalesce(p_currency, 'BDT'),
          coalesce(p_has_dairy, false), coalesce(p_has_layer, false), coalesce(p_has_goat, false),
          coalesce(p_has_fattening, false), coalesce(p_has_broiler, false), v_plan)
  returning id into v_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (v_farm_id, auth.uid(), 'owner');

  return v_farm_id;
end;
$$;
revoke execute on function public.create_farm(text, text, text, boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.create_farm(text, text, text, boolean, boolean, boolean, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Money sections (modules)
-- ---------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_module_check;
alter table public.transactions add constraint transactions_module_check
  check (module in ('dairy', 'fattening', 'goat', 'layer', 'broiler', 'general'));
alter table public.sales drop constraint if exists sales_module_check;
alter table public.sales add constraint sales_module_check
  check (module in ('dairy', 'fattening', 'goat', 'layer', 'broiler', 'general'));
alter table public.inventory_items drop constraint if exists inventory_items_module_check;
alter table public.inventory_items add constraint inventory_items_module_check
  check (module in ('dairy', 'fattening', 'goat', 'layer', 'broiler', 'general'));
alter table public.inventory_moves drop constraint if exists inventory_moves_module_check;
alter table public.inventory_moves add constraint inventory_moves_module_check
  check (module is null or module in ('dairy', 'fattening', 'goat', 'layer', 'broiler', 'general'));

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('txn_module', 'fattening', 'Cattle fattening', 'গরু মোটাতাজাকরণ', 12, false, '{}'),
  ('txn_module', 'goat',      'Goats & sheep',    'ছাগল ও ভেড়া',      15, false, '{}'),
  ('txn_module', 'broiler',   'Broiler & Sonali', 'ব্রয়লার ও সোনালি', 25, false, '{}')
on conflict (list_key, value) do nothing;

-- ---------------------------------------------------------------------
-- Goats and sheep live in the same animal register as cattle
-- ---------------------------------------------------------------------
alter table public.cattle
  add column if not exists species text not null default 'cattle' check (species in ('cattle', 'goat', 'sheep')),
  add column if not exists is_fattening boolean not null default false,
  add column if not exists fattening_start date,
  add column if not exists target_weight_kg numeric(7, 1) check (target_weight_kg is null or (target_weight_kg > 0 and target_weight_kg < 2000));
create index if not exists cattle_farm_species_idx on public.cattle (farm_id, species, status);
create index if not exists cattle_fattening_idx on public.cattle (farm_id) where is_fattening;

-- Animal types keep their species (cattle when not given) through admin edits.
create or replace function public.validate_dropdown_option()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_editable boolean;
  v_species text;
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
    v_species := coalesce(new.meta ->> 'species', case when tg_op = 'UPDATE' then old.meta ->> 'species' end, 'cattle');
    if v_species not in ('cattle', 'goat', 'sheep') then
      raise exception 'Choose cattle, goat or sheep for this animal type.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and v_species <> coalesce(old.meta ->> 'species', 'cattle')
       and exists (select 1 from public.cattle c where c.category = new.value) then
      raise exception 'Animals of this type exist, so its species cannot change.' using errcode = '23514';
    end if;
    new.meta := jsonb_build_object(
      'sex', new.meta ->> 'sex',
      'milking', coalesce((new.meta ->> 'milking')::boolean, false) and new.meta ->> 'sex' = 'female'
    ) || case when v_species = 'cattle' then '{}'::jsonb else jsonb_build_object('species', v_species) end;
  elsif new.list_key = 'finance_category' then
    if coalesce(new.meta ->> 'txn_type', '') not in ('income', 'expense') then
      raise exception 'Choose income or expense for this category.' using errcode = '23514';
    end if;
  elsif new.list_key in ('health_preset', 'flock_health_preset') then
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

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('cattle_category', 'doe',      'Doe (female goat)',  'ছাগী',             110, true, '{"sex": "female", "species": "goat", "milking": false}'),
  ('cattle_category', 'buck',     'Buck (breeding male goat)', 'পাঁঠা',     120, true, '{"sex": "male", "species": "goat", "milking": false}'),
  ('cattle_category', 'wether',   'Khashi (castrated goat)', 'খাসি',        130, true, '{"sex": "male", "species": "goat", "milking": false}'),
  ('cattle_category', 'doeling',  'Female kid',         'মাদি ছাগলছানা',    140, true, '{"sex": "female", "species": "goat", "milking": false}'),
  ('cattle_category', 'buckling', 'Male kid',           'পুরুষ ছাগলছানা',   150, true, '{"sex": "male", "species": "goat", "milking": false}'),
  ('cattle_category', 'ewe',      'Ewe (female sheep)', 'ভেড়ি',             210, true, '{"sex": "female", "species": "sheep", "milking": false}'),
  ('cattle_category', 'ram',      'Ram (male sheep)',   'ভেড়া (পুরুষ)',      220, true, '{"sex": "male", "species": "sheep", "milking": false}'),
  ('cattle_category', 'ewe_lamb', 'Female lamb',        'মাদি ভেড়ার বাচ্চা', 230, true, '{"sex": "female", "species": "sheep", "milking": false}'),
  ('cattle_category', 'ram_lamb', 'Male lamb',          'পুরুষ ভেড়ার বাচ্চা', 240, true, '{"sex": "male", "species": "sheep", "milking": false}')
on conflict (list_key, value) do nothing;

-- (for databases where these rows were added before species was kept)
update public.dropdown_options set meta = meta || '{"species": "goat"}'::jsonb
 where list_key = 'cattle_category' and value in ('doe', 'buck', 'wether', 'doeling', 'buckling') and meta ->> 'species' is null;
update public.dropdown_options set meta = meta || '{"species": "sheep"}'::jsonb
 where list_key = 'cattle_category' and value in ('ewe', 'ram', 'ewe_lamb', 'ram_lamb') and meta ->> 'species' is null;

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('cattle_breed', 'Black Bengal', 'Black Bengal',        'ব্ল্যাক বেঙ্গল',    510, true, '{"species": "goat"}'),
  ('cattle_breed', 'Jamunapari',   'Jamunapari',          'যমুনাপাড়ি',       520, true, '{"species": "goat"}'),
  ('cattle_breed', 'Beetal',       'Beetal',              'বিটল',            530, true, '{"species": "goat"}'),
  ('cattle_breed', 'Boer',         'Boer',                'বোয়ার',           540, true, '{"species": "goat"}'),
  ('cattle_breed', 'Totapari',     'Totapari',            'তোতাপুরি',         550, true, '{"species": "goat"}'),
  ('cattle_breed', 'Sirohi',       'Sirohi',              'সিরোহি',          560, true, '{"species": "goat"}'),
  ('cattle_breed', 'Goat cross',   'Cross (goat)',        'শংকর (ছাগল)',      590, true, '{"species": "goat"}'),
  ('cattle_breed', 'Sheep local',  'Local (Deshi) sheep', 'দেশি ভেড়া',        610, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Garole',       'Garole',              'গাড়ল',            620, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Barind',       'Barind',              'বরেন্দ্র',          630, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Jamuna basin', 'Jamuna basin',        'যমুনা অববাহিকা',   640, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Coastal',      'Coastal',             'উপকূলীয়',          650, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Dorper',       'Dorper',              'ডরপার',           660, true, '{"species": "sheep"}'),
  ('cattle_breed', 'Sheep cross',  'Cross (sheep)',       'শংকর (ভেড়া)',      690, true, '{"species": "sheep"}')
on conflict (list_key, value) do nothing;

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('health_preset', 'ppr',        'PPR vaccine, goats & sheep (yearly)',       'পিপিআর টিকা, ছাগল ও ভেড়া (বছরে)',   210, true,
   '{"product": "PPR (Peste des Petits Ruminants)", "record_type": "vaccination", "interval_days": 365}'),
  ('health_preset', 'goat_pox',   'Goat pox vaccine (yearly)',                 'ছাগলের বসন্তের টিকা (বছরে)',        220, true,
   '{"product": "Goat pox", "record_type": "vaccination", "interval_days": 365}'),
  ('health_preset', 'et',         'Enterotoxaemia vaccine, goats & sheep (every 6 months)', 'এন্টারোটক্সিমিয়া টিকা (৬ মাস পরপর)', 230, true,
   '{"product": "Enterotoxaemia (ET)", "record_type": "vaccination", "interval_days": 180}'),
  ('health_preset', 'goat_deworm', 'Deworming, goats & sheep (every 3 months)', 'কৃমিনাশক, ছাগল ও ভেড়া (৩ মাস পরপর)', 240, true,
   '{"product": "Dewormer", "record_type": "deworming", "interval_days": 90}')
on conflict (list_key, value) do nothing;

-- The animal type sets the sex and now also the species.
create or replace function public.apply_cattle_category()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sex text;
  v_species text;
  v_active boolean;
begin
  if tg_op = 'UPDATE' and new.category is not distinct from old.category then
    new.species := old.species;
    return new;
  end if;

  select meta ->> 'sex', coalesce(meta ->> 'species', 'cattle'), active into v_sex, v_species, v_active
  from public.dropdown_options
  where list_key = 'cattle_category' and value = new.category;

  if not found then
    raise exception 'Unknown animal type.' using errcode = '23514';
  end if;
  if not v_active then
    raise exception 'This animal type is no longer available.' using errcode = '23514';
  end if;

  new.sex := v_sex;
  new.species := v_species;

  if tg_op = 'UPDATE' and new.species <> old.species and (
    exists (select 1 from public.cattle c where c.mother_id = new.id)
    or exists (select 1 from public.milk_records m where m.cattle_id = new.id)
  ) then
    raise exception 'An animal with calves or milk records cannot change to another species.' using errcode = '23514';
  end if;

  if new.sex = 'male' and tg_op = 'UPDATE' and exists (
    select 1 from public.cattle c where c.mother_id = new.id
  ) then
    raise exception 'This animal is recorded as a mother, so it must stay female.' using errcode = '23514';
  end if;

  return new;
end;
$$;

-- A mother must be a female of the same species on the same farm.
create or replace function public.check_cattle_mother()
returns trigger
language plpgsql
as $$
begin
  if new.mother_id is not null then
    if new.mother_id = new.id then
      raise exception 'An animal cannot be its own mother.' using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.cattle m
      where m.id = new.mother_id and m.farm_id = new.farm_id and m.sex = 'female' and m.species = new.species
    ) then
      raise exception 'The mother must be a female animal on this farm.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- Goats and sheep have their own plan limit.
alter table public.plans add column if not exists max_goats integer check (max_goats >= 0);
update public.plans set max_goats = 30  where key = 'free' and max_goats is null;
update public.plans set max_goats = 500 where key = 'pro'  and max_goats is null;

create or replace function public.check_cattle_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max   integer;
  v_count integer;
  v_small boolean := new.species in ('goat', 'sheep');
begin
  if new.status = 'active' and new.deleted_at is null
     and (tg_op = 'INSERT' or old.status <> 'active' or old.deleted_at is not null or old.species <> new.species)
     and auth.uid() is not null and not public.is_super_admin() then
    select case when v_small then p.max_goats else p.max_cattle end into v_max
    from public.farms f join public.plans p on p.key = f.plan
    where f.id = new.farm_id;

    if v_max is not null then
      select count(*) into v_count from public.cattle c
      where c.farm_id = new.farm_id and c.status = 'active' and c.deleted_at is null and c.id <> new.id
        and (case when v_small then c.species in ('goat', 'sheep') else c.species = 'cattle' end);
      if v_count >= v_max then
        raise exception 'PLAN_LIMIT:%:%', case when v_small then 'goats' else 'cattle' end, v_max using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Gestation for goats and sheep, and the Qurbani (Eid-ul-Adha) date, set by a super admin.
alter table public.system_settings
  add column if not exists goat_gestation_days integer not null default 150 check (goat_gestation_days between 130 and 170),
  add column if not exists sheep_gestation_days integer not null default 147 check (sheep_gestation_days between 130 and 170),
  add column if not exists qurbani_date date default '2027-05-17';

create or replace function public.admin_set_livestock_rules(p_goat integer, p_sheep integer, p_qurbani date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_goat is null or p_goat not between 130 and 170 or p_sheep is null or p_sheep not between 130 and 170 then
    raise exception 'Gestation must be 130 to 170 days.' using errcode = '23514';
  end if;
  update public.system_settings
     set goat_gestation_days = p_goat, sheep_gestation_days = p_sheep, qurbani_date = p_qurbani, updated_at = now()
   where id = 1;
  perform public.admin_log('settings.livestock', 'system', '1',
    jsonb_build_object('goat', p_goat, 'sheep', p_sheep, 'qurbani', p_qurbani));
end;
$$;
revoke execute on function public.admin_set_livestock_rules(integer, integer, date) from public, anon;
grant execute on function public.admin_set_livestock_rules(integer, integer, date) to authenticated;

-- ---------------------------------------------------------------------
-- Fattening: per-farm numbers for the projections
-- ---------------------------------------------------------------------
create table public.fattening_settings (
  farm_id            uuid primary key references public.farms (id) on delete cascade,
  target_date        date,
  daily_cost_cattle  numeric(10, 2) check (daily_cost_cattle >= 0),
  daily_cost_goat    numeric(10, 2) check (daily_cost_goat >= 0),
  price_kg_cattle    numeric(10, 2) check (price_kg_cattle >= 0),
  price_kg_goat      numeric(10, 2) check (price_kg_goat >= 0),
  updated_at         timestamptz not null default now()
);

alter table public.fattening_settings enable row level security;
create policy "fattening settings: members read" on public.fattening_settings
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "fattening settings: managers insert" on public.fattening_settings
  for insert to authenticated with check (public.has_farm_role(farm_id, array['owner', 'manager']));
create policy "fattening settings: managers update" on public.fattening_settings
  for update to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']))
  with check (public.has_farm_role(farm_id, array['owner', 'manager']));
revoke all on public.fattening_settings from anon, authenticated;
grant select, insert, update on public.fattening_settings to authenticated;

-- ---------------------------------------------------------------------
-- Broiler and Sonali batches
-- ---------------------------------------------------------------------
alter table public.flocks
  add column if not exists kind text not null default 'layer' check (kind in ('layer', 'broiler', 'sonali')),
  add column if not exists chick_price numeric(10, 2) check (chick_price is null or chick_price >= 0);

alter table public.flock_daily_logs
  add column if not exists avg_weight_g numeric(7, 1) check (avg_weight_g is null or (avg_weight_g > 0 and avg_weight_g < 10000));

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('flock_breed', 'Cobb 500',     'Cobb 500',     'কব ৫০০',      110, true, '{"kind": "meat"}'),
  ('flock_breed', 'Ross 308',     'Ross 308',     'রস ৩০৮',      120, true, '{"kind": "meat"}'),
  ('flock_breed', 'Hubbard',      'Hubbard',      'হাবার্ড',      130, true, '{"kind": "meat"}'),
  ('flock_breed', 'Arbor Acres',  'Arbor Acres',  'আরবার একর্স',  140, true, '{"kind": "meat"}')
on conflict (list_key, value) do nothing;

-- Birds sold from a meat batch: weight in kg, head count, the batch.
alter table public.sales add column if not exists head_count integer check (head_count is null or head_count > 0);
alter table public.sales drop constraint if exists sales_product_check;
alter table public.sales add constraint sales_product_check
  check (product in ('milk', 'eggs', 'animal', 'birds', 'manure', 'other'));
alter table public.sales add constraint sales_birds_check
  check (product <> 'birds' or (flock_id is not null and head_count is not null));

-- Live birds also go down when birds are sold.
create or replace view public.flock_stats with (security_invoker = true) as
  select f.id as flock_id,
         f.farm_id,
         f.initial_count,
         coalesce(l.mortality, 0)::integer as total_mortality,
         coalesce(l.culled, 0)::integer as total_culled,
         (f.initial_count - coalesce(l.mortality, 0) - coalesce(l.culled, 0) - coalesce(s.birds, 0))::integer as current_count,
         coalesce(l.eggs, 0)::integer as total_eggs,
         coalesce(l.feed, 0)::numeric as total_feed_kg,
         coalesce(s.birds, 0)::integer as total_sold,
         coalesce(s.kg, 0)::numeric as total_sold_kg,
         coalesce(s.amount, 0)::numeric as total_sales
    from public.flocks f
    left join (
      select flock_id, sum(mortality) mortality, sum(culled) culled, sum(eggs_collected) eggs, sum(coalesce(feed_kg, 0)) feed
        from public.flock_daily_logs group by flock_id
    ) l on l.flock_id = f.id
    left join (
      select flock_id, sum(head_count) birds, sum(quantity) filter (where unit = 'kg') kg, sum(amount) amount
        from public.sales where product = 'birds' group by flock_id
    ) s on s.flock_id = f.id;

-- Can't sell more birds than are alive.
create or replace function public.check_bird_sale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live integer;
  v_kind text;
begin
  if new.product <> 'birds' then return new; end if;
  select kind into v_kind from public.flocks where id = new.flock_id and farm_id = new.farm_id;
  if v_kind is null then
    raise exception 'Choose a batch on this farm.' using errcode = '23514';
  end if;
  select current_count + case when tg_op = 'UPDATE' and old.product = 'birds' and old.flock_id = new.flock_id then coalesce(old.head_count, 0) else 0 end
    into v_live from public.flock_stats where flock_id = new.flock_id;
  if new.head_count > coalesce(v_live, 0) then
    raise exception 'BIRDS_LEFT:%', coalesce(v_live, 0) using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists sales_check_birds on public.sales;
create trigger sales_check_birds
  before insert or update on public.sales
  for each row execute function public.check_bird_sale();

-- Feed used by a meat batch is booked to the broiler section.
create or replace function public.sync_flock_feed_use()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unit_kg numeric;
  v_unit text;
  v_qty numeric;
  v_module text;
begin
  if new.feed_item_id is null or coalesce(new.feed_kg, 0) <= 0 then
    delete from public.inventory_moves where log_id = new.id;
    return new;
  end if;
  select unit, unit_kg into v_unit, v_unit_kg from public.inventory_items
  where id = new.feed_item_id and farm_id = new.farm_id;
  v_qty := case when v_unit = 'kg' then new.feed_kg else new.feed_kg / nullif(v_unit_kg, 0) end;
  if v_qty is null or v_qty <= 0 then
    raise exception 'Set the weight of one unit (kg) for this stock item first.' using errcode = '23514';
  end if;
  select case when kind = 'layer' then 'layer' else 'broiler' end into v_module from public.flocks where id = new.flock_id;
  insert into public.inventory_moves (farm_id, item_id, move_date, move_type, quantity, module, flock_id, log_id, created_by)
  values (new.farm_id, new.feed_item_id, new.log_date, 'use', round(v_qty, 3), coalesce(v_module, 'layer'), new.flock_id, new.id, auth.uid())
  on conflict (log_id) do update set
    item_id = excluded.item_id, move_date = excluded.move_date, quantity = excluded.quantity,
    flock_id = excluded.flock_id, module = excluded.module;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Ledger: animal costs go to the right section
-- ---------------------------------------------------------------------
create or replace view public.finance_ledger with (security_invoker = true) as
 select t.farm_id, t.txn_date, t.txn_type, t.module, t.category, t.amount, t.description,
        'manual'::text as source, t.id as source_id, null::uuid as ref_id, t.quantity, t.unit_price
   from public.transactions t
union all
 select h.farm_id, h.record_date, 'expense'::text,
        case when c.species in ('goat', 'sheep') then 'goat' when c.is_fattening then 'fattening' else 'dairy' end,
        'Medicine & vet'::text, h.cost, coalesce(h.product, h.description),
        'health'::text, h.id, h.cattle_id, null::numeric, null::numeric
   from public.health_records h
   left join public.cattle c on c.id = h.cattle_id
  where h.cost is not null and h.cost > 0
union all
 select b.farm_id, b.event_date, 'expense'::text,
        case when c.species in ('goat', 'sheep') then 'goat' else 'dairy' end,
        'Breeding & AI'::text, b.cost, coalesce(b.bull_or_semen, b.event_type),
        'breeding'::text, b.id, b.cattle_id, null::numeric, null::numeric
   from public.breeding_events b
   left join public.cattle c on c.id = b.cattle_id
  where b.cost is not null and b.cost > 0
union all
 select fh.farm_id, fh.record_date, 'expense'::text,
        case when fl.kind in ('broiler', 'sonali') then 'broiler' else 'layer' end,
        'Medicine & vet'::text, fh.cost, fh.product,
        'flock_health'::text, fh.id, fh.flock_id, null::numeric, null::numeric
   from public.flock_health_records fh
   left join public.flocks fl on fl.id = fh.flock_id
  where fh.cost is not null and fh.cost > 0
union all
 select p.farm_id, p.paid_on, 'expense'::text,
        case s.module when 'dairy' then 'dairy' when 'layer' then 'layer' else 'general' end,
        'Labour'::text, p.amount, s.name,
        'salary'::text, p.id, p.staff_id, null::numeric, null::numeric
   from public.staff_payments p
   join public.staff s on s.id = p.staff_id and s.farm_id = p.farm_id
union all
 select m.farm_id, m.move_date, 'expense'::text, i.module,
        case i.kind when 'feed' then 'Feed' when 'supplement' then 'Feed'
                    when 'medicine' then 'Medicine & vet' when 'vaccine' then 'Medicine & vet'
                    else 'Other expense' end,
        m.total_cost::numeric(12, 2), i.name,
        'inventory'::text, m.id, m.item_id, m.quantity, m.unit_cost
   from public.inventory_moves m
   join public.inventory_items i on i.id = m.item_id
  where m.move_type = 'purchase' and m.total_cost is not null and m.total_cost > 0
union all
 select s.farm_id, s.sale_date, 'income'::text, s.module,
        case s.product when 'milk' then 'Milk sales' when 'eggs' then 'Egg sales'
                       when 'animal' then 'Animal sales' when 'birds' then 'Bird sales'
                       when 'manure' then 'Manure sales' else 'Other income' end,
        s.amount::numeric(12, 2), b.name,
        'sale'::text, s.id, s.buyer_id, s.quantity, s.unit_price
   from public.sales s
   left join public.buyers b on b.id = s.buyer_id;

-- Cost per litre / per egg: eggs and layer feed come from layer flocks only,
-- and shared costs are also split with the new sections (other_expense).
drop function if exists public.farm_monthly_summary(uuid, date, date);
create function public.farm_monthly_summary(p_farm uuid, p_from date, p_to date)
returns table (
  month date,
  milk_litres numeric, eggs_collected numeric, eggs_broken numeric, layer_feed_kg numeric,
  dairy_income numeric, dairy_expense numeric, layer_income numeric, layer_expense numeric,
  general_income numeric, general_expense numeric,
  dairy_feed_expense numeric, layer_feed_expense numeric,
  milk_sold_litres numeric, milk_sales_amount numeric, eggs_sold numeric, egg_sales_amount numeric,
  other_expense numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with months as (
    select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date as month
  ),
  milk as (
    select date_trunc('month', record_date)::date m, sum(quantity_liters) v
      from public.milk_records where farm_id = p_farm and record_date between p_from and p_to group by 1
  ),
  eggs as (
    select date_trunc('month', l.log_date)::date m, sum(l.eggs_collected) c, sum(l.eggs_broken) b, sum(coalesce(l.feed_kg, 0)) feed
      from public.flock_daily_logs l join public.flocks f on f.id = l.flock_id
     where l.farm_id = p_farm and f.kind = 'layer' and l.log_date between p_from and p_to group by 1
  ),
  money as (
    select date_trunc('month', txn_date)::date m,
           sum(amount) filter (where module = 'dairy' and txn_type = 'income') di,
           sum(amount) filter (where module = 'dairy' and txn_type = 'expense') de,
           sum(amount) filter (where module = 'layer' and txn_type = 'income') li,
           sum(amount) filter (where module = 'layer' and txn_type = 'expense') le,
           sum(amount) filter (where module = 'general' and txn_type = 'income') gi,
           sum(amount) filter (where module = 'general' and txn_type = 'expense') ge,
           sum(amount) filter (where module = 'dairy' and txn_type = 'expense' and category = 'Feed') df,
           sum(amount) filter (where module = 'layer' and txn_type = 'expense' and category = 'Feed') lf,
           sum(amount) filter (where module in ('fattening', 'goat', 'broiler') and txn_type = 'expense') oe
      from public.finance_ledger where farm_id = p_farm and txn_date between p_from and p_to group by 1
  ),
  sold as (
    select date_trunc('month', sale_date)::date m,
           sum(quantity) filter (where product = 'milk' and unit = 'litre') ml,
           sum(amount) filter (where product = 'milk' and unit = 'litre') ma,
           sum(quantity * case unit when 'piece' then 1 when 'hali' then 4 when 'dozen' then 12 when 'tray' then 30 end)
             filter (where product = 'eggs' and unit in ('piece', 'hali', 'dozen', 'tray')) es,
           sum(amount) filter (where product = 'eggs' and unit in ('piece', 'hali', 'dozen', 'tray')) ea
      from public.sales where farm_id = p_farm and sale_date between p_from and p_to group by 1
  )
  select mo.month,
         coalesce(milk.v, 0), coalesce(eggs.c, 0), coalesce(eggs.b, 0), coalesce(eggs.feed, 0),
         coalesce(money.di, 0), coalesce(money.de, 0), coalesce(money.li, 0), coalesce(money.le, 0),
         coalesce(money.gi, 0), coalesce(money.ge, 0), coalesce(money.df, 0), coalesce(money.lf, 0),
         coalesce(sold.ml, 0), coalesce(sold.ma, 0), coalesce(sold.es, 0), coalesce(sold.ea, 0),
         coalesce(money.oe, 0)
    from months mo
    left join milk on milk.m = mo.month
    left join eggs on eggs.m = mo.month
    left join money on money.m = mo.month
    left join sold on sold.m = mo.month
   order by mo.month;
$$;
revoke execute on function public.farm_monthly_summary(uuid, date, date) from public, anon;
grant execute on function public.farm_monthly_summary(uuid, date, date) to authenticated;
