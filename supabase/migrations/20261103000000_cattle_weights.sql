-- =====================================================================
-- Cattle weight history (scale, measuring tape or estimate)
-- =====================================================================
create table public.cattle_weights (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  cattle_id   uuid not null,
  weigh_date  date not null default current_date,
  weight_kg   numeric(7, 2) not null check (weight_kg > 0 and weight_kg <= 2000),
  method      text not null default 'scale' check (method in ('scale', 'tape', 'estimate')),
  heart_girth_cm numeric(6, 1) check (heart_girth_cm is null or heart_girth_cm between 30 and 400),
  body_length_cm numeric(6, 1) check (body_length_cm is null or body_length_cm between 30 and 400),
  notes       text check (notes is null or char_length(notes) <= 300),
  created_by  uuid default auth.uid() references auth.users (id),
  created_at  timestamptz not null default now(),
  foreign key (cattle_id, farm_id) references public.cattle (id, farm_id) on delete cascade
);
create index cattle_weights_cattle_idx on public.cattle_weights (cattle_id, weigh_date desc);
create index cattle_weights_farm_idx on public.cattle_weights (farm_id, weigh_date desc);

alter table public.cattle_weights enable row level security;
create policy "cattle_weights: members read" on public.cattle_weights
  for select to authenticated using (public.is_farm_member(farm_id));
create policy "cattle_weights: staff insert" on public.cattle_weights
  for insert to authenticated with check (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "cattle_weights: staff update" on public.cattle_weights
  for update to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']))
  with check (public.has_farm_role(farm_id, array['owner', 'manager', 'worker']));
create policy "cattle_weights: managers delete" on public.cattle_weights
  for delete to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager']));

-- Latest weight per animal (for lists). security_invoker keeps the table's RLS.
create view public.cattle_latest_weight with (security_invoker = true) as
  select distinct on (cattle_id) cattle_id, farm_id, weigh_date, weight_kg
    from public.cattle_weights
   order by cattle_id, weigh_date desc, created_at desc;
grant select on public.cattle_latest_weight to authenticated;
