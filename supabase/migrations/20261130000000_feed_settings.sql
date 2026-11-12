-- Each farm's own rule for the daily feed suggestion (Cattle → Feed plan):
-- concentrate per 100 kg body weight, per litre of milk, roughage and water.
-- Stored as numbers in a JSON object; the app checks every value against its
-- limits and falls back to the default for anything missing or wrong.

create table public.feed_settings (
  farm_id    uuid primary key references public.farms (id) on delete cascade,
  rule       jsonb not null default '{}'::jsonb check (jsonb_typeof(rule) = 'object' and length(rule::text) <= 2000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.feed_settings enable row level security;
create policy "feed settings: members read" on public.feed_settings
  for select to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager', 'worker', 'vet']));
create policy "feed settings: managers insert" on public.feed_settings
  for insert to authenticated with check (public.has_farm_role(farm_id, array['owner', 'manager']));
create policy "feed settings: managers update" on public.feed_settings
  for update to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager']))
  with check (public.has_farm_role(farm_id, array['owner', 'manager']));
create policy "feed settings: managers delete" on public.feed_settings
  for delete to authenticated using (public.has_farm_role(farm_id, array['owner', 'manager']));
grant select, insert, update, delete on public.feed_settings to authenticated;
