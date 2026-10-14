-- =====================================================================
-- Admin-managed dropdowns
--
-- Every dropdown in the app reads its options from here, so a super admin
-- can rename them (English + Bangla), reorder them, hide them and — for
-- "editable" lists — add new ones. The web app and a future mobile app
-- share the same lists.
--
-- Two kinds of list:
--   editable = true  : free lists (animal types, finance categories, vaccine
--                      quick picks, heat signs, currencies). New values can
--                      be added.
--   editable = false : fixed lists whose values the app's logic relies on
--                      (statuses, milking sessions, breeding events, …).
--                      Labels and order can change; values cannot be added,
--                      and options marked can_hide = false can't be hidden.
-- Options are never deleted (old records keep their label); they are hidden.
-- =====================================================================

create table public.dropdown_lists (
  key         text primary key,
  editable    boolean not null,
  sort_order  integer not null default 0
);

create table public.dropdown_options (
  list_key    text not null references public.dropdown_lists (key),
  value       text not null check (char_length(value) between 1 and 60),
  label_en    text not null check (char_length(label_en) between 1 and 80),
  label_bn    text check (label_bn is null or char_length(label_bn) <= 80),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  can_hide    boolean not null default true,
  meta        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (list_key, value)
);

insert into public.dropdown_lists (key, editable, sort_order) values
  ('cattle_category',  true,   10),
  ('cattle_status',    false,  20),
  ('milk_session',     false,  30),
  ('health_type',      false,  40),
  ('health_preset',    true,   50),
  ('breeding_event',   false,  60),
  ('pregnancy_result', false,  70),
  ('heat_sign',        true,   80),
  ('flock_status',     false,  90),
  ('txn_type',         false, 100),
  ('txn_module',       false, 110),
  ('finance_category', true,  120),
  ('currency',         true,  130);

