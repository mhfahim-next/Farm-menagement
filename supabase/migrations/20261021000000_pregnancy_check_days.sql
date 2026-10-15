-- =====================================================================
-- Admin-editable "pregnancy check due after AI" interval (days)
-- =====================================================================
alter table public.system_settings
  add column pregnancy_check_days integer not null default 45
    check (pregnancy_check_days between 20 and 120);

create or replace function public.admin_set_pregnancy_check_days(p_days integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_days is null or p_days < 20 or p_days > 120 then
    raise exception 'Pregnancy check days must be between 20 and 120.' using errcode = '22023';
  end if;
  update public.system_settings
     set pregnancy_check_days = p_days, updated_at = now()
   where id = 1;
  perform public.admin_log('settings.pregnancy_check', 'system', '1',
    jsonb_build_object('days', p_days));
end;
$$;
revoke execute on function public.admin_set_pregnancy_check_days(integer) from public, anon;
grant execute on function public.admin_set_pregnancy_check_days(integer) to authenticated;
