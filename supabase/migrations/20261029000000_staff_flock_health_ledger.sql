-- =====================================================================
-- Staff (salary, attendance, payments), layer flock health tracking,
-- and a unified finance ledger
-- =====================================================================

-- ---------------------------------------------------------------------
-- Dropdown lists
-- ---------------------------------------------------------------------
insert into public.dropdown_lists (key, editable, sort_order) values
  ('attendance_status',  false, 160),
  ('staff_pay_type',     false, 170),
  ('staff_position',     true,  180),
  ('flock_health_preset', true, 190);

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta) values
  ('attendance_status', 'present',  'Present',  'উপস্থিত',  10, false, '{}'),
  ('attendance_status', 'absent',   'Absent',   'অনুপস্থিত', 20, false, '{}'),
  ('attendance_status', 'half_day', 'Half day', 'অর্ধদিবস',  30, false, '{}'),
  ('attendance_status', 'leave',    'On leave', 'ছুটিতে',    40, false, '{}'),

  ('staff_pay_type', 'salary',  'Salary',  'বেতন',   10, false, '{}'),
  ('staff_pay_type', 'advance', 'Advance', 'অগ্রিম', 20, false, '{}'),
  ('staff_pay_type', 'bonus',   'Bonus',   'বোনাস',  30, false, '{}');

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order) values
  ('staff_position', 'Milker',            'Milker',            'দুধ দোহনকারী',      10),
  ('staff_position', 'Cattle keeper',     'Cattle keeper',     'গরুর রাখাল',        20),
  ('staff_position', 'Poultry attendant', 'Poultry attendant', 'পোল্ট্রি কর্মী',     30),
  ('staff_position', 'Cleaner',           'Cleaner',           'পরিচ্ছন্নতা কর্মী',  40),
  ('staff_position', 'Driver',            'Driver',            'চালক',              50),
  ('staff_position', 'Supervisor',        'Supervisor',        'সুপারভাইজার',       60),
  ('staff_position', 'Other',             'Other',             'অন্যান্য',           999);

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, meta) values
  ('finance_category', 'Breeding & AI', 'Breeding & AI', 'প্রজনন ও এআই', 75, '{"txn_type": "expense"}');

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, meta) values
  ('flock_health_preset', 'nd',        'Newcastle (ND) vaccine (every 3 months)', 'রাণীক্ষেত (ND) টিকা (প্রতি ৩ মাসে)',      10, '{"record_type": "vaccination", "product": "Newcastle Disease (ND)", "interval_days": 90}'),
  ('flock_health_preset', 'ibd',       'Gumboro (IBD) vaccine (once)',            'গাম্বোরো (IBD) টিকা (একবার)',              20, '{"record_type": "vaccination", "product": "Gumboro (IBD)", "interval_days": 0}'),
  ('flock_health_preset', 'ib',        'Infectious bronchitis (IB) vaccine',      'ইনফেকশাস ব্রঙ্কাইটিস (IB) টিকা',           30, '{"record_type": "vaccination", "product": "Infectious Bronchitis (IB)", "interval_days": 120}'),
  ('flock_health_preset', 'fowl-pox',  'Fowl pox vaccine (yearly)',               'ফাউল পক্স টিকা (বছরে একবার)',             40, '{"record_type": "vaccination", "product": "Fowl Pox", "interval_days": 365}'),
  ('flock_health_preset', 'fc',        'Fowl cholera vaccine (every 6 months)',   'ফাউল কলেরা টিকা (প্রতি ৬ মাসে)',          50, '{"record_type": "vaccination", "product": "Fowl Cholera", "interval_days": 180}'),
  ('flock_health_preset', 'egg-drop',  'Egg drop syndrome (EDS) vaccine',         'ডিম কমে যাওয়া (EDS) টিকা',                60, '{"record_type": "vaccination", "product": "Egg Drop Syndrome (EDS)", "interval_days": 0}'),
  ('flock_health_preset', 'deworm',    'Poultry deworming (every 2 months)',      'পোল্ট্রি কৃমিনাশক (প্রতি ২ মাসে)',         70, '{"record_type": "deworming", "product": "Piperazine / Albendazole", "interval_days": 60}'),
  ('flock_health_preset', 'mite-lice', 'Lice / mite spray (monthly)',             'উকুন / মাইট স্প্রে (প্রতি মাসে)',          80, '{"record_type": "parasite_control", "product": "Lice & mite spray", "interval_days": 30}'),
  ('flock_health_preset', 'vitamins',  'Vitamins / electrolytes course',          'ভিটামিন / ইলেক্ট্রোলাইট কোর্স',            90, '{"record_type": "treatment", "product": "Vitamins & electrolytes", "interval_days": 0}');

-- Presets of the flock list use the same rules as the cattle health presets.
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

