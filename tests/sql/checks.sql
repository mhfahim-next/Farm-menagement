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

  -- tool settings: everyone reads them, only super admins change them
  perform 1 from public.tool_settings;
  v_ok := false;
  begin
    perform public.admin_save_tool_params('weight', '{"divisor": 9000}'::jsonb);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could change the tool settings'; end if;
  v_ok := false;
  begin
    insert into public.tool_settings (tool, params) values ('weight', '{"divisor": 9000}'::jsonb);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could write tool_settings directly'; end if;
  v_ok := false;
  begin
    perform public.admin_reset_tool_params();
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'a farmer could reset the tool settings'; end if;

  -- farm settings: the owner can change every kind and the profit-per-animal switch
  update public.farms set has_goat = false, has_broiler = false, show_animal_profit = false where id = v_farm;
  if (select has_goat or has_broiler or show_animal_profit from public.farms where id = v_farm) then
    raise exception 'farm settings were not saved';
  end if;
  -- profit per animal: works on your farm, refused on someone else's
  if jsonb_typeof(public.animal_profit_data(v_farm, current_date - 30, current_date)->'animals') <> 'array' then
    raise exception 'animal_profit_data returned no animals list';
  end if;
  v_ok := false;
  begin
    perform public.animal_profit_data(gen_random_uuid(), current_date - 30, current_date);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'animal profit of another farm was readable'; end if;

  -- animal photos: only into your own farm's folder
  if not public.can_write_animal_photo(v_farm::text || '/cow.jpg') then raise exception 'staff could not add an animal photo'; end if;
  if public.can_write_animal_photo(gen_random_uuid()::text || '/cow.jpg') then raise exception 'a photo could go into another farm'; end if;
  if public.can_write_animal_photo('../cow.jpg') then raise exception 'a photo path outside a farm was accepted'; end if;
end $$;

reset role;

-- 4. Deleting your own account (Google Play rule) waits 30 days: refused while others
--    share a farm you own; a request deletes nothing; signing in again cancels it; only
--    the server (service role) deletes, and then only the reason and dates stay.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ci-owner@example.com', '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ci-worker@example.com', '{}', now(), now());
\o /dev/null
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
\o
set local role authenticated;
do $$
declare v_farm uuid;
begin
  v_farm := public.create_farm('CI shared farm', null, 'BDT', true, false, false, false, false);
  perform set_config('ci.farm', v_farm::text, true);
end $$;
reset role;
update public.farms set plan = 'business' where id = current_setting('ci.farm')::uuid;
insert into public.farm_members (farm_id, user_id, role) values (current_setting('ci.farm')::uuid, '00000000-0000-4000-8000-0000000000c3', 'worker');
set local role authenticated;
do $$
declare v_ok boolean := false;
begin
  begin
    perform public.request_account_deletion('too_expensive', 'note', 'app');
  exception when others then v_ok := sqlerrm like 'SHARED_FARM:%';
  end;
  if not v_ok then raise exception 'an owner could delete their account while others share the farm'; end if;
end $$;
reset role;
delete from public.farm_members where user_id = '00000000-0000-4000-8000-0000000000c3';
set local role authenticated;
do $$
declare v_due timestamptz; v_ok boolean := false;
begin
  v_due := public.request_account_deletion('too_expensive', 'Costs too much', 'app');
  if v_due < now() + interval '29 days' then raise exception 'the deletion does not wait 30 days'; end if;
  -- Only the service role deletes; a person can't delete at once or read the requests.
  begin
    perform public.delete_account_now((select id from public.account_deletion_requests limit 1), 'admin');
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'a person could delete an account at once'; end if;
  if exists (select 1 from public.account_deletion_requests) then raise exception 'a non-admin can read deletion requests'; end if;
end $$;
reset role;
do $$
declare r public.account_deletion_requests;
begin
  select * into r from public.account_deletion_requests where user_id = '00000000-0000-4000-8000-0000000000c2';
  if r.status <> 'pending' or r.email <> 'ci-owner@example.com' or r.reason <> 'too_expensive' or jsonb_array_length(r.farms) <> 1 then raise exception 'request not saved as asked'; end if;
  if not exists (select 1 from public.farms where id = current_setting('ci.farm')::uuid) then raise exception 'the request deleted the farm at once'; end if;
end $$;
-- Signing in again cancels it.
update auth.users set last_sign_in_at = now() + interval '1 second' where id = '00000000-0000-4000-8000-0000000000c2';
do $$
begin
  if not exists (select 1 from public.account_deletion_requests where user_id = '00000000-0000-4000-8000-0000000000c2' and status = 'cancelled' and cancelled_by = 'login') then
    raise exception 'signing in again did not cancel the deletion';
  end if;
end $$;
-- Asked again, then deleted by the server: the account and the farm go, only the reason stays.
set local role authenticated;
select public.request_account_deletion('other_app', null, 'web') is not null as asked;
reset role;
do $$
declare v_id uuid; r public.account_deletion_requests;
begin
  select id into v_id from public.account_deletion_requests where user_id = '00000000-0000-4000-8000-0000000000c2' and status = 'pending';
  if public.delete_account_now(v_id, 'schedule') <> 'deleted' then raise exception 'the server could not delete'; end if;
  if exists (select 1 from auth.users where id = '00000000-0000-4000-8000-0000000000c2') then raise exception 'the account was not deleted'; end if;
  if exists (select 1 from public.farms where id = current_setting('ci.farm')::uuid) then raise exception 'the farm owned alone was not deleted'; end if;
  select * into r from public.account_deletion_requests where id = v_id;
  if r.status <> 'deleted' or r.email is not null or r.full_name is not null or r.phone is not null or r.user_id is not null or r.reason <> 'other_app' then
    raise exception 'personal details stayed after deletion';
  end if;
  if has_function_privilege('anon', 'public.request_account_deletion(text, text, text)', 'execute') then raise exception 'visitors can ask to delete accounts'; end if;
  if has_function_privilege('authenticated', 'public.delete_account_now(uuid, text)', 'execute') then raise exception 'people can call delete_account_now'; end if;
  if exists (select 1 from pg_proc where proname = 'delete_my_account') then raise exception 'the instant delete is still there'; end if;
end $$;
rollback;
\echo 'database checks passed'
