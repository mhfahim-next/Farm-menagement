-- =====================================================================
-- Paying for a plan
--
-- payment_methods  : bKash, Nagad, Rocket, Upay, bank transfer (manual: the
--                    farmer sends money and types the TrxID, a super admin
--                    checks it) and Stripe / SSLCommerz (online, confirmed by
--                    the provider). Each can be switched on or off.
-- billing_periods  : how many months can be bought at once, with a discount.
-- payments         : every payment and its state. Farmers create them through
--                    payment_create(); only a super admin (manual) or the
--                    server with the service-role key (online) can mark one paid.
-- farms.plan_expires_at : when the paid period ends. Nothing happens on its
--                    own when it passes: the farm is listed for a super admin,
--                    who moves it to Free or extends it.
-- plans.price_monthly_usd : price for visitors outside Bangladesh.
-- =====================================================================

alter table public.plans
  add column if not exists price_monthly_usd numeric(10, 2) check (price_monthly_usd >= 0);
update public.plans set price_monthly_usd = 9 where key = 'pro' and price_monthly_usd is null;
update public.plans set price_monthly_usd = 0 where key = 'free' and price_monthly_usd is null;

alter table public.farms
  add column if not exists plan_expires_at timestamptz;

alter table public.system_settings
  add column if not exists payments_enabled boolean not null default true;

-- ---------------------------------------------------------------------
-- Payment methods
-- ---------------------------------------------------------------------
create table public.payment_methods (
  key              text primary key check (key ~ '^[a-z][a-z0-9_]{1,29}$'),
  kind             text not null check (kind in ('manual', 'stripe', 'sslcommerz')),
  name_en          text not null check (char_length(name_en) between 1 and 40),
  name_bn          text check (name_bn is null or char_length(name_bn) <= 40),
  account_number   text check (account_number is null or char_length(account_number) <= 80),
  account_name     text check (account_name is null or char_length(account_name) <= 80),
  -- "Personal", "Merchant (Payment)", "Agent (Cash out)", bank + branch …
  account_type     text check (account_type is null or char_length(account_type) <= 80),
  instructions_en  text check (instructions_en is null or char_length(instructions_en) <= 1500),
  instructions_bn  text check (instructions_bn is null or char_length(instructions_bn) <= 1500),
  currencies       text[] not null default '{BDT}',
  active           boolean not null default false,
  sort_order       integer not null default 0,
  updated_at       timestamptz not null default now(),
  check (currencies <@ array['BDT', 'USD'] and cardinality(currencies) between 1 and 2)
);

insert into public.payment_methods (key, kind, name_en, name_bn, account_type, instructions_en, instructions_bn, currencies, sort_order) values
  ('bkash', 'manual', 'bKash', 'বিকাশ', 'Personal',
   E'Open the bKash app → Send Money.\nEnter the number above and the exact amount.\nAfter sending, copy the TrxID from the SMS and enter it below.',
   E'বিকাশ অ্যাপ খুলুন → সেন্ড মানি।\nউপরের নম্বর আর ঠিক টাকার পরিমাণ দিন।\nপাঠানোর পর SMS থেকে TrxID কপি করে নিচে লিখুন।',
   '{BDT}', 10),
  ('nagad', 'manual', 'Nagad', 'নগদ', 'Personal',
   E'Open the Nagad app → Send Money.\nEnter the number above and the exact amount.\nAfter sending, enter the Transaction ID below.',
   E'নগদ অ্যাপ খুলুন → সেন্ড মানি।\nউপরের নম্বর আর ঠিক টাকার পরিমাণ দিন।\nপাঠানোর পর ট্রানজেকশন আইডি নিচে লিখুন।',
   '{BDT}', 20),
  ('rocket', 'manual', 'Rocket', 'রকেট', 'Personal',
   E'Dial *322# or open the Rocket app → Send Money.\nAfter sending, enter the TxnID below.',
   E'*322# ডায়াল করুন বা রকেট অ্যাপ খুলুন → সেন্ড মানি।\nপাঠানোর পর TxnID নিচে লিখুন।',
   '{BDT}', 30),
  ('upay', 'manual', 'Upay', 'উপায়', 'Personal',
   E'Open the Upay app → Send Money.\nAfter sending, enter the Transaction ID below.',
   E'উপায় অ্যাপ খুলুন → সেন্ড মানি।\nপাঠানোর পর ট্রানজেকশন আইডি নিচে লিখুন।',
   '{BDT}', 40),
  ('bank', 'manual', 'Bank transfer', 'ব্যাংক ট্রান্সফার', 'Bank name, branch',
   E'Transfer the exact amount to the account above (EFT / NPSB / deposit).\nEnter the transfer reference number below.',
   E'উপরের অ্যাকাউন্টে ঠিক টাকা পাঠান (EFT / NPSB / জমা)।\nট্রান্সফারের রেফারেন্স নম্বর নিচে লিখুন।',
   '{BDT}', 50),
  ('sslcommerz', 'sslcommerz', 'Card, bKash, Nagad & more (SSLCommerz)', 'কার্ড, বিকাশ, নগদ ইত্যাদি (SSLCommerz)', null,
   E'You will be taken to SSLCommerz to pay by card, mobile banking or net banking. Your plan starts as soon as the payment is confirmed.',
   E'SSLCommerz-এ গিয়ে কার্ড, মোবাইল ব্যাংকিং বা নেট ব্যাংকিং দিয়ে পেমেন্ট করবেন। পেমেন্ট নিশ্চিত হলেই প্ল্যান চালু হবে।',
   '{BDT}', 60),
  ('stripe', 'stripe', 'Card (Stripe)', 'কার্ড (Stripe)', null,
   E'You will be taken to Stripe''s secure page to pay by card. Your plan starts as soon as the payment is confirmed.',
   E'Stripe-এর নিরাপদ পাতায় কার্ড দিয়ে পেমেন্ট করবেন। পেমেন্ট নিশ্চিত হলেই প্ল্যান চালু হবে।',
   '{USD}', 70);

