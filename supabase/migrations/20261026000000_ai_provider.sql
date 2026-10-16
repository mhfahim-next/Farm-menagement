-- =====================================================================
-- AI provider settings (super admin): which service answers the assistant.
-- API keys are NOT stored here; they live in server environment variables.
-- =====================================================================
alter table public.system_settings
  add column ai_provider text not null default 'anthropic'
    check (ai_provider in ('anthropic', 'gemini', 'custom')),
  add column ai_model    text check (ai_model is null or ai_model ~ '^[A-Za-z0-9._:/-]{1,100}$'),
  add column ai_base_url text check (ai_base_url is null or ai_base_url ~ '^https?://[^\s]{3,255}$');

create or replace function public.admin_set_ai_settings(p_provider text, p_model text, p_base_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_provider not in ('anthropic', 'gemini', 'custom') then
    raise exception 'Unknown AI provider' using errcode = '22023';
  end if;
  if p_provider = 'custom' and (nullif(trim(p_base_url), '') is null or nullif(trim(p_model), '') is null) then
    raise exception 'A custom provider needs a base URL and a model' using errcode = '22023';
  end if;
  update public.system_settings
     set ai_provider = p_provider,
         ai_model = nullif(trim(p_model), ''),
         ai_base_url = case when p_provider = 'custom' then nullif(trim(p_base_url), '') end,
         updated_at = now()
   where id = 1;
  perform public.admin_log('settings.ai_provider', 'system', '1',
    jsonb_build_object('provider', p_provider, 'model', nullif(trim(p_model), '')));
end;
$$;
revoke execute on function public.admin_set_ai_settings(text, text, text) from public, anon;
grant execute on function public.admin_set_ai_settings(text, text, text) to authenticated;