-- ---------------------------------------------------------------------
-- Default options
-- ---------------------------------------------------------------------
insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  -- Animal type. sex is derived from it; milking = shown on the milking sheet.
  ('cattle_category', 'cow',    'Cow',    'গাভী',  10, true, '{"sex": "female", "milking": true}'),
  ('cattle_category', 'heifer', 'Heifer', 'বকনা',  20, true, '{"sex": "female", "milking": false}'),
  ('cattle_category', 'bull',   'Bull',   'ষাঁড়', 30, true, '{"sex": "male", "milking": false}'),

  ('cattle_status', 'active', 'Active', 'সক্রিয়', 10, false, '{}'),
  ('cattle_status', 'sold',   'Sold',   'বিক্রিত', 20, false, '{}'),
  ('cattle_status', 'dead',   'Dead',   'মৃত',     30, false, '{}'),

  ('milk_session', 'morning', 'Morning', 'সকাল',    10, false, '{}'),
  ('milk_session', 'evening', 'Evening', 'সন্ধ্যা', 20, false, '{}'),
  ('milk_session', 'other',   'Other',   'অন্যান্য', 30, true,  '{}'),

  ('health_type', 'vaccination',      'Vaccination',      'টিকা',             10, false, '{}'),
  ('health_type', 'parasite_control', 'Pest control',     'পরজীবী দমন',       20, false, '{}'),
  ('health_type', 'deworming',        'Deworming',        'কৃমিনাশক',         30, false, '{}'),
  ('health_type', 'treatment',        'Treatment',        'চিকিৎসা',          40, true,  '{}'),
  ('health_type', 'checkup',          'Check-up',         'স্বাস্থ্য পরীক্ষা', 50, true,  '{}'),

  ('health_preset', 'fmd',        'FMD vaccine (every 6 months)',        'খুরা রোগের (FMD) টিকা (প্রতি ৬ মাসে)',  10, true, '{"record_type": "vaccination", "product": "FMD", "interval_days": 180}'),
  ('health_preset', 'hs',         'HS vaccine (yearly)',                 'গলাফুলা (HS) টিকা (বছরে একবার)',        20, true, '{"record_type": "vaccination", "product": "HS (Haemorrhagic Septicaemia)", "interval_days": 365}'),
  ('health_preset', 'bq',         'BQ vaccine (yearly)',                 'বাদলা (BQ) টিকা (বছরে একবার)',          30, true, '{"record_type": "vaccination", "product": "BQ (Black Quarter)", "interval_days": 365}'),
  ('health_preset', 'anthrax',    'Anthrax vaccine (yearly)',            'তড়কা (অ্যানথ্রাক্স) টিকা (বছরে একবার)', 40, true, '{"record_type": "vaccination", "product": "Anthrax", "interval_days": 365}'),
  ('health_preset', 'lsd',        'Lumpy skin disease vaccine (yearly)', 'গুটি বসন্ত (LSD) টিকা (বছরে একবার)',    50, true, '{"record_type": "vaccination", "product": "LSD (Lumpy Skin Disease)", "interval_days": 365}'),
  ('health_preset', 'rabies',     'Rabies vaccine (yearly)',             'জলাতঙ্ক টিকা (বছরে একবার)',            60, true, '{"record_type": "vaccination", "product": "Rabies", "interval_days": 365}'),
  ('health_preset', 'brucella',   'Brucellosis vaccine (once)',          'ব্রুসেলোসিস টিকা (একবার)',             70, true, '{"record_type": "vaccination", "product": "Brucellosis", "interval_days": 0}'),
  ('health_preset', 'deworm',     'Deworming (every 3 months)',          'কৃমিনাশক (প্রতি ৩ মাসে)',              80, true, '{"record_type": "deworming", "product": "Dewormer", "interval_days": 90}'),
  ('health_preset', 'tick-spray', 'Tick / fly spray (every 3 weeks)',    'আঁটালি / মাছি স্প্রে (প্রতি ৩ সপ্তাহে)', 90, true, '{"record_type": "parasite_control", "product": "Tick & fly spray", "interval_days": 21}'),
  ('health_preset', 'pour-on',    'Pour-on / injectable ectoparasiticide (every 2 months)', 'পোর-অন / ইনজেকশন (প্রতি ২ মাসে)', 100, true, '{"record_type": "parasite_control", "product": "Ivermectin", "interval_days": 60}'),

  ('breeding_event', 'heat',            'Heat observed',                  'গরম দেখা গেছে',                10, false, '{}'),
  ('breeding_event', 'insemination',    'Artificial insemination / service', 'কৃত্রিম প্রজনন (এআই) / পাল দেওয়া', 20, false, '{}'),
  ('breeding_event', 'pregnancy_check', 'Pregnancy check',                'গর্ভ পরীক্ষা',                  30, false, '{}'),
  ('breeding_event', 'calving',         'Calving',                        'বাছুর প্রসব',                   40, false, '{}'),
  ('breeding_event', 'dry_off',         'Dry off',                        'দুধ বন্ধ (ড্রাই অফ)',            50, true,  '{}'),

  ('pregnancy_result', 'positive',  'Pregnant',              'গর্ভবতী',                     10, false, '{}'),
  ('pregnancy_result', 'negative',  'Not pregnant (open)',   'গর্ভবতী নয় (ফাঁকা)',          20, false, '{}'),
  ('pregnancy_result', 'uncertain', 'Uncertain — recheck',   'অনিশ্চিত — আবার পরীক্ষা করুন', 30, true,  '{}'),

  ('heat_sign', 'standing',  'Standing to be mounted', 'অন্যের উপর উঠতে দেয়', 10, true, '{}'),
  ('heat_sign', 'mounting',  'Mounting others',        'অন্যের উপর ওঠে',      20, true, '{}'),
  ('heat_sign', 'mucus',     'Mucus discharge',        'আঠালো স্রাব',          30, true, '{}'),
  ('heat_sign', 'restless',  'Restless / bellowing',   'অস্থির / চিৎকার',      40, true, '{}'),
  ('heat_sign', 'swollen',   'Swollen vulva',          'যোনি ফোলা',           50, true, '{}'),
  ('heat_sign', 'milk_drop', 'Drop in milk',           'দুধ কমে যাওয়া',        60, true, '{}'),

  ('flock_status', 'active', 'Active',            'সক্রিয়',   10, false, '{}'),
  ('flock_status', 'sold',   'Sold',              'বিক্রিত',   20, false, '{}'),
  ('flock_status', 'culled', 'Culled (depleted)', 'বাদ (শেষ)', 30, false, '{}'),

  ('txn_type', 'income',  'Income',  'আয়',  10, false, '{}'),
  ('txn_type', 'expense', 'Expense', 'ব্যয়', 20, false, '{}'),

  ('txn_module', 'dairy',   'Dairy',   'ডেইরি',  10, false, '{}'),
  ('txn_module', 'layer',   'Layer',   'লেয়ার', 20, false, '{}'),
  ('txn_module', 'general', 'General', 'সাধারণ', 30, false, '{}'),

  -- Finance categories are stored on transactions by their value (the
  -- English name), so existing transactions keep working.
  ('finance_category', 'Milk sales',          'Milk sales',          'দুধ বিক্রি',        10, true, '{"txn_type": "income"}'),
  ('finance_category', 'Egg sales',           'Egg sales',           'ডিম বিক্রি',        20, true, '{"txn_type": "income"}'),
  ('finance_category', 'Animal sales',        'Animal sales',        'পশু বিক্রি',        30, true, '{"txn_type": "income"}'),
  ('finance_category', 'Manure sales',        'Manure sales',        'গোবর/সার বিক্রি',   40, true, '{"txn_type": "income"}'),
  ('finance_category', 'Other income',        'Other income',        'অন্যান্য আয়',       50, true, '{"txn_type": "income"}'),
  ('finance_category', 'Feed',                'Feed',                'খাদ্য',            60, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Medicine & vet',      'Medicine & vet',      'ওষুধ ও চিকিৎসক',    70, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Labour',              'Labour',              'শ্রমিক মজুরি',      80, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Electricity & water', 'Electricity & water', 'বিদ্যুৎ ও পানি',    90, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Animal purchase',     'Animal purchase',     'পশু কেনা',         100, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Chicks / pullets',    'Chicks / pullets',    'বাচ্চা / পুলেট',    110, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Equipment',           'Equipment',           'যন্ত্রপাতি',        120, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Transport',           'Transport',           'পরিবহন',           130, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Rent',                'Rent',                'ভাড়া',             140, true, '{"txn_type": "expense"}'),
  ('finance_category', 'Other expense',       'Other expense',       'অন্যান্য ব্যয়',     150, true, '{"txn_type": "expense"}'),

  ('currency', 'BDT', 'BDT — Bangladeshi Taka', 'BDT — বাংলাদেশি টাকা', 10, true, '{}'),
  ('currency', 'INR', 'INR — Indian Rupee',     'INR — ভারতীয় রুপি',   20, true, '{}'),
  ('currency', 'PKR', 'PKR — Pakistani Rupee',  'PKR — পাকিস্তানি রুপি', 30, true, '{}'),
  ('currency', 'USD', 'USD — US Dollar',        'USD — মার্কিন ডলার',   40, true, '{}'),
  ('currency', 'EUR', 'EUR — Euro',             'EUR — ইউরো',          50, true, '{}');

