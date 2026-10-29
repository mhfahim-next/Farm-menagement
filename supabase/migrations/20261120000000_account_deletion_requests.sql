-- =====================================================================
-- Deleting an account waits 30 days.
--
-- "Delete my account" (website or app) no longer deletes at once. It saves a
-- request with the reason given (optional) and what would be deleted, signs
-- the person out everywhere, and the account is deleted 30 days later by the
-- daily job (/api/cron/deletions). Signing in again within the 30 days
-- cancels the request (a trigger on auth.users sees the new sign-in).
--
-- Super admins see the requests in /admin/deletions with the person's
-- contact details, so they can get in touch and help. They can cancel a
-- request or delete at once. Once deleted, only the reason, the farm types
-- and the dates stay; name, email and phone are cleared.
-- =====================================================================

create table public.account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  -- Cleared (set null) when the account is deleted.
  user_id       uuid references auth.users (id) on delete set null,
  email         text,
  full_name     text,
  phone         text,
  reason        text check (reason in ('too_expensive', 'hard_to_use', 'other_app', 'not_needed', 'privacy', 'other')),
  note          text check (note is null or char_length(note) <= 1000),
  -- What would be deleted, when it was asked: [{name, kinds, animals, flocks, members}] for farms owned,
  -- and the farms they only work on (left, not deleted).
  farms         jsonb not null default '[]'::jsonb,
  other_farms   jsonb not null default '[]'::jsonb,
  source        text not null default 'web' check (source in ('web', 'app')),
  status        text not null default 'pending' check (status in ('pending', 'cancelled', 'deleted')),
  requested_at  timestamptz not null default now(),
  delete_after  timestamptz not null default now() + interval '30 days',
  cancelled_at  timestamptz,
  cancelled_by  text check (cancelled_by in ('login', 'admin')),
  deleted_at    timestamptz,
  deleted_by    text check (deleted_by in ('schedule', 'admin')),
  -- Why the daily job could not delete yet (e.g. someone joined their farm meanwhile).
  blocked       text,
  -- The "your deletion was cancelled" note was shown after signing in.
  notice_seen   boolean not null default false
);
create unique index account_deletion_one_pending on public.account_deletion_requests (user_id) where status = 'pending';
create index account_deletion_due on public.account_deletion_requests (delete_after) where status = 'pending';

alter table public.account_deletion_requests enable row level security;
create policy "account_deletion_requests: admin read" on public.account_deletion_requests
  for select to authenticated using (public.is_super_admin());
revoke all on public.account_deletion_requests from anon, authenticated;
grant select on public.account_deletion_requests to authenticated;

-- ---------------------------------------------------------------------
-- The person asks. Farms they own that others use must be handed over first.
-- ---------------------------------------------------------------------
create or replace function public.request_account_deletion(p_reason text, p_note text, p_source text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  shared text;
  due timestamptz;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  select string_agg(f.name, ', ' order by f.name) into shared
    from public.farms f
   where f.owner_id = uid
     and exists (select 1 from public.farm_members m where m.farm_id = f.id and m.user_id <> uid);
  if shared is not null then
    raise exception 'SHARED_FARM:%', shared using errcode = 'P0001';
  end if;

  -- Asked again while one waits: the newer reason, the same date.
  update public.account_deletion_requests
     set reason = coalesce(p_reason, reason), note = coalesce(nullif(trim(p_note), ''), note)
   where user_id = uid and status = 'pending'
  returning delete_after into due;
  if due is not null then
    return due;
  end if;

  insert into public.account_deletion_requests (user_id, email, full_name, phone, reason, note, source, farms, other_farms)
  select uid, u.email, p.full_name, coalesce(p.phone, u.phone),
         case when p_reason in ('too_expensive', 'hard_to_use', 'other_app', 'not_needed', 'privacy', 'other') then p_reason end,
         left(nullif(trim(p_note), ''), 1000),
         case when p_source = 'app' then 'app' else 'web' end,
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'name', f.name,
                    'plan', f.plan,
                    'kinds', array_remove(array[
                      case when f.has_dairy then 'dairy' end, case when f.has_fattening then 'fattening' end,
                      case when f.has_goat then 'goat' end, case when f.has_layer then 'layer' end,
                      case when f.has_broiler then 'broiler' end], null),
                    'animals', (select count(*) from public.cattle c where c.farm_id = f.id and c.deleted_at is null),
                    'flocks', (select count(*) from public.flocks fl where fl.farm_id = f.id and fl.deleted_at is null),
                    'created_at', f.created_at) order by f.created_at)
             from public.farms f where f.owner_id = uid), '[]'::jsonb),
         coalesce((
           select jsonb_agg(jsonb_build_object('name', f.name, 'role', m.role) order by f.name)
             from public.farm_members m join public.farms f on f.id = m.farm_id
            where m.user_id = uid and f.owner_id <> uid), '[]'::jsonb)
    from auth.users u left join public.profiles p on p.id = u.id
   where u.id = uid
  returning delete_after into due;
  return due;