-- ---------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------
create table public.staff (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references public.farms (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 1 and 120),
  phone          text check (phone is null or char_length(phone) <= 40),
  position       text check (position is null or char_length(position) <= 80),
  module         text not null default 'both' check (module in ('dairy', 'layer', 'both')),
  monthly_salary numeric(12, 2) not null default 0 check (monthly_salary >= 0),
  join_date      date not null default current_date,
  active         boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, farm_id)
);
create index staff_farm_idx on public.staff (farm_id, active);

create table public.staff_attendance (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  staff_id   uuid not null,
  att_date   date not null default current_date,
  status     text not null check (status in ('present', 'absent', 'half_day', 'leave')),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (staff_id, farm_id) references public.staff (id, farm_id) on delete cascade,
  unique (staff_id, att_date)
);
create index staff_attendance_farm_date_idx on public.staff_attendance (farm_id, att_date desc);

create table public.staff_payments (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  staff_id   uuid not null,
  pay_month  date not null check (pay_month = date_trunc('month', pay_month)::date),
  pay_type   text not null default 'salary' check (pay_type in ('salary', 'advance', 'bonus')),
  amount     numeric(12, 2) not null check (amount > 0),
  paid_on    date not null default current_date,
  note       text,
  created_at timestamptz not null default now(),
  foreign key (staff_id, farm_id) references public.staff (id, farm_id) on delete cascade
);
create index staff_payments_farm_paid_idx on public.staff_payments (farm_id, paid_on desc);
create index staff_payments_staff_idx on public.staff_payments (staff_id, pay_month);

create trigger set_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.staff_attendance
  for each row execute function public.set_updated_at();

-- Pay and attendance are private to owners and managers.
do $$
declare t text;
begin
  foreach t in array array['staff', 'staff_attendance', 'staff_payments']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.has_farm_role(farm_id, array[''owner'', ''manager'']))
         with check (public.has_farm_role(farm_id, array[''owner'', ''manager'']))',
      t || ': managers only', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Layer flock health
-- ---------------------------------------------------------------------
create table public.flock_health_records (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  flock_id         uuid not null,
  record_date      date not null default current_date,
  record_type      text not null default 'vaccination'
                   check (record_type in ('vaccination', 'deworming', 'parasite_control', 'treatment', 'checkup')),
  product          text not null check (char_length(trim(product)) between 1 and 160),
  dose             text,
  batch_number     text,
  vet_name         text,
  cost             numeric(12, 2) check (cost is null or cost >= 0),
  interval_days    integer check (interval_days is null or interval_days > 0),
  next_due_date    date,
  withdrawal_until date,
  notes            text,
  created_by       uuid default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (flock_id, farm_id) references public.flocks (id, farm_id) on delete cascade
);
create index flock_health_flock_idx on public.flock_health_records (flock_id, record_date desc);
create index flock_health_due_idx on public.flock_health_records (farm_id, next_due_date)
  where next_due_date is not null;

create trigger set_updated_at before update on public.flock_health_records
  for each row execute function public.set_updated_at();

alter table public.flock_health_records enable row level security;
create policy "flock_health_records: staff read" on public.flock_health_records
  for select to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "flock_health_records: staff insert" on public.flock_health_records
  for insert to authenticated
  with check (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "flock_health_records: staff update" on public.flock_health_records
  for update to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']))
  with check (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "flock_health_records: managers delete" on public.flock_health_records
  for delete to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']));

-- ---------------------------------------------------------------------
-- One ledger for all money in and out. Manual entries come from
-- transactions; the rest are costs that were already recorded elsewhere,
-- so nothing has to be typed twice. security_invoker keeps row-level
-- security of every underlying table in force.
-- ---------------------------------------------------------------------
create view public.finance_ledger with (security_invoker = true) as
  select t.farm_id, t.txn_date, t.txn_type, t.module, t.category, t.amount,
         t.description, 'manual'::text as source, t.id as source_id, null::uuid as ref_id
    from public.transactions t
  union all
  select h.farm_id, h.record_date, 'expense', 'dairy', 'Medicine & vet', h.cost,
         coalesce(h.product, h.description), 'health', h.id, h.cattle_id
    from public.health_records h
   where h.cost is not null and h.cost > 0
  union all
  select b.farm_id, b.event_date, 'expense', 'dairy', 'Breeding & AI', b.cost,
         coalesce(b.bull_or_semen, b.event_type), 'breeding', b.id, b.cattle_id
    from public.breeding_events b
   where b.cost is not null and b.cost > 0
  union all
  select fh.farm_id, fh.record_date, 'expense', 'layer', 'Medicine & vet', fh.cost,
         fh.product, 'flock_health', fh.id, fh.flock_id
    from public.flock_health_records fh
   where fh.cost is not null and fh.cost > 0
  union all
  select p.farm_id, p.paid_on, 'expense',
         case s.module when 'dairy' then 'dairy' when 'layer' then 'layer' else 'general' end,
         'Labour', p.amount, s.name, 'salary', p.id, p.staff_id
    from public.staff_payments p
    join public.staff s on s.id = p.staff_id and s.farm_id = p.farm_id;

grant select on public.finance_ledger to authenticated;
