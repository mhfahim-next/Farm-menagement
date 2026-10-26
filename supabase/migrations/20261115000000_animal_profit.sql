-- Profit per animal, and a fix for the farm settings.
--
-- 1. Owners and managers could not save goats / fattening / broiler on the
--    settings page: those columns were added without an UPDATE grant.
-- 2. farms.show_animal_profit: the farm can turn "profit per animal" off.
-- 3. animal_profit_data(): everything the per-animal numbers need for a
--    period, in one call (milk per animal, its own costs and sale, and each
--    section's shared spending). The split itself is in src/lib/animal-profit.ts.

alter table public.farms add column if not exists show_animal_profit boolean not null default true;

grant update (name, location, currency, has_dairy, has_layer, has_goat, has_fattening, has_broiler, show_animal_profit)
  on public.farms to authenticated;

create or replace function public.animal_profit_data(p_farm uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v jsonb;
begin
  -- Money is for owners, managers and workers (not vets); RLS still applies to every read.
  if not public.has_farm_role(p_farm, array['owner', 'manager', 'worker']) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  with animals as (
    select c.id, c.tag_number, c.name, c.category, c.status, c.species, c.is_fattening,
           c.purchase_price, c.purchase_date,
           coalesce(c.purchase_date, c.date_of_birth, c.created_at::date) as joined,
           (select max(s.sale_date) from public.sales s where s.cattle_id = c.id and s.product = 'animal') as sold_on,
           case when c.status in ('dead', 'archived') then c.updated_at::date end as gone_on
      from public.cattle c
     where c.farm_id = p_farm and c.deleted_at is null
  ),
  milk as (
    select cattle_id, sum(quantity_liters) litres
      from public.milk_records
     where farm_id = p_farm and record_date between p_from and p_to
     group by cattle_id
  ),
  health as (
    select cattle_id, sum(cost) cost from public.health_records
     where farm_id = p_farm and record_date between p_from and p_to and cost > 0 group by cattle_id
  ),
  breeding as (
    select cattle_id, sum(cost) cost from public.breeding_events
     where farm_id = p_farm and event_date between p_from and p_to and cost > 0 group by cattle_id
  ),
  sold as (
    select cattle_id, sum(amount) amount from public.sales
     where farm_id = p_farm and product = 'animal' and cattle_id is not null and sale_date between p_from and p_to
     group by cattle_id
  ),
  -- Each section's spending in the period, without costs already booked to one animal.
  spend as (
    select module, sum(amount) amount
      from public.finance_ledger
     where farm_id = p_farm and txn_type = 'expense' and txn_date between p_from and p_to
       and source not in ('health', 'breeding')
     group by module
  ),
  milk_sales as (
    select sum(quantity) litres, sum(amount) amount
      from public.sales
     where farm_id = p_farm and product = 'milk' and unit = 'litre' and sale_date between p_from and p_to
  )
  select jsonb_build_object(
    'animals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'tag_number', a.tag_number, 'name', a.name, 'category', a.category, 'status', a.status,
        'species', a.species, 'is_fattening', a.is_fattening,
        'purchase_price', case when a.purchase_date between p_from and p_to then a.purchase_price end,
        'joined', a.joined, 'left', coalesce(a.sold_on, a.gone_on),
        'milk_litres', coalesce(m.litres, 0),
        'direct_cost', coalesce(h.cost, 0) + coalesce(b.cost, 0),
        'sale_amount', coalesce(s.amount, 0)
      ) order by a.tag_number)
      from animals a
      left join milk m on m.cattle_id = a.id
      left join health h on h.cattle_id = a.id
      left join breeding b on b.cattle_id = a.id
      left join sold s on s.cattle_id = a.id
      -- on the farm at some point in the period
      where a.joined <= p_to and coalesce(a.sold_on, a.gone_on, p_to) >= p_from
    ), '[]'::jsonb),
    'spend', coalesce((select jsonb_object_agg(module, amount) from spend), '{}'::jsonb),
    'milk_sold_litres', coalesce((select litres from milk_sales), 0),
    'milk_sales_amount', coalesce((select amount from milk_sales), 0),
    'milk_rate', (select avg(milk_rate) from public.buyers where farm_id = p_farm and not archived and milk_rate > 0)
  ) into v;
  return v;
end;
$$;

revoke all on function public.animal_profit_data(uuid, date, date) from public, anon;
grant execute on function public.animal_profit_data(uuid, date, date) to authenticated;