create or replace function public.validate_payment_method()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.key <> old.key or new.kind <> old.kind) then
    raise exception 'A payment method''s code and type cannot be changed.' using errcode = '23514';
  end if;
  new.name_en := trim(new.name_en);
  new.name_bn := nullif(trim(new.name_bn), '');
  new.account_number := nullif(trim(new.account_number), '');
  new.account_name := nullif(trim(new.account_name), '');
  new.account_type := nullif(trim(new.account_type), '');
  new.instructions_en := nullif(trim(new.instructions_en), '');
  new.instructions_bn := nullif(trim(new.instructions_bn), '');
  new.currencies := array(select distinct c from unnest(new.currencies) c order by c);
  if new.kind = 'manual' and new.active and new.account_number is null then
    raise exception 'Add the account number before turning this method on.' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger payment_methods_validate
  before insert or update on public.payment_methods
  for each row execute function public.validate_payment_method();

create or replace function public.audit_payment_method()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    perform public.admin_log('payment_method.update', 'payment_method', new.key,
      jsonb_build_object('active', new.active, 'account', new.account_number, 'currencies', new.currencies));
  end if;
  return new;
end;
$$;

create trigger payment_methods_audit
  after insert or update on public.payment_methods
  for each row execute function public.audit_payment_method();

alter table public.payment_methods enable row level security;
create policy "payment methods: read active" on public.payment_methods
  for select to authenticated using (active or public.is_super_admin());
create policy "payment methods: super admin update" on public.payment_methods
  for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

revoke all on public.payment_methods from anon, authenticated;
grant select, update on public.payment_methods to authenticated;

-- ---------------------------------------------------------------------
-- Billing periods (1, 3, 12 months …) with a discount
-- ---------------------------------------------------------------------
create table public.billing_periods (
  months            integer primary key check (months between 1 and 36),
  discount_percent  numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
  active            boolean not null default true,
  updated_at        timestamptz not null default now()
);

insert into public.billing_periods (months, discount_percent, active) values
  (1, 0, true), (3, 5, true), (6, 10, false), (12, 15, true);

create or replace function public.audit_billing_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.billing_periods := case when tg_op = 'DELETE' then old else new end;
begin
  if auth.uid() is not null then
    perform public.admin_log('billing_period.' || lower(tg_op), 'billing_period', r.months::text,
      jsonb_build_object('discount', r.discount_percent, 'active', r.active));
  end if;
  return null;
end;
$$;

create trigger billing_periods_audit
  after insert or update or delete on public.billing_periods
  for each row execute function public.audit_billing_period();

