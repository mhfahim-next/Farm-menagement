-- =====================================================================
-- Step A: the farm's real costs and income.
--   1. Stock of feed, medicine and other supplies (purchases, use, counts).
--      Purchases appear in the finance ledger as expenses automatically.
--   2. Sales of milk, eggs and animals to buyers, with payments and dues.
--      Sales appear in the ledger as income automatically.
-- Same access as money records: owner/manager/worker read and write,
-- owner/manager delete, vets have no access.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Inventory
-- ---------------------------------------------------------------------
create table public.inventory_items (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 80),
  kind        text not null default 'feed'
              check (kind in ('feed', 'medicine', 'vaccine', 'supplement', 'other')),
  unit        text not null default 'kg'
              check (unit in ('kg', 'bag', 'litre', 'ml', 'dose', 'piece', 'packet', 'bottle')),
  -- Weight of one unit in kg (e.g. 50 for a 50 kg bag), so daily flock feed in kg can be taken from stock.
  unit_kg     numeric(10, 3) check (unit_kg is null or unit_kg > 0),
  module      text not null default 'general' check (module in ('dairy', 'layer', 'general')),
  low_stock   numeric(14, 3) check (low_stock is null or low_stock >= 0),
  notes       text check (notes is null or char_length(notes) <= 500),
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index inventory_items_name_idx on public.inventory_items (farm_id, lower(trim(name)));
create trigger set_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();

create table public.inventory_moves (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  item_id     uuid not null references public.inventory_items (id) on delete cascade,
  move_date   date not null default current_date,
  -- purchase/use are positive amounts; adjust (stock count) may be + or −.
  move_type   text not null check (move_type in ('purchase', 'use', 'adjust')),
  quantity    numeric(14, 3) not null check (quantity <> 0),
  unit_cost   numeric(14, 2) check (unit_cost is null or unit_cost >= 0),
  total_cost  numeric(14, 2) check (total_cost is null or total_cost >= 0),
  -- For use: which part of the farm used it (and which flock, if known).
  module      text check (module is null or module in ('dairy', 'layer', 'general')),
  flock_id    uuid references public.flocks (id) on delete set null,
  -- Set when the use comes from a flock's daily log (kept in step with it).
  log_id      uuid unique references public.flock_daily_logs (id) on delete cascade,
  supplier    text check (supplier is null or char_length(supplier) <= 80),
  notes       text check (notes is null or char_length(notes) <= 500),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (move_type = 'adjust' or quantity > 0),
  check (move_type = 'purchase' or (unit_cost is null and total_cost is null)),
  check (unit_cost is null or total_cost is null or abs(total_cost - round(quantity * unit_cost, 2)) < 0.01)
);
create index inventory_moves_item_idx on public.inventory_moves (item_id, move_date desc);
create index inventory_moves_farm_idx on public.inventory_moves (farm_id, move_date desc);
create trigger set_updated_at before update on public.inventory_moves
  for each row execute function public.set_updated_at();

-- Flock daily logs can say which feed was used; its kg come off that item's stock.
alter table public.flock_daily_logs
  add column feed_item_id uuid references public.inventory_items (id) on delete set null;

-- Current stock per item.
create or replace view public.inventory_stock with (security_invoker = true) as
select i.*,
       coalesce(sum(case m.move_type when 'purchase' then m.quantity when 'use' then -m.quantity else m.quantity end), 0) as on_hand,
       coalesce(sum(m.quantity) filter (where m.move_type = 'purchase'), 0) as purchased,
       -- average cost of what was bought (null when nothing had a price)
       sum(m.total_cost) filter (where m.move_type = 'purchase' and m.total_cost is not null)
         / nullif(sum(m.quantity) filter (where m.move_type = 'purchase' and m.total_cost is not null), 0) as avg_cost,
       coalesce(sum(m.quantity) filter (where m.move_type = 'use' and m.move_date > current_date - 30), 0) as used_30d,
       max(m.move_date) filter (where m.move_type = 'purchase') as last_purchase
  from public.inventory_items i
  left join public.inventory_moves m on m.item_id = i.id
 group by i.id;

