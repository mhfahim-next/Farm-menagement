-- Adjustable numbers behind the farm tools (/tools and the app's Tools menu).
--
-- The calculators have built-in defaults (src/lib/tools.ts, copied into the
-- app). A super admin can change any of them in /admin/tools. Only the changed
-- values are stored here, one row per group of numbers; with no row the tools
-- use their defaults. Everyone may read (the public tool pages need them);
-- only super admins change them, through the functions below.

create table public.tool_settings (
  tool        text primary key check (tool ~ '^[a-zA-Z]{2,40}$'),
  params      jsonb not null check (jsonb_typeof(params) = 'object' and params <> '{}'::jsonb and pg_column_size(params) < 8000),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);
alter table public.tool_settings enable row level security;
create policy "tool_settings: public read" on public.tool_settings for select to anon, authenticated using (true);

-- Save a group's changed values; an empty object removes the row (back to the defaults).
-- The website checks each value against its allowed range before calling this.
create or replace function public.admin_save_tool_params(p_tool text, p_params jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_params is null or jsonb_typeof(p_params) <> 'object' then
    raise exception 'Tool settings must be an object';
  end if;
  if p_params = '{}'::jsonb then
    delete from public.tool_settings where tool = p_tool;
    perform public.admin_log('tool_settings.reset', 'system', p_tool);
  else
    insert into public.tool_settings (tool, params, updated_at, updated_by)
    values (p_tool, p_params, now(), auth.uid())
    on conflict (tool) do update set params = excluded.params, updated_at = now(), updated_by = auth.uid();
    perform public.admin_log('tool_settings.save', 'system', p_tool, p_params);
  end if;
end;
$$;
revoke execute on function public.admin_save_tool_params(text, jsonb) from public, anon;
grant execute on function public.admin_save_tool_params(text, jsonb) to authenticated;

-- Put every tool back to its defaults.
create or replace function public.admin_reset_tool_params()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.tool_settings where true;
  perform public.admin_log('tool_settings.reset_all', 'system', 'all');
end;
$$;
revoke execute on function public.admin_reset_tool_params() from public, anon;
grant execute on function public.admin_reset_tool_params() to authenticated;
