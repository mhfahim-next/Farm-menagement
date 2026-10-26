-- Database checks run by CI on a freshly migrated database (psql -v ON_ERROR_STOP=1).
-- Each block raises an exception when a rule is broken. Everything runs in a
-- transaction that is rolled back, so the database is left unchanged.
begin;

-- 1. Every table in public has row-level security.
do $$
declare t text;
begin
  select string_agg(c.relname, ', ') into t
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if t is not null then raise exception 'Tables without RLS: %', t; end if;
end $$;

-- 2. Money and admin functions are not callable by the wrong people.
do $$
declare f text;
begin
  -- only the server (service role) may confirm online payments; nobody may call payment_apply
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('payment_apply', 'payment_online_confirm', 'payment_online_set_ref', 'payment_online_failed', 'push_mark_sent') loop
    if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
      raise exception '% must not be callable by app users', f;
    end if;
  end loop;
  -- visitors can't call admin functions or create farms / payments
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'admin\_%' or p.proname in ('create_farm', 'payment_create', 'payment_cancel')) loop
    if has_function_privilege('anon', f, 'execute') then
      raise exception '% must not be callable by visitors', f;
    end if;
  end loop;
end $$;

-- 3. Business rules, as a signed-in farmer.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'ci-farmer@example.com', '{"full_name": "CI Farmer"}', now(), now());

\o /dev/null
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
\o
set local role authenticated;

do $$
declare
  v_farm uuid;
  v_cow uuid;
  v_doe uuid;
  v_batch uuid;
  v_ok boolean;
begin
  v_farm := public.create_farm('CI farm', null, 'BDT', true, false, true, true, true);

  -- the animal type sets species and sex
  insert into public.cattle (farm_id, tag_number, category) values (v_farm, 'C-1', 'cow') returning id into v_cow;
  insert into public.cattle (farm_id, tag_number, category) values (v_farm, 'G-1', 'doe') returning id into v_doe;
  if (select species || ':' || sex from public.cattle where id = v_doe) <> 'goat:female' then
    raise exception 'doe should be a female goat';
  end if;

  -- a goat kid can't have a cow as its mother
  v_ok := false;
  begin
    insert into public.cattle (farm_id, tag_number, category, mother_id) values (v_farm, 'G-2', 'doeling', v_cow);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'goat kid with a cow mother was accepted'; end if;

  -- broiler batch: can't sell more birds than are alive
  insert into public.flocks (farm_id, name, kind, initial_count, placed_date) values (v_farm, 'Batch 1', 'broiler', 100, current_date - 30)
    returning id into v_batch;
  insert into public.flock_daily_logs (farm_id, flock_id, log_date, mortality) values (v_farm, v_batch, current_date - 1, 10);
  v_ok := false;
  begin
    insert into public.sales (farm_id, sale_date, product, module, quantity, unit, unit_price, amount, paid_amount, flock_id, head_count)
    values (v_farm, current_date, 'birds', 'broiler', 200, 'kg', 160, 32000, 32000, v_batch, 91);
  exception when others then v_ok := sqlerrm like 'BIRDS_LEFT:90%';
  end;
  if not v_ok then raise exception 'selling 91 of 90 live birds was accepted'; end if;
  insert into public.sales (farm_id, sale_date, product, module, quantity, unit, unit_price, amount, paid_amount, flock_id, head_count)
  values (v_farm, current_date, 'birds', 'broiler', 180, 'kg', 160, 28800, 28800, v_batch, 90);
  if (select current_count from public.flock_stats where flock_id = v_batch) <> 0 then
    raise exception 'live birds should be 0 after selling all';
  end if;

  -- broiler logs don't count as layer eggs/feed in cost per egg
  if (select layer_feed_kg + eggs_collected from public.farm_monthly_summary(v_farm, current_date - 40, current_date) order by month desc limit 1) <> 0 then
    raise exception 'broiler logs leaked into layer numbers';
  end if;

  -- a farmer can't mark a payment paid or approve one
  v_ok := false;
  begin
    perform public.admin_review_payment(gen_random_uuid(), true, null);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could approve a payment'; end if;

  -- reminders: own choices only, no "done" marks on other farms, no send log, no admin stats
  insert into public.notification_prefs (user_id, email, muted) values (auth.uid(), 'daily', '{stock}');
  v_ok := false;
  begin
    insert into public.notification_prefs (user_id) values ('00000000-0000-4000-8000-0000000000c2');
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could write someone else''s reminder settings'; end if;
  insert into public.reminder_dismissals (user_id, farm_id, key) values (auth.uid(), v_farm, 'vaccine:x:2026-10-26');
  v_ok := false;
  begin
    insert into public.reminder_dismissals (user_id, farm_id, key) values (auth.uid(), gen_random_uuid(), 'vaccine:x:2026-10-26');
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could mark reminders on a farm they are not in'; end if;
  perform public.push_subscribe('https://push.example.com/abc', repeat('p', 87), repeat('a', 22), 'CI');
  if (select count(*) from public.push_subscriptions where user_id = auth.uid()) <> 1 then
    raise exception 'push subscription was not saved';
  end if;
  v_ok := false;
  begin
    perform 1 from public.reminder_sends;
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could read the reminder send log'; end if;
  v_ok := false;
  begin
    perform public.admin_reminder_stats();
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could read reminder stats'; end if;
end $$;

reset role;
rollback;
\echo 'database checks passed'