-- ---------------------------------------------------------------------
-- 2. Buyers, sales and payments
-- ---------------------------------------------------------------------
create table public.buyers (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  name             text not null check (char_length(trim(name)) between 1 and 80),
  phone            text check (phone is null or char_length(phone) <= 20),
  -- Usual rates, filled in when recording a sale.
  milk_rate        numeric(10, 2) check (milk_rate is null or milk_rate >= 0),
  egg_rate         numeric(10, 2) check (egg_rate is null or egg_rate >= 0),
  notes            text check (notes is null or char_length(notes) <= 500),
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index buyers_name_idx on public.buyers (farm_id, lower(trim(name)));
create trigger set_updated_at before update on public.buyers
  for each row execute function public.set_updated_at();

create table public.sales (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references public.farms (id) on delete cascade,
  buyer_id     uuid references public.buyers (id) on delete restrict,
  sale_date    date not null default current_date,
  product      text not null check (product in ('milk', 'eggs', 'animal', 'manure', 'other')),
  module       text not null check (module in ('dairy', 'layer', 'general')),
  quantity     numeric(14, 3) not null check (quantity > 0),
  unit         text not null check (unit in ('litre', 'kg', 'piece', 'hali', 'dozen', 'tray', 'head', 'other')),
  unit_price   numeric(14, 2) check (unit_price is null or unit_price >= 0),
  amount       numeric(14, 2) not null check (amount > 0),
  -- Paid on the spot; the rest is owed by the buyer.
  paid_amount  numeric(14, 2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
  fat_percent  numeric(4, 2) check (fat_percent is null or fat_percent between 0 and 15),
  snf_percent  numeric(4, 2) check (snf_percent is null or snf_percent between 0 and 15),
  cattle_id    uuid references public.cattle (id) on delete set null,
  flock_id     uuid references public.flocks (id) on delete set null,
  notes        text check (notes is null or char_length(notes) <= 500),
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (unit_price is null or abs(amount - round(quantity * unit_price, 2)) < 0.01),
  -- A sale on credit must name the buyer.
  check (buyer_id is not null or paid_amount = amount)
);
create index sales_farm_date_idx on public.sales (farm_id, sale_date desc);
create index sales_buyer_idx on public.sales (buyer_id, sale_date desc);
create trigger set_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

create table public.buyer_payments (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  buyer_id    uuid not null references public.buyers (id) on delete cascade,
  pay_date    date not null default current_date,
  amount      numeric(14, 2) not null check (amount > 0),
  method      text not null default 'cash' check (method in ('cash', 'bkash', 'nagad', 'rocket', 'bank', 'other')),
  notes       text check (notes is null or char_length(notes) <= 500),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index buyer_payments_buyer_idx on public.buyer_payments (buyer_id, pay_date desc);

-- What each buyer owes (negative = paid in advance).
create or replace view public.buyer_balances with (security_invoker = true) as
select b.*,
       coalesce(s.total, 0) as total_sales,
       coalesce(s.paid, 0) + coalesce(p.total, 0) as total_paid,
       coalesce(s.total, 0) - coalesce(s.paid, 0) - coalesce(p.total, 0) as due,
       s.last_sale,
       p.last_payment
  from public.buyers b
  left join (select buyer_id, sum(amount) total, sum(paid_amount) paid, max(sale_date) last_sale
               from public.sales group by buyer_id) s on s.buyer_id = b.id
  left join (select buyer_id, sum(amount) total, max(pay_date) last_payment
               from public.buyer_payments group by buyer_id) p on p.buyer_id = b.id;

-- ---------------------------------------------------------------------
-- Records must point at things on the same farm.
-- ---------------------------------------------------------------------
create or replace function public.check_same_farm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'inventory_moves' then
    if not exists (select 1 from public.inventory_items where id = new.item_id and farm_id = new.farm_id) then
      raise exception 'Unknown stock item.' using errcode = '23514';
    end if;
    if new.flock_id is not null and not exists (select 1 from public.flocks where id = new.flock_id and farm_id = new.farm_id) then
      raise exception 'Unknown flock.' using errcode = '23514';
    end if;
  elsif tg_table_name = 'sales' then
    if new.buyer_id is not null and not exists (select 1 from public.buyers where id = new.buyer_id and farm_id = new.farm_id) then
      raise exception 'Unknown buyer.' using errcode = '23514';
    end if;
    if new.cattle_id is not null and not exists (select 1 from public.cattle where id = new.cattle_id and farm_id = new.farm_id) then
      raise exception 'Unknown animal.' using errcode = '23514';
    end if;
    if new.flock_id is not null and not exists (select 1 from public.flocks where id = new.flock_id and farm_id = new.farm_id) then
      raise exception 'Unknown flock.' using errcode = '23514';
    end if;
  elsif tg_table_name = 'buyer_payments' then
    if not exists (select 1 from public.buyers where id = new.buyer_id and farm_id = new.farm_id) then
      raise exception 'Unknown buyer.' using errcode = '23514';
    end if;
  elsif tg_table_name = 'flock_daily_logs' then
    if new.feed_item_id is not null and not exists (
      select 1 from public.inventory_items where id = new.feed_item_id and farm_id = new.farm_id
    ) then
      raise exception 'Unknown stock item.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger check_same_farm before insert or update on public.inventory_moves
  for each row execute function public.check_same_farm();
create trigger check_same_farm before insert or update on public.sales
  for each row execute function public.check_same_farm();
create trigger check_same_farm before insert or update on public.buyer_payments
  for each row execute function public.check_same_farm();
create trigger check_same_farm before insert or update of feed_item_id on public.flock_daily_logs
  for each row execute function public.check_same_farm();

-- Selling an animal marks it as sold.
create or replace function public.sale_marks_animal_sold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.product = 'animal' and new.cattle_id is not null then
    update public.cattle set status = 'sold'
    where id = new.cattle_id and farm_id = new.farm_id and status = 'active';
  end if;
  return new;
end;
$$;
create trigger sale_marks_animal_sold after insert or update of cattle_id on public.sales
  for each row execute function public.sale_marks_animal_sold();

-- A flock's daily feed (kg) is taken from the chosen stock item, and kept in
-- step when the log changes or is deleted (the move is deleted with the log).
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
  insert into public.inventory_moves (farm_id, item_id, move_date, move_type, quantity, module, flock_id, log_id, created_by)
  values (new.farm_id, new.feed_item_id, new.log_date, 'use', round(v_qty, 3), 'layer', new.flock_id, new.id, auth.uid())
  on conflict (log_id) do update set
    item_id = excluded.item_id, move_date = excluded.move_date, quantity = excluded.quantity, flock_id = excluded.flock_id;
  return new;
end;
$$;
create trigger sync_flock_feed_use after insert or update of feed_item_id, feed_kg, log_date on public.flock_daily_logs
  for each row execute function public.sync_flock_feed_use();

-- ---------------------------------------------------------------------
-- Access: staff read/insert/update, owners & managers delete, vets nothing.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  staff text := 'public.has_farm_role(farm_id, array[''owner'', ''manager'', ''worker''])';
  mgr text := 'public.has_farm_role(farm_id, array[''owner'', ''manager''])';
begin
  foreach t in array array['inventory_items', 'inventory_moves', 'buyers', 'sales', 'buyer_payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (%s)', t || ': staff read', t, staff);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', t || ': staff insert', t, staff);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', t || ': staff update', t, staff, staff);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', t || ': managers delete', t, mgr);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;
grant select on public.inventory_stock, public.buyer_balances to authenticated;

-- ---------------------------------------------------------------------
-- The finance ledger now includes stock purchases (expense) and sales (income).
-- ---------------------------------------------------------------------
create or replace view public.finance_ledger with (security_invoker = true) as
  select t.farm_id, t.txn_date, t.txn_type, t.module, t.category, t.amount,
         t.description, 'manual'::text as source, t.id as source_id, null::uuid as ref_id,
         t.quantity, t.unit_price
    from public.transactions t
  union all
  select h.farm_id, h.record_date, 'expense', 'dairy', 'Medicine & vet', h.cost,
         coalesce(h.product, h.description), 'health', h.id, h.cattle_id, null, null
    from public.health_records h
   where h.cost is not null and h.cost > 0
  union all
  select b.farm_id, b.event_date, 'expense', 'dairy', 'Breeding & AI', b.cost,
         coalesce(b.bull_or_semen, b.event_type), 'breeding', b.id, b.cattle_id, null, null
    from public.breeding_events b
   where b.cost is not null and b.cost > 0
  union all
  select fh.farm_id, fh.record_date, 'expense', 'layer', 'Medicine & vet', fh.cost,
         fh.product, 'flock_health', fh.id, fh.flock_id, null, null
    from public.flock_health_records fh
   where fh.cost is not null and fh.cost > 0
  union all
  select p.farm_id, p.paid_on, 'expense',
         case s.module when 'dairy' then 'dairy' when 'layer' then 'layer' else 'general' end,
         'Labour', p.amount, s.name, 'salary', p.id, p.staff_id, null, null
    from public.staff_payments p
    join public.staff s on s.id = p.staff_id and s.farm_id = p.farm_id
  union all
  select m.farm_id, m.move_date, 'expense', i.module,
         case i.kind when 'feed' then 'Feed' when 'supplement' then 'Feed'
                     when 'medicine' then 'Medicine & vet' when 'vaccine' then 'Medicine & vet'
                     else 'Other expense' end,
         m.total_cost::numeric(12, 2), i.name, 'inventory', m.id, m.item_id, m.quantity, m.unit_cost
    from public.inventory_moves m
    join public.inventory_items i on i.id = m.item_id
   where m.move_type = 'purchase' and m.total_cost is not null and m.total_cost > 0
  union all
  select s.farm_id, s.sale_date, 'income', s.module,
         case s.product when 'milk' then 'Milk sales' when 'eggs' then 'Egg sales'
                        when 'animal' then 'Animal sales' when 'manure' then 'Manure sales'
                        else 'Other income' end,
         s.amount::numeric(12, 2), b.name, 'sale', s.id, s.buyer_id, s.quantity, s.unit_price
    from public.sales s
    left join public.buyers b on b.id = s.buyer_id;

-- ---------------------------------------------------------------------
-- Monthly totals for the cost & profit page (runs with the caller's
-- rights, so RLS decides what is counted).
-- ---------------------------------------------------------------------
create or replace function public.farm_monthly_summary(p_farm uuid, p_from date, p_to date)
returns table (
  month date,
  milk_litres numeric, eggs_collected numeric, eggs_broken numeric, layer_feed_kg numeric,
  dairy_income numeric, dairy_expense numeric, layer_income numeric, layer_expense numeric,
  general_income numeric, general_expense numeric,
  dairy_feed_expense numeric, layer_feed_expense numeric,
  milk_sold_litres numeric, milk_sales_amount numeric, eggs_sold numeric, egg_sales_amount numeric
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
    select date_trunc('month', log_date)::date m, sum(eggs_collected) c, sum(eggs_broken) b, sum(coalesce(feed_kg, 0)) feed
      from public.flock_daily_logs where farm_id = p_farm and log_date between p_from and p_to group by 1
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
           sum(amount) filter (where module = 'layer' and txn_type = 'expense' and category = 'Feed') lf
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
         coalesce(sold.ml, 0), coalesce(sold.ma, 0), coalesce(sold.es, 0), coalesce(sold.ea, 0)
    from months mo
    left join milk on milk.m = mo.month
    left join eggs on eggs.m = mo.month
    left join money on money.m = mo.month
    left join sold on sold.m = mo.month
   order by mo.month;
$$;
revoke execute on function public.farm_monthly_summary(uuid, date, date) from public, anon;
grant execute on function public.farm_monthly_summary(uuid, date, date) to authenticated;