end;
$$;
revoke all on function public.request_account_deletion(text, text, text) from public, anon;
grant execute on function public.request_account_deletion(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Signing in again within the 30 days cancels the request.
-- ---------------------------------------------------------------------
create or replace function public.cancel_deletion_on_sign_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.account_deletion_requests
       set status = 'cancelled', cancelled_at = now(), cancelled_by = 'login', notice_seen = false
     where user_id = new.id and status = 'pending' and new.last_sign_in_at > requested_at;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_sign_in_cancel_deletion
  after update of last_sign_in_at on auth.users
  for each row execute function public.cancel_deletion_on_sign_in();

-- After signing in: true once when a deletion was just cancelled by it (the app and website say so).
create or replace function public.take_deletion_notice()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  update public.account_deletion_requests
     set notice_seen = true
   where user_id = auth.uid() and status = 'cancelled' and cancelled_by = 'login' and not notice_seen;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;
revoke all on function public.take_deletion_notice() from public, anon;
grant execute on function public.take_deletion_notice() to authenticated;

-- ---------------------------------------------------------------------
-- The deletion itself (the daily job and "Delete now" in the admin, both run
-- on the server with the service key, after removing the person's files).
-- ---------------------------------------------------------------------
create or replace function public.delete_account_now(p_request uuid, p_by text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.account_deletion_requests;
  shared text;
begin
  select * into r from public.account_deletion_requests where id = p_request for update;
  if r.id is null or r.status <> 'pending' then
    return 'not_pending';
  end if;
  if r.user_id is null or not exists (select 1 from auth.users where id = r.user_id) then
    update public.account_deletion_requests
       set status = 'deleted', deleted_at = now(), deleted_by = p_by, email = null, full_name = null, phone = null, note = null, blocked = null
     where id = r.id;
    return 'deleted';
  end if;

  -- Someone joined one of their farms meanwhile: not deleted, the admin sees why.
  select string_agg(f.name, ', ' order by f.name) into shared
    from public.farms f
   where f.owner_id = r.user_id
     and exists (select 1 from public.farm_members m where m.farm_id = f.id and m.user_id <> r.user_id);
  if shared is not null then
    update public.account_deletion_requests set blocked = 'SHARED_FARM:' || shared where id = r.id;
    return 'blocked';
  end if;

  delete from public.farms where owner_id = r.user_id;
  update public.milk_records set created_by = null where created_by = r.user_id;
  update public.health_records set created_by = null where created_by = r.user_id;
  update public.breeding_events set created_by = null where created_by = r.user_id;
  update public.flock_daily_logs set created_by = null where created_by = r.user_id;
  update public.flock_health_records set created_by = null where created_by = r.user_id;
  update public.transactions set created_by = null where created_by = r.user_id;
  update public.cattle_weights set created_by = null where created_by = r.user_id;
  delete from auth.users where id = r.user_id;

  -- Only the reason, the farm types and the dates stay.
  update public.account_deletion_requests
     set status = 'deleted', deleted_at = now(), deleted_by = case when p_by = 'admin' then 'admin' else 'schedule' end,
         email = null, full_name = null, phone = null, note = null, blocked = null,
         farms = coalesce((select jsonb_agg(jsonb_build_object('kinds', x -> 'kinds', 'plan', x -> 'plan', 'animals', x -> 'animals', 'flocks', x -> 'flocks')) from jsonb_array_elements(r.farms) x), '[]'::jsonb),
         other_farms = '[]'::jsonb
   where id = r.id;
  return 'deleted';
end;
$$;
revoke all on function public.delete_account_now(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_account_now(uuid, text) to service_role;

-- The old instant deletion is gone: every deletion waits (or is done by an admin).
drop function if exists public.delete_my_account();

-- ---------------------------------------------------------------------
-- Admin: cancel a request (after talking to the person).
-- ---------------------------------------------------------------------
create or replace function public.admin_cancel_account_deletion(p_request uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.account_deletion_requests
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin'
   where id = p_request and status = 'pending';
  if not found then
    raise exception 'This request is no longer waiting.' using errcode = 'P0002';
  end if;
  perform public.admin_log('account_deletion.cancel', 'user', p_request::text);
end;
$$;
revoke all on function public.admin_cancel_account_deletion(uuid) from public, anon;
grant execute on function public.admin_cancel_account_deletion(uuid) to authenticated;

-- Admin: delete at once. Makes the request due now (logged); the website then
-- deletes it with the service key, or the daily job does.
create or replace function public.admin_delete_account_now(p_request uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.account_deletion_requests set delete_after = now()
   where id = p_request and status = 'pending';
  if not found then
    raise exception 'This request is no longer waiting.' using errcode = 'P0002';
  end if;
  perform public.admin_log('account_deletion.delete_now', 'user', p_request::text);
end;
$$;
revoke all on function public.admin_delete_account_now(uuid) from public, anon;
grant execute on function public.admin_delete_account_now(uuid) to authenticated;

-- Menu badge: requests waiting.
create or replace function public.admin_inbox_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  return jsonb_build_object(
    'requests', (select count(*) from public.requests where status = 'open'),
    'messages', (select count(*) from public.contact_messages where status = 'new'),
    'payments', (select count(*) from public.payments where status = 'pending')
              + (select count(*) from public.farms where plan <> 'free' and plan_expires_at is not null and plan_expires_at < now()),
    'deletions', (select count(*) from public.account_deletion_requests where status = 'pending')
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Privacy policy: deletion now waits 30 days (only the sentences shipped in
-- 20261118000000_privacy_app.sql are replaced; an edited policy is left alone).
-- ---------------------------------------------------------------------
update public.site_pages set
  body_en = replace(replace(body_en,
    'When you delete your account, its data is deleted straight away; copies in our hosting provider''s backups are removed when those backups expire, within 30 days.',
    'When you ask to delete your account, it is deleted 30 days later (signing in again before then keeps it); copies in our hosting provider''s backups are removed when those backups expire, within 30 days after that. The reason you gave for leaving and the dates are kept without your name, email or phone.'),
    'This deletes your account and every farm you own alone, with all its records and photos.',
    'You are signed out at once and the account is deleted 30 days later, with every farm you own alone and all its records and photos. Signing in again within the 30 days cancels the request. Meanwhile our team may contact you to see if we can help.'),
  body_bn = replace(replace(body_bn,
    'অ্যাকাউন্ট মুছলে তার তথ্য সাথে সাথে মুছে যায়; হোস্টিং সেবার ব্যাকআপে থাকা কপি ব্যাকআপের মেয়াদ শেষ হলে, ৩০ দিনের মধ্যে, মুছে যায়।',
    'অ্যাকাউন্ট মোছার অনুরোধ করলে ৩০ দিন পর মুছে যায় (এর আগে আবার লগইন করলে থেকে যায়); হোস্টিং সেবার ব্যাকআপে থাকা কপি এরপর ব্যাকআপের মেয়াদ শেষ হলে, ৩০ দিনের মধ্যে, মুছে যায়। চলে যাওয়ার কারণ আর তারিখগুলো আপনার নাম, ইমেইল বা ফোন ছাড়া রাখা হয়।'),
    'এতে আপনার অ্যাকাউন্ট এবং আপনি একা যে খামারগুলোর মালিক, সেগুলোর সব রেকর্ড ও ছবি মুছে যায়।',
    'সাথে সাথে লগআউট হবেন, আর ৩০ দিন পর অ্যাকাউন্ট মুছে যাবে, সাথে আপনি একা যে খামারগুলোর মালিক সেগুলোর সব রেকর্ড ও ছবি। ৩০ দিনের মধ্যে আবার লগইন করলে অনুরোধ বাতিল হয়। এর মধ্যে সাহায্য করা যায় কিনা দেখতে আমাদের টিম যোগাযোগ করতে পারে।'),
  updated_at = now()
where slug = 'privacy';
