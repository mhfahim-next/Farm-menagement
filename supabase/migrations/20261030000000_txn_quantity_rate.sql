-- Income/expense entries can carry a quantity and a rate; amount stays the stored total.
alter table public.transactions
  add column quantity   numeric(14, 3) check (quantity is null or quantity > 0),
  add column unit_price numeric(14, 2) check (unit_price is null or unit_price >= 0),
  add constraint transactions_total_matches check (
    quantity is null or unit_price is null
    or abs(amount - round(quantity * unit_price, 2)) < 0.01
  );

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
    join public.staff s on s.id = p.staff_id and s.farm_id = p.farm_id;