-- ---------------------------------------------------------------------
-- Rules for changes (enforced for the API, not just the admin UI)
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
    if not coalesce(v_editable, false) then
      raise exception 'New options cannot be added to this list.' using errcode = '23514';
    end if;
    new.can_hide := true;
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

  -- Each list must keep at least one visible option.
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

create trigger dropdown_options_validate
  before insert or update on public.dropdown_options
  for each row execute function public.validate_dropdown_option();

-- Audit every change (security definer: admin_log is not callable directly).
create or replace function public.audit_dropdown_option()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    perform public.admin_log(
      case when tg_op = 'INSERT' then 'options.create' else 'options.update' end,
      'option', new.list_key || ':' || new.value,
      jsonb_build_object('label', new.label_en, 'active', new.active));
  end if;
  return new;
end;
$$;

create trigger dropdown_options_audit
  after insert or update on public.dropdown_options
  for each row execute function public.audit_dropdown_option();

-- ---------------------------------------------------------------------
-- Access: everyone (even signed-out pages) can read; only super admins write.
-- ---------------------------------------------------------------------
alter table public.dropdown_lists enable row level security;
alter table public.dropdown_options enable row level security;

create policy "dropdown lists: read" on public.dropdown_lists
  for select to anon, authenticated using (true);
create policy "dropdown options: read" on public.dropdown_options
  for select to anon, authenticated using (true);
create policy "dropdown options: super admin insert" on public.dropdown_options
  for insert to authenticated with check (public.is_super_admin());
create policy "dropdown options: super admin update" on public.dropdown_options
  for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

revoke all on public.dropdown_lists, public.dropdown_options from anon, authenticated;
grant select on public.dropdown_lists, public.dropdown_options to anon, authenticated;
grant insert, update on public.dropdown_options to authenticated;

-- ---------------------------------------------------------------------
-- Animal type drives sex: cow/heifer → female, bull → male (or whatever a
-- super admin configures). The old fixed list of types is replaced by the
-- dropdown table; existing animals keep their type.
-- ---------------------------------------------------------------------
alter table public.cattle drop constraint cattle_category_check;

create or replace function public.apply_cattle_category()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sex text;
  v_active boolean;
begin
  if tg_op = 'UPDATE' and new.category is not distinct from old.category then
    return new;
  end if;

  select meta ->> 'sex', active into v_sex, v_active
  from public.dropdown_options
  where list_key = 'cattle_category' and value = new.category;

  if not found then
    raise exception 'Unknown animal type.' using errcode = '23514';
  end if;
  if not v_active then
    raise exception 'This animal type is no longer available.' using errcode = '23514';
  end if;

  new.sex := v_sex;

  if new.sex = 'male' and tg_op = 'UPDATE' and exists (
    select 1 from public.cattle c where c.mother_id = new.id
  ) then
    raise exception 'This animal is recorded as a mother, so it must stay female.' using errcode = '23514';
  end if;

  return new;
end;
$$;

-- Runs before cattle_check_mother (triggers fire in name order).
create trigger cattle_apply_category
  before insert or update of category on public.cattle
  for each row execute function public.apply_cattle_category();