alter table public.billing_periods enable row level security;
create policy "billing periods: read" on public.billing_periods for select to anon, authenticated using (true);
create policy "billing periods: super admin insert" on public.billing_periods
  for insert to authenticated with check (public.is_super_admin());
create policy "billing periods: super admin update" on public.billing_periods
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "billing periods: super admin delete" on public.billing_periods
  for delete to authenticated using (public.is_super_admin());

revoke all on public.billing_periods from anon, authenticated;
grant select on public.billing_periods to anon, authenticated;
grant insert, update, delete on public.billing_periods to authenticated;

-- What a plan costs for some months in a currency (null = not for sale that way).
-- The app shows the same sum (src/lib/payments.ts → priceFor).
create or replace function public.plan_price(p_plan text, p_months integer, p_currency text)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case
           when p_currency = 'USD' and p.price_monthly_usd is not null
             then round(p.price_monthly_usd * b.months * (100 - b.discount_percent) / 100, 2)
           when p_currency = 'BDT' and p.price_monthly is not null
             then round(p.price_monthly * b.months * (100 - b.discount_percent) / 100, 0)
         end
  from public.plans p, public.billing_periods b
  where p.key = p_plan and b.months = p_months;
$$;

-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  receipt_no           bigint generated always as identity unique,
  farm_id              uuid not null references public.farms (id) on delete cascade,
  created_by           uuid references auth.users (id) on delete set null,
  plan                 text not null references public.plans (key),
  months               integer not null check (months between 1 and 36),
  currency             text not null check (currency in ('BDT', 'USD')),
  amount               numeric(10, 2) not null check (amount > 0),
  method               text not null references public.payment_methods (key),
  -- awaiting = sent to Stripe / SSLCommerz, not paid yet · pending = TrxID waiting for a super admin
  status               text not null check (status in ('awaiting', 'pending', 'paid', 'rejected', 'cancelled', 'failed')),
  trx_id               text check (trx_id is null or trx_id ~ '^[A-Za-z0-9-]{4,40}$'),
  provider_ref         text check (provider_ref is null or char_length(provider_ref) <= 200),
  provider_payment_id  text check (provider_payment_id is null or char_length(provider_payment_id) <= 200),
  admin_note           text check (admin_note is null or char_length(admin_note) <= 1000),
  reviewed_by          uuid references auth.users (id) on delete set null,
  reviewed_at          timestamptz,
  paid_at              timestamptz,
  period_start         timestamptz,
  period_end           timestamptz,
  created_at           timestamptz not null default now()
);

create index payments_farm_idx on public.payments (farm_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at);
-- One payment waiting for a super admin per farm.
create unique index payments_one_pending on public.payments (farm_id) where status = 'pending';
-- The same TrxID can't be used twice for a method (a declined one can be sent again).
create unique index payments_trx_unique on public.payments (method, upper(trx_id))
  where trx_id is not null and status in ('pending', 'paid');
create unique index payments_provider_ref_unique on public.payments (method, provider_ref) where provider_ref is not null;

