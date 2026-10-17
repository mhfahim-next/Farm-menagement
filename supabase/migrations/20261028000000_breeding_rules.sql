-- =====================================================================
-- Admin-editable breeding rules: gestation (calving), heat cycle,
-- dry-off lead time and voluntary waiting period
-- =====================================================================
alter table public.system_settings
  add column gestation_days integer not null default 283
    check (gestation_days between 240 and 320),
  add column heat_cycle_days integer not null default 21
    check (heat_cycle_days between 14 and 30),
  add column dry_off_days integer not null default 60
    check (dry_off_days between 30 and 90),
  add column voluntary_wait_days integer not null default 60
    check (voluntary_wait_days between 20 and 150);

create or replace function public.admin_set_breeding_rules(
  p_check integer, p_gestation integer, p_heat integer, p_dry integer, p_wait integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_check is null or p_check not between 20 and 120
     or p_gestation is null or p_gestation not between 240 and 320
     or p_heat is null or p_heat not between 14 and 30
     or p_dry is null or p_dry not between 30 and 90
     or p_wait is null or p_wait not between 20 and 150 then
    raise exception 'Breeding rule value out of range.' using errcode = '22023';
  end if;
  update public.system_settings
     set pregnancy_check_days = p_check, gestation_days = p_gestation,
         heat_cycle_days = p_heat, dry_off_days = p_dry,
         voluntary_wait_days = p_wait, updated_at = now()
   where id = 1;
  perform public.admin_log('settings.breeding_rules', 'system', '1',
    jsonb_build_object('check', p_check, 'gestation', p_gestation, 'heat', p_heat,
                       'dry_off', p_dry, 'wait', p_wait));
end;
$$;
revoke execute on function public.admin_set_breeding_rules(integer, integer, integer, integer, integer) from public, anon;
grant execute on function public.admin_set_breeding_rules(integer, integer, integer, integer, integer) to authenticated;
