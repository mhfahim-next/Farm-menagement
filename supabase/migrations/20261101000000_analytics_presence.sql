-- =====================================================================
-- First-party analytics (page views) and where users sign in from
-- (IP + approximate location from the hosting edge's geo headers).
-- Only super admins can read any of it.
-- =====================================================================

-- Last known IP / approximate location per user.
create table public.user_presence (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  ip           text,
  country      text,
  region       text,
  city         text,
  latitude     double precision check (latitude between -90 and 90),
  longitude    double precision check (longitude between -180 and 180),
  user_agent   text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Every sign-in (history).
create table public.login_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null default 'login' check (kind in ('login', 'signup')),
  ip          text,
  country     text,
  region      text,
  city        text,
  latitude    double precision,
  longitude   double precision,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index login_events_created_idx on public.login_events (created_at desc);
create index login_events_user_idx on public.login_events (user_id, created_at desc);

-- Anonymous page views. No IP is stored; visitor_id is a random id kept in the browser.
create table public.page_views (
  id           bigint generated always as identity primary key,
  path         text not null check (char_length(path) between 1 and 300),
  referrer     text check (referrer is null or char_length(referrer) <= 200),
  visitor_id   text check (visitor_id is null or char_length(visitor_id) <= 64),
  user_id      uuid references auth.users (id) on delete set null,
  country      text check (country is null or char_length(country) <= 2),
  device       text check (device in ('mobile', 'tablet', 'desktop')),
  locale       text check (locale is null or char_length(locale) <= 5),
  created_at   timestamptz not null default now()
);
create index page_views_created_idx on public.page_views (created_at desc);

alter table public.user_presence enable row level security;
alter table public.login_events  enable row level security;
alter table public.page_views    enable row level security;

create policy "user_presence: own or admin" on public.user_presence
  for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy "login_events: own or admin" on public.login_events
  for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy "page_views: admin read" on public.page_views
  for select to authenticated using (public.is_super_admin());
-- No insert/update policies: writes only go through the functions below.

-- ---------------------------------------------------------------------
-- Record where the signed-in user is (called by the server, which reads
-- the IP and geo headers). Updates presence; adds a login_events row for
-- sign-ins and sign-ups.
-- ---------------------------------------------------------------------
create or replace function public.record_presence(
  p_kind text, p_ip text, p_country text, p_region text, p_city text,
  p_lat double precision, p_lon double precision, p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;
  if p_lat is not null and (p_lat not between -90 and 90) then p_lat := null; end if;
  if p_lon is not null and (p_lon not between -180 and 180) then p_lon := null; end if;
  p_ip := left(p_ip, 64);
  p_country := upper(left(p_country, 2));
  p_region := left(p_region, 80);
  p_city := left(p_city, 80);
  p_user_agent := left(p_user_agent, 300);

  insert into public.user_presence as up (user_id, ip, country, region, city, latitude, longitude, user_agent)
  values (v_uid, p_ip, p_country, p_region, p_city, p_lat, p_lon, p_user_agent)
  on conflict (user_id) do update set
    ip = excluded.ip,
    country = coalesce(excluded.country, up.country),
    region = coalesce(excluded.region, up.region),
    city = coalesce(excluded.city, up.city),
    latitude = coalesce(excluded.latitude, up.latitude),
    longitude = coalesce(excluded.longitude, up.longitude),
    user_agent = excluded.user_agent,
    last_seen_at = now();

  if p_kind in ('login', 'signup') then
    insert into public.login_events (user_id, kind, ip, country, region, city, latitude, longitude, user_agent)
    values (v_uid, p_kind, p_ip, p_country, p_region, p_city, p_lat, p_lon, p_user_agent);
  end if;
end;
$$;
revoke execute on function public.record_presence(text, text, text, text, text, double precision, double precision, text) from public, anon;
grant execute on function public.record_presence(text, text, text, text, text, double precision, double precision, text) to authenticated;

-- Page view beacon (visitors may be signed out).
create or replace function public.track_page_view(
  p_path text, p_referrer text, p_visitor text, p_country text, p_device text, p_locale text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_path is null or p_path !~ '^/' then return; end if;
  insert into public.page_views (path, referrer, visitor_id, user_id, country, device, locale)
  values (
    left(p_path, 300),
    nullif(left(p_referrer, 200), ''),
    nullif(left(p_visitor, 64), ''),
    auth.uid(),
    nullif(upper(left(p_country, 2)), ''),
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device else null end,
    nullif(left(p_locale, 5), '')
  );
end;
$$;
grant execute on function public.track_page_view(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Dashboard numbers for super admins.
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_result jsonb;
begin
  perform public.admin_assert();
  p_days := greatest(1, least(coalesce(p_days, 30), 365));
  v_from := date_trunc('day', now()) - make_interval(days => p_days - 1);

  select jsonb_build_object(
    'days', p_days,
    'views', (select count(*) from public.page_views where created_at >= v_from),
    'visitors', (select count(distinct coalesce(visitor_id, user_id::text)) from public.page_views where created_at >= v_from),
    'signups', (select count(*) from auth.users where created_at >= v_from),
    'active_users', (select count(*) from public.user_presence where last_seen_at >= v_from),
    'logins', (select count(*) from public.login_events where created_at >= v_from and kind = 'login'),
    'new_farms', (select count(*) from public.farms where created_at >= v_from),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'views', coalesce(v.n, 0), 'visitors', coalesce(v.u, 0), 'signups', coalesce(s.n, 0)) order by d), '[]'::jsonb)
      from generate_series(v_from, date_trunc('day', now()), interval '1 day') d
      left join (
        select date_trunc('day', created_at) as day, count(*) n, count(distinct coalesce(visitor_id, user_id::text)) u
        from public.page_views where created_at >= v_from group by 1
      ) v on v.day = d
      left join (
        select date_trunc('day', created_at) as day, count(*) n
        from auth.users where created_at >= v_from group by 1
      ) s on s.day = d
    ),
    'top_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', n) order by n desc), '[]'::jsonb)
      from (select path, count(*) n from public.page_views where created_at >= v_from group by path order by n desc limit 10) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('referrer', referrer, 'views', n) order by n desc), '[]'::jsonb)
      from (select referrer, count(*) n from public.page_views where created_at >= v_from and referrer is not null group by referrer order by n desc limit 8) t
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('country', country, 'views', n) order by n desc), '[]'::jsonb)
      from (select coalesce(country, '??') country, count(*) n from public.page_views where created_at >= v_from group by 1 order by n desc limit 10) t
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('device', device, 'views', n) order by n desc), '[]'::jsonb)
      from (select coalesce(device, 'desktop') device, count(*) n from public.page_views where created_at >= v_from group by 1) t
    ),
    'locations', (
      select coalesce(jsonb_agg(jsonb_build_object('lat', lat, 'lng', lng, 'city', city, 'country', country, 'users', n)), '[]'::jsonb)
      from (
        select round(latitude::numeric, 1)::float8 lat, round(longitude::numeric, 1)::float8 lng,
               max(city) city, max(country) country, count(*) n
        from public.user_presence
        where latitude is not null and longitude is not null
        group by 1, 2 order by n desc limit 200
      ) t
    ),
    'recent_logins', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', l.user_id, 'email', u.email, 'name', p.full_name, 'kind', l.kind, 'ip', l.ip,
        'country', l.country, 'city', l.city, 'region', l.region, 'at', l.created_at
      ) order by l.created_at desc), '[]'::jsonb)
      from (select * from public.login_events order by created_at desc limit 20) l
      left join auth.users u on u.id = l.user_id
      left join public.profiles p on p.id = l.user_id
    )
  ) into v_result;
  return v_result;
end;
$$;
revoke execute on function public.admin_analytics(integer) from public, anon;
grant execute on function public.admin_analytics(integer) to authenticated;

-- Keep the page-view table small: views older than 400 days are removed by this helper.
create or replace function public.prune_page_views()
returns void language sql security definer set search_path = '' as $$
  delete from public.page_views where created_at < now() - interval '400 days';
$$;
revoke execute on function public.prune_page_views() from public, anon, authenticated;