alter table public.payments enable row level security;
create policy "payments: owner/manager read" on public.payments
  for select to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']) or public.is_super_admin());

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- Starts a payment for the current user's farm. Manual methods need the TrxID
-- (status pending); online ones start as awaiting until the provider confirms.
create or replace function public.payment_create(
  p_farm uuid, p_plan text, p_months integer, p_currency text, p_method text, p_trx_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.payment_methods;
  pl public.plans;
  v_amount numeric;
  v_trx text := nullif(upper(regexp_replace(coalesce(p_trx_id, ''), '\s', '', 'g')), '');
  v_id uuid;
begin
  if not public.has_farm_role(p_farm, array['owner', 'manager']) then
    raise exception 'PAY:forbidden' using errcode = '42501';
  end if;
  if not coalesce((select payments_enabled from public.system_settings where id = 1), false) then
    raise exception 'PAY:off' using errcode = '23514';
  end if;
  select * into m from public.payment_methods where key = p_method and active;
  if not found or not (p_currency = any (m.currencies)) then
    raise exception 'PAY:method' using errcode = '23514';
  end if;
  select * into pl from public.plans where key = p_plan and active;
  if not found or p_plan = 'free' then
    raise exception 'PAY:plan' using errcode = '23514';
  end if;
  if not exists (select 1 from public.billing_periods where months = p_months and active) then
    raise exception 'PAY:period' using errcode = '23514';
  end if;
  v_amount := public.plan_price(p_plan, p_months, p_currency);
  if v_amount is null or v_amount <= 0 then
    raise exception 'PAY:price' using errcode = '23514';
  end if;

  if m.kind = 'manual' then
    if v_trx is null or v_trx !~ '^[A-Z0-9-]{4,40}$' then
      raise exception 'PAY:trx' using errcode = '23514';
    end if;
    if exists (select 1 from public.payments where farm_id = p_farm and status = 'pending') then
      raise exception 'PAY:pending' using errcode = '23505';
    end if;
    if exists (select 1 from public.payments where method = p_method and upper(trx_id) = v_trx and status in ('pending', 'paid')) then
      raise exception 'PAY:trx_used' using errcode = '23505';
    end if;
  else
    v_trx := null;
  end if;

  insert into public.payments (farm_id, created_by, plan, months, currency, amount, method, status, trx_id)
  values (p_farm, auth.uid(), p_plan, p_months, p_currency, v_amount, p_method,
          case when m.kind = 'manual' then 'pending' else 'awaiting' end, v_trx)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.payment_create(uuid, text, integer, text, text, text) from public, anon;
grant execute on function public.payment_create(uuid, text, integer, text, text, text) to authenticated;

-- The farmer takes back a TrxID that is still waiting (e.g. typed wrongly).
create or replace function public.payment_cancel(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
begin
  select * into p from public.payments where id = p_id for update;
  if not found or not public.has_farm_role(p.farm_id, array['owner', 'manager']) then
    raise exception 'PAY:forbidden' using errcode = '42501';
  end if;
  if p.status not in ('pending', 'awaiting') then
    raise exception 'PAY:done' using errcode = '23514';
  end if;
  update public.payments set status = 'cancelled' where id = p_id;
end;
$$;
revoke execute on function public.payment_cancel(uuid) from public, anon;
grant execute on function public.payment_cancel(uuid) to authenticated;

-- Gives the farm its plan for the paid months. A renewal of the same plan
-- before it ends continues from the old end date. Internal: not callable.
create or replace function public.payment_apply(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  f public.farms;
  v_start timestamptz;
begin
  select * into p from public.payments where id = p_id for update;
  select * into f from public.farms where id = p.farm_id for update;
  v_start := case
    when f.plan = p.plan and f.plan_expires_at is not null and f.plan_expires_at > now() then f.plan_expires_at
    else now() end;
  update public.farms
     set plan = p.plan,
         plan_expires_at = v_start + make_interval(months => p.months)
   where id = p.farm_id;
  update public.payments
     set status = 'paid',
         paid_at = now(),
         period_start = v_start,
         period_end = v_start + make_interval(months => p.months)
   where id = p_id;
end;
$$;
revoke execute on function public.payment_apply(uuid) from public, anon, authenticated;

-- A super admin accepts (plan starts) or declines a TrxID. An online payment
-- that never got confirmed (e.g. the webhook was missed) can be accepted
-- here too, after checking it in the Stripe / SSLCommerz dashboard.
create or replace function public.admin_review_payment(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
begin
  perform public.admin_assert();
  select * into p from public.payments where id = p_id for update;
  if not found then raise exception 'Payment not found.'; end if;
  if p.status not in ('pending', 'awaiting', 'failed') then raise exception 'This payment has already been handled.'; end if;

  update public.payments
     set admin_note = nullif(trim(p_note), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         status = case when p_approve then status when status = 'pending' then 'rejected' else 'failed' end
   where id = p_id;
  if p_approve then
    perform public.payment_apply(p_id);
  end if;

  perform public.admin_log(case when p_approve then 'payment.approve' else 'payment.reject' end,
    'payment', p_id::text,
    jsonb_build_object('farm', p.farm_id, 'plan', p.plan, 'months', p.months, 'amount', p.amount,
                       'currency', p.currency, 'method', p.method, 'trx', p.trx_id));
end;
$$;
revoke execute on function public.admin_review_payment(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_payment(uuid, boolean, text) to authenticated;

-- A plan whose paid time ended (or is about to): a super admin decides.
--   downgrade : back to Free (data is kept; limits apply again)
--   extend    : add p_months free of charge
--   no_expiry : keep the plan with no end date
create or replace function public.admin_plan_expiry(p_farm uuid, p_action text, p_months integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  f public.farms;
begin
  perform public.admin_assert();
  select * into f from public.farms where id = p_farm for update;
  if not found then raise exception 'Farm not found.'; end if;

  if p_action = 'downgrade' then
    update public.farms set plan = 'free', plan_expires_at = null where id = p_farm;
  elsif p_action = 'extend' then
    if p_months is null or p_months not between 1 and 36 then raise exception 'Choose 1 to 36 months.'; end if;
    update public.farms
       set plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + make_interval(months => p_months)
     where id = p_farm;
  elsif p_action = 'no_expiry' then
    update public.farms set plan_expires_at = null where id = p_farm;
  else
    raise exception 'Unknown action.';
  end if;

  perform public.admin_log('farm.plan_expiry', 'farm', p_farm::text,
    jsonb_build_object('action', p_action, 'months', p_months, 'plan', f.plan, 'was', f.plan_expires_at));
end;
$$;
revoke execute on function public.admin_plan_expiry(uuid, text, integer) from public, anon;
grant execute on function public.admin_plan_expiry(uuid, text, integer) to authenticated;

-- Moving a farm to Free by hand clears its end date.
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

  update public.farms
     set plan = p_plan,
         plan_expires_at = case when p_plan = 'free' then null else plan_expires_at end
   where id = p_farm;
  if not found then raise exception 'Farm not found.'; end if;

  perform public.admin_log('farm.set_plan', 'farm', p_farm::text, jsonb_build_object('plan', p_plan));
end;
$$;

create or replace function public.admin_set_payments_enabled(p_on boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.system_settings set payments_enabled = coalesce(p_on, false), updated_at = now() where id = 1;
  perform public.admin_log('settings.payments', 'system', '1', jsonb_build_object('on', p_on));
end;
$$;
revoke execute on function public.admin_set_payments_enabled(boolean) from public, anon;
grant execute on function public.admin_set_payments_enabled(boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Online payments: only the app server (service-role key) calls these,
-- after it has checked the payment with Stripe / SSLCommerz itself.
-- ---------------------------------------------------------------------
create or replace function public.payment_online_set_ref(p_id uuid, p_ref text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set provider_ref = p_ref where id = p_id and status = 'awaiting';
$$;

-- Returns 'paid', 'already' (seen before), 'mismatch' or 'missing'.
create or replace function public.payment_online_confirm(
  p_id uuid, p_method text, p_provider_payment_id text, p_amount numeric, p_currency text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
begin
  select * into p from public.payments where id = p_id and method = p_method for update;
  if not found then return 'missing'; end if;
  if p.status = 'paid' then return 'already'; end if;
  if p.status not in ('awaiting', 'failed', 'cancelled') then return 'mismatch'; end if;
  if p.currency <> upper(p_currency) or abs(p.amount - p_amount) > 0.009 then
    update public.payments
       set admin_note = left(format('Amount mismatch: paid %s %s', p_amount, p_currency), 1000),
           provider_payment_id = p_provider_payment_id
     where id = p_id;
    return 'mismatch';
  end if;
  update public.payments set provider_payment_id = p_provider_payment_id where id = p_id;
  perform public.payment_apply(p_id);
  return 'paid';
end;
$$;

create or replace function public.payment_online_failed(p_id uuid, p_method text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set status = 'failed' where id = p_id and method = p_method and status = 'awaiting';
$$;

revoke execute on function public.payment_online_set_ref(uuid, text) from public, anon, authenticated;
revoke execute on function public.payment_online_confirm(uuid, text, text, numeric, text) from public, anon, authenticated;
revoke execute on function public.payment_online_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.payment_online_set_ref(uuid, text) to service_role;
grant execute on function public.payment_online_confirm(uuid, text, text, numeric, text) to service_role;
grant execute on function public.payment_online_failed(uuid, text) to service_role;

-- Menu badges: also count payments to check and ended plans to decide on.
create or replace function public.admin_inbox_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  return jsonb_build_object(
    'requests', (select count(*) from public.requests where status = 'open'),
    'messages', (select count(*) from public.contact_messages where status = 'new'),
    'payments', (select count(*) from public.payments where status = 'pending')
              + (select count(*) from public.farms where plan <> 'free' and plan_expires_at is not null and plan_expires_at < now())
  );
end;
$$;
