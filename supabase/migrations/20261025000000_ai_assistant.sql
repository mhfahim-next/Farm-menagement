-- =====================================================================
-- AI chat assistant: monthly prompt limits per plan
--
-- plans.max_ai_prompts : AI prompts a farm may send per calendar month
--                        (null = unlimited). Super admins can edit it.
-- ai_usage             : one row per prompt, written by ai_use_prompt()
-- =====================================================================
alter table public.plans
  add column max_ai_prompts integer check (max_ai_prompts >= 0);

update public.plans set max_ai_prompts = 5   where key = 'free';
update public.plans set max_ai_prompts = 50  where key = 'pro';
update public.plans set max_ai_prompts = 150 where key = 'business';

create table public.ai_usage (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references public.farms (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  model          text,
  input_tokens   integer,
  output_tokens  integer,
  created_at     timestamptz not null default now()
);
create index ai_usage_farm_month_idx on public.ai_usage (farm_id, created_at desc);

alter table public.ai_usage enable row level security;
create policy "ai_usage: members read" on public.ai_usage
  for select to authenticated using (public.is_farm_member(farm_id));
-- Rows are only written through the functions below.
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

-- Start of the current month in Bangladesh time.
create or replace function public.ai_month_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka';
$$;

-- { used, max } for the farm this month (max null = unlimited).
create or replace function public.ai_prompts_status(p_farm uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_max  integer;
  v_used integer;
begin
  if auth.uid() is null or not public.is_farm_member(p_farm) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  select p.max_ai_prompts into v_max
  from public.farms f join public.plans p on p.key = f.plan
  where f.id = p_farm;
  select count(*) into v_used from public.ai_usage
  where farm_id = p_farm and created_at >= public.ai_month_start();
  return jsonb_build_object('used', v_used, 'max', v_max);
end;
$$;

-- Reserves one prompt (race-safe) or raises PLAN_LIMIT:ai:<max>.
create or replace function public.ai_use_prompt(p_farm uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max  integer;
  v_used integer;
  v_id   uuid;
begin
  if auth.uid() is null or not public.has_farm_role(p_farm, array['owner', 'manager', 'worker']) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('ai:' || p_farm::text));

  select p.max_ai_prompts into v_max
  from public.farms f join public.plans p on p.key = f.plan
  where f.id = p_farm;

  select count(*) into v_used from public.ai_usage
  where farm_id = p_farm and created_at >= public.ai_month_start();

  if v_max is not null and v_used >= v_max then
    raise exception 'PLAN_LIMIT:ai:%', v_max using errcode = '23514';
  end if;

  insert into public.ai_usage (farm_id, user_id) values (p_farm, auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.ai_record_usage(p_id uuid, p_model text, p_in integer, p_out integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
     set model = p_model, input_tokens = p_in, output_tokens = p_out
   where id = p_id and user_id = auth.uid();
$$;

-- Gives the prompt back when the AI service failed (recent own prompts only).
create or replace function public.ai_cancel_prompt(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.ai_usage
   where id = p_id and user_id = auth.uid() and created_at > now() - interval '15 minutes';
$$;

revoke execute on function
  public.ai_prompts_status(uuid), public.ai_use_prompt(uuid),
  public.ai_record_usage(uuid, text, integer, integer), public.ai_cancel_prompt(uuid)
  from public, anon;
grant execute on function
  public.ai_prompts_status(uuid), public.ai_use_prompt(uuid),
  public.ai_record_usage(uuid, text, integer, integer), public.ai_cancel_prompt(uuid)
  to authenticated;
