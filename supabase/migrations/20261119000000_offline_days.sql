-- How many days of a farm's records the Android app keeps on the phone for
-- use without internet (health and breeding history, sales, expenses, staff
-- months, flock logs). A super admin changes it in /admin/settings; the app
-- reads it from here. Default: about 12 months.
alter table public.system_settings
  add column offline_days integer not null default 365
    check (offline_days between 30 and 1095);

create or replace function public.admin_set_offline_days(p_days integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_days is null or p_days < 30 or p_days > 1095 then
    raise exception 'Offline days must be between 30 and 1095.' using errcode = '22023';
  end if;
  update public.system_settings
     set offline_days = p_days, updated_at = now()
   where id = 1;
  perform public.admin_log('settings.offline_days', 'system', '1', jsonb_build_object('days', p_days));
end;
$$;
revoke execute on function public.admin_set_offline_days(integer) from public, anon;
grant execute on function public.admin_set_offline_days(integer) to authenticated;
