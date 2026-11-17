-- "Viewer" farm role: sees the farm's records (animals, milk, health,
-- breeding, flocks, stock, sales, money, reports) but cannot add, change or
-- delete anything. For managers or family members who should only look.
--
-- Every insert/update/delete policy and every writing function already names
-- the roles allowed to write (owner, manager, worker), so a viewer cannot
-- write anywhere. This migration only lets viewers read what workers read.
-- Staff salaries, billing, invites and requests stay with owners/managers.

alter table public.farm_members drop constraint farm_members_role_check;
alter table public.farm_members add constraint farm_members_role_check
  check (role in ('owner', 'manager', 'worker', 'vet', 'viewer'));
alter table public.farm_invites drop constraint farm_invites_role_check;
alter table public.farm_invites add constraint farm_invites_role_check
  check (role in ('manager', 'worker', 'vet', 'viewer'));

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, active, can_hide)
values ('member_role', 'viewer', 'Viewer (can only look)', 'শুধু দেখবেন', 35, true, false)
on conflict (list_key, value) do nothing;

drop policy if exists "transactions: staff read" on public.transactions;
create policy "transactions: staff read" on public.transactions
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "flock_health_records: staff read" on public.flock_health_records;
create policy "flock_health_records: staff read" on public.flock_health_records
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "inventory_items: staff read" on public.inventory_items;
create policy "inventory_items: staff read" on public.inventory_items
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "inventory_moves: staff read" on public.inventory_moves;
create policy "inventory_moves: staff read" on public.inventory_moves
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "sales: staff read" on public.sales;
create policy "sales: staff read" on public.sales
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "buyers: staff read" on public.buyers;
create policy "buyers: staff read" on public.buyers
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "buyer_payments: staff read" on public.buyer_payments;
create policy "buyer_payments: staff read" on public.buyer_payments
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));
drop policy if exists "fattening settings: members read" on public.fattening_settings;
create policy "fattening settings: members read" on public.fattening_settings
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'viewer']));

-- Feed plan settings: viewers read them too.
drop policy if exists "feed settings: members read" on public.feed_settings;
create policy "feed settings: members read" on public.feed_settings
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'vet', 'viewer']));

-- Profit per animal: viewers may read it.
CREATE OR REPLACE FUNCTION public.animal_profit_data(p_farm uuid, p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v jsonb;
begin
  -- Money is for owners, managers, workers and viewers (not vets); RLS still applies to every read.
  if not public.has_farm_role(p_farm, array['owner', 'manager', 'worker', 'viewer']) then
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
$function$;

-- The owner changes a member's role (manager / worker / viewer). The owner
-- role and vets (doctor accounts) are not changed here.
create or replace function public.set_member_role(p_farm uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if auth.uid() is null or not public.has_farm_role(p_farm, array['owner']) then
    raise exception 'Only the owner can change roles.' using errcode = '42501';
  end if;
  if p_role not in ('manager', 'worker', 'viewer') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;
  select role into v_current from public.farm_members where farm_id = p_farm and user_id = p_user;
  if v_current is null then
    raise exception 'Not a member.' using errcode = 'P0002';
  end if;
  if v_current in ('owner', 'vet') then
    raise exception 'This member''s role cannot be changed.' using errcode = '42501';
  end if;
  update public.farm_members set role = p_role where farm_id = p_farm and user_id = p_user;
end;
$$;
revoke execute on function public.set_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
