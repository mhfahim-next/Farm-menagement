-- Reminders: the bell in the app, phone (web push) notifications and an
-- email summary.
--
-- Reminders themselves are not stored: they are worked out from the farm's
-- own records (vaccines due, breeding dates, low stock, ...) each time, so
-- recording the vaccine makes its reminder disappear. Stored here is only
--   * each person's choices (which kinds, which channels, language),
--   * their phones / browsers that accept push messages,
--   * reminders they ticked "done" (hidden until the date changes),
--   * a log of what was sent, so the daily job never sends twice.

-- ---------------------------------------------------------------------
-- Choices, one row per person (missing row = defaults)
-- ---------------------------------------------------------------------
create table public.notification_prefs (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  locale      text not null default 'bn' check (locale in ('en', 'bn')),
  -- Phone notifications: the morning summary and the evening "no milk / eggs entered yet".
  morning     boolean not null default true,
  evening     boolean not null default true,
  email       text not null default 'off' check (email in ('off', 'daily', 'weekly')),
  -- Reminder kinds the person does not want (see src/lib/reminders.ts).
  muted       text[] not null default '{}' check (cardinality(muted) <= 30),
  updated_at  timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;
create policy "notification_prefs: own" on public.notification_prefs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.notification_prefs to authenticated;

-- ---------------------------------------------------------------------
-- Browsers / phones that accept push messages
-- ---------------------------------------------------------------------
create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  endpoint      text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh        text not null check (char_length(p256dh) between 40 and 200),
  auth          text not null check (char_length(auth) between 10 and 100),
  user_agent    text check (char_length(user_agent) <= 300),
  created_at    timestamptz not null default now(),
  last_sent_at  timestamptz,
  failures      int not null default 0
);
create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions: read own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "push_subscriptions: delete own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.push_subscriptions to authenticated;

-- A browser has one endpoint; if someone else signs in on it, it moves to them.
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, failures = 0, created_at = now();
end;
$$;
revoke all on function public.push_subscribe(text, text, text, text) from public, anon;
grant execute on function public.push_subscribe(text, text, text, text) to authenticated;

-- After each send (server only): a browser that keeps failing is skipped after 5 tries.
create or replace function public.push_mark_sent(p_id uuid, p_ok boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.push_subscriptions
     set last_sent_at = case when p_ok then now() else last_sent_at end,
         failures = case when p_ok then 0 else failures + 1 end
   where id = p_id;
$$;
revoke all on function public.push_mark_sent(uuid, boolean) from public, anon, authenticated;
grant execute on function public.push_mark_sent(uuid, boolean) to service_role;

-- ---------------------------------------------------------------------
-- Reminders ticked "done" (key = kind:ref:date, so a new date shows again)
-- ---------------------------------------------------------------------
create table public.reminder_dismissals (
  user_id     uuid not null references auth.users (id) on delete cascade,
  farm_id     uuid not null references public.farms (id) on delete cascade,
  key         text not null check (char_length(key) <= 200),
  created_at  timestamptz not null default now(),
  primary key (user_id, farm_id, key)
);

alter table public.reminder_dismissals enable row level security;
create policy "reminder_dismissals: read own" on public.reminder_dismissals
  for select to authenticated using (user_id = auth.uid());
create policy "reminder_dismissals: add own" on public.reminder_dismissals
  for insert to authenticated with check (user_id = auth.uid() and public.is_member_of(farm_id));
create policy "reminder_dismissals: remove own" on public.reminder_dismissals
  for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.reminder_dismissals to authenticated;

-- ---------------------------------------------------------------------
-- What the scheduled job sent (server only)
-- ---------------------------------------------------------------------
create table public.reminder_sends (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  slot        text not null check (slot in ('morning', 'evening')),
  channel     text not null check (channel in ('push', 'email')),
  items       int not null default 0,
  ok          boolean,
  created_at  timestamptz not null default now(),
  unique (user_id, day, slot, channel)
);
create index reminder_sends_day on public.reminder_sends (day);

alter table public.reminder_sends enable row level security;
-- No policies: only the service role (the scheduled job) reads and writes it.
revoke all on public.reminder_sends from anon, authenticated;

-- ---------------------------------------------------------------------
-- Super admin: how many people get reminders and what went out
-- ---------------------------------------------------------------------
create or replace function public.admin_reminder_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  return jsonb_build_object(
    'push_users', (select count(distinct user_id) from public.push_subscriptions where failures < 5),
    'push_devices', (select count(*) from public.push_subscriptions where failures < 5),
    'email_users', (select count(*) from public.notification_prefs where email <> 'off'),
    'muted_users', (select count(*) from public.notification_prefs where not morning and not evening and email = 'off'),
    'days', coalesce((
      select jsonb_agg(d order by d->>'day' desc)
      from (
        select jsonb_build_object(
          'day', s.day,
          'push', count(*) filter (where s.channel = 'push' and s.ok),
          'email', count(*) filter (where s.channel = 'email' and s.ok),
          'failed', count(*) filter (where s.ok is false)
        ) as d
        from public.reminder_sends s
        where s.day > current_date - 14
        group by s.day
      ) x
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_reminder_stats() from public, anon;
grant execute on function public.admin_reminder_stats() to authenticated;
