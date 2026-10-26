-- =====================================================================
-- Admin analytics, part 2:
--  * campaign (UTM) tracking on page views
--  * admin_inbox_counts(): numbers for the admin menu badges
--  * admin_analytics_growth / _usage / _sources / _business: funnel,
--    activation, retention, monthly growth, inactive farms, feature use,
--    AI use, traffic sources, campaigns, plans, requests, support.
-- All functions are super-admin only (admin_assert) and read-only.
-- =====================================================================

alter table public.page_views
  add column if not exists utm_source   text check (utm_source is null or char_length(utm_source) <= 60),
  add column if not exists utm_medium   text check (utm_medium is null or char_length(utm_medium) <= 60),
  add column if not exists utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 80);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id, created_at);
create index if not exists page_views_user_idx on public.page_views (user_id, created_at) where user_id is not null;

-- Page view beacon with campaign tags (the older 6-argument version stays for
-- servers that have not been updated yet).
create or replace function public.track_page_view(
  p_path text, p_referrer text, p_visitor text, p_country text, p_device text, p_locale text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_path is null or p_path !~ '^/' then return; end if;
  insert into public.page_views (path, referrer, visitor_id, user_id, country, device, locale, utm_source, utm_medium, utm_campaign)
  values (
    left(p_path, 300),
    nullif(left(p_referrer, 200), ''),
    nullif(left(p_visitor, 64), ''),
    auth.uid(),
    nullif(upper(left(p_country, 2)), ''),
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device else null end,
    nullif(left(p_locale, 5), ''),
    nullif(lower(left(trim(p_utm_source), 60)), ''),
    nullif(lower(left(trim(p_utm_medium), 60)), ''),
    nullif(left(trim(p_utm_campaign), 80), '')
  );
end;
$$;
grant execute on function public.track_page_view(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Menu badges: open requests and unread messages.
-- ---------------------------------------------------------------------
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
    'messages', (select count(*) from public.contact_messages where status = 'new')
  );
end;
$$;
revoke execute on function public.admin_inbox_counts() from public, anon;
grant execute on function public.admin_inbox_counts() to authenticated;

-- Where a visit came from, in one word (campaign tag first, then the referring site).
create or replace function public.analytics_source(p_utm text, p_referrer text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_utm is not null and p_utm <> '' then p_utm
    when p_referrer is null or p_referrer = '' then 'direct'
    when p_referrer ~* '(^|\.)(facebook\.com|fb\.com|fb\.me)$' then 'facebook'
    when p_referrer ~* '(^|\.)(instagram\.com)$' then 'instagram'
    when p_referrer ~* '(^|\.)(linkedin\.com|lnkd\.in)$' then 'linkedin'
    when p_referrer ~* '(^|\.)(youtube\.com|youtu\.be)$' then 'youtube'
    when p_referrer ~* '(^|\.)(t\.co|twitter\.com|x\.com)$' then 'x'
    when p_referrer ~* '(^|\.)(wa\.me|whatsapp\.com)$' then 'whatsapp'
    when p_referrer ~* '(^|\.)google\.' then 'google'
    when p_referrer ~* '(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com)$' then 'search'
    else lower(p_referrer)
  end;
$$;

-- ---------------------------------------------------------------------
-- Growth: comparison with the period before, monthly trend, sign-up funnel,
-- activation, retention and farms that went quiet.
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics_growth(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_prev timestamptz;
  v_cohort timestamptz;
  v_result jsonb;
begin
  perform public.admin_assert();
  p_days := greatest(1, least(coalesce(p_days, 30), 365));
  v_from := date_trunc('day', now()) - make_interval(days => p_days - 1);
  v_prev := v_from - make_interval(days => p_days);
  v_cohort := date_trunc('day', now()) - make_interval(days => greatest(p_days, 90) - 1);

  with
  -- one row per (farm, moment) the farm recorded something
  act as (
    select farm_id, created_at from public.milk_records where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.flock_daily_logs where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.sales where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.transactions where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.health_records where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.breeding_events where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.inventory_moves where created_at >= now() - interval '400 days'
    union all select farm_id, created_at from public.cattle_weights where created_at >= now() - interval '400 days'
  ),
  -- one row per (user, moment) the person used the site while signed in
  ua as (
    select user_id, created_at from public.page_views where user_id is not null and created_at >= now() - interval '400 days'
    union all
    select user_id, created_at from public.login_events where created_at >= now() - interval '400 days'
  ),
  cohort as (
    select u.id, u.created_at,
           (select f.id from public.farms f where f.owner_id = u.id order by f.created_at limit 1) as farm_id
    from auth.users u where u.created_at >= v_from
  ),
  rcohort as (
    select u.id, u.created_at from auth.users u where u.created_at >= v_cohort
  )
  select jsonb_build_object(
    'days', p_days,
    'cur', jsonb_build_object(
      'views', (select count(*) from public.page_views where created_at >= v_from),
      'visitors', (select count(distinct visitor_id) from public.page_views where created_at >= v_from and visitor_id is not null),
      'signups', (select count(*) from auth.users where created_at >= v_from),
      'active_users', (select count(distinct user_id) from ua where created_at >= v_from),
      'logins', (select count(*) from public.login_events where kind = 'login' and created_at >= v_from),
      'new_farms', (select count(*) from public.farms where created_at >= v_from)
    ),
    'prev', jsonb_build_object(
      'views', (select count(*) from public.page_views where created_at >= v_prev and created_at < v_from),
      'visitors', (select count(distinct visitor_id) from public.page_views where created_at >= v_prev and created_at < v_from and visitor_id is not null),
      'signups', (select count(*) from auth.users where created_at >= v_prev and created_at < v_from),
      'active_users', (select count(distinct user_id) from ua where created_at >= v_prev and created_at < v_from),
      'logins', (select count(*) from public.login_events where kind = 'login' and created_at >= v_prev and created_at < v_from),
      'new_farms', (select count(*) from public.farms where created_at >= v_prev and created_at < v_from)
    ),
    'totals', jsonb_build_object(
      'users', (select count(*) from auth.users),
      'farms', (select count(*) from public.farms),
      'cattle', (select count(*) from public.cattle where deleted_at is null),
      'flocks', (select count(*) from public.flocks where deleted_at is null)
    ),
    'monthly', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'month', m::date,
        'users', (select count(*) from auth.users where date_trunc('month', created_at) = m),
        'farms', (select count(*) from public.farms where date_trunc('month', created_at) = m),
        'active_farms', (select count(distinct farm_id) from act where date_trunc('month', created_at) = m)
      ) order by m), '[]'::jsonb)
      from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') m
    ),
    'funnel', jsonb_build_object(
      'visitors', (select count(distinct visitor_id) from public.page_views where created_at >= v_from and visitor_id is not null),
      'signups', (select count(*) from cohort),
      'farms', (select count(*) from cohort where farm_id is not null),
      'animals', (select count(*) from cohort c where farm_id is not null and (
          exists (select 1 from public.cattle x where x.farm_id = c.farm_id) or exists (select 1 from public.flocks x where x.farm_id = c.farm_id))),
      'records', (select count(*) from cohort c where farm_id is not null and exists (select 1 from act a where a.farm_id = c.farm_id))
    ),
    'activation', jsonb_build_object(
      'eligible', (select count(*) from cohort where created_at <= now() - interval '7 days'),
      'activated', (select count(*) from cohort c where c.created_at <= now() - interval '7 days' and (
          select count(distinct (a.created_at at time zone 'Asia/Dhaka')::date) from ua a
          where a.user_id = c.id and a.created_at >= c.created_at and a.created_at < c.created_at + interval '7 days') >= 3)
    ),
    'retention', jsonb_build_object(
      'd1', jsonb_build_object(
        'eligible', (select count(*) from rcohort where created_at <= now() - interval '1 day'),
        'returned', (select count(*) from rcohort c where c.created_at <= now() - interval '1 day'
                      and exists (select 1 from ua a where a.user_id = c.id and a.created_at >= c.created_at + interval '1 day'))),
      'd7', jsonb_build_object(
        'eligible', (select count(*) from rcohort where created_at <= now() - interval '7 days'),
        'returned', (select count(*) from rcohort c where c.created_at <= now() - interval '7 days'
                      and exists (select 1 from ua a where a.user_id = c.id and a.created_at >= c.created_at + interval '7 days'))),
      'd30', jsonb_build_object(
        'eligible', (select count(*) from rcohort where created_at <= now() - interval '30 days'),
        'returned', (select count(*) from rcohort c where c.created_at <= now() - interval '30 days'
                      and exists (select 1 from ua a where a.user_id = c.id and a.created_at >= c.created_at + interval '30 days')))
    ),
    'inactive_farms', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
      from (
        select f.id as farm_id, f.name, f.plan, f.created_at,
               u.email, p.full_name as owner, p.phone,
               (select max(a.created_at) from act a where a.farm_id = f.id) as last_activity
        from public.farms f
        join auth.users u on u.id = f.owner_id
        left join public.profiles p on p.id = f.owner_id
        where f.created_at <= now() - interval '3 days'
          and coalesce((select max(a.created_at) from act a where a.farm_id = f.id), 'epoch') < now() - interval '7 days'
          and not coalesce(p.is_super_admin, false)
        order by f.created_at desc
        limit 200
      ) t
    )
  ) into v_result;
  return v_result;
end;
$$;
revoke execute on function public.admin_analytics_growth(integer) from public, anon;
grant execute on function public.admin_analytics_growth(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Feature use: how many farms (or people) used each part of the app.
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics_usage(p_days integer default 30)
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
    'total_farms', (select count(*) from public.farms),
    'features', (
      select coalesce(jsonb_agg(jsonb_build_object('key', k, 'kind', 'farm', 'count', c, 'rows', r) order by c desc, r desc), '[]'::jsonb)
      from (
        select 'milk' k, count(distinct farm_id) c, count(*) r from public.milk_records where created_at >= v_from
        union all select 'eggs', count(distinct farm_id), count(*) from public.flock_daily_logs where created_at >= v_from
        union all select 'health', count(distinct farm_id), count(*) from public.health_records where created_at >= v_from
        union all select 'breeding', count(distinct farm_id), count(*) from public.breeding_events where created_at >= v_from
        union all select 'weights', count(distinct farm_id), count(*) from public.cattle_weights where created_at >= v_from
        union all select 'flockHealth', count(distinct farm_id), count(*) from public.flock_health_records where created_at >= v_from
        union all select 'stock', count(distinct farm_id), count(*) from public.inventory_moves where created_at >= v_from
        union all select 'sales', count(distinct farm_id), count(*) from public.sales where created_at >= v_from
        union all select 'money', count(distinct farm_id), count(*) from public.transactions where created_at >= v_from
        union all select 'attendance', count(distinct farm_id), count(*) from public.staff_attendance where created_at >= v_from
        union all select 'vetApprovals', count(distinct farm_id), count(*) from public.pending_entries where created_at >= v_from
        union all select 'ai', count(distinct farm_id), count(*) from public.ai_usage where created_at >= v_from
      ) t
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object('key', k, 'kind', 'user', 'count', c, 'rows', r) order by c desc, r desc), '[]'::jsonb)
      from (
        select 'quick' k, count(distinct user_id) c, count(*) r from public.page_views
          where created_at >= v_from and user_id is not null and path = '/dashboard/quick'
        union all select 'qrTags', count(distinct user_id), count(*) from public.page_views
          where created_at >= v_from and user_id is not null and path = '/dashboard/cattle/tags'
        union all select 'pdfReport', count(distinct user_id), count(*) from public.page_views
          where created_at >= v_from and user_id is not null and path ~ '^/dashboard/cattle/[0-9a-f-]{36}/report$'
        union all select 'import', count(distinct user_id), count(*) from public.page_views
          where created_at >= v_from and user_id is not null and path = '/dashboard/import'
        union all select 'profit', count(distinct user_id), count(*) from public.page_views
          where created_at >= v_from and user_id is not null and path = '/dashboard/profit'
        union all select 'community', count(distinct user_id), count(*) from public.page_views
          where created_at >= v_from and user_id is not null and path like '/community%'
      ) t
    ),
    'ai', jsonb_build_object(
      'prompts', (select count(*) from public.ai_usage where created_at >= v_from),
      'farms', (select count(distinct farm_id) from public.ai_usage where created_at >= v_from),
      'input_tokens', (select coalesce(sum(input_tokens), 0) from public.ai_usage where created_at >= v_from),
      'output_tokens', (select coalesce(sum(output_tokens), 0) from public.ai_usage where created_at >= v_from),
      'by_plan', (
        select coalesce(jsonb_agg(jsonb_build_object('plan', plan, 'prompts', n, 'farms', fm) order by n desc), '[]'::jsonb)
        from (
          select f.plan, count(*) n, count(distinct a.farm_id) fm
          from public.ai_usage a join public.farms f on f.id = a.farm_id
          where a.created_at >= v_from group by f.plan
        ) t
      )
    )
  ) into v_result;
  return v_result;
end;
$$;
revoke execute on function public.admin_analytics_usage(integer) from public, anon;
grant execute on function public.admin_analytics_usage(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Traffic sources, campaigns, landing pages, language, new vs returning.
-- A visitor's first visit in the period decides their source; a sign-up is
-- credited to the source of the first visit of the browser it came from.
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics_sources(p_days integer default 30)
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

  with
  first_touch as (
    select distinct on (visitor_id) visitor_id, path, referrer, utm_source, utm_campaign, created_at
    from public.page_views
    where visitor_id is not null and created_at >= v_from - interval '30 days'
    order by visitor_id, created_at
  ),
  new_in_range as (select * from first_touch where created_at >= v_from),
  signup_visitor as (
    -- the browser a new account was made from: any visit signed in as that user
    select distinct on (u.id) u.id as user_id, pv.visitor_id
    from auth.users u
    join public.page_views pv on pv.user_id = u.id and pv.visitor_id is not null
    where u.created_at >= v_from
    order by u.id, pv.created_at
  ),
  signup_touch as (
    select s.user_id, ft.path, ft.referrer, ft.utm_source, ft.utm_campaign
    from signup_visitor s join first_touch ft on ft.visitor_id = s.visitor_id
  )
  select jsonb_build_object(
    'visitors', (select count(*) from new_in_range),
    'signups', (select count(*) from auth.users where created_at >= v_from),
    'attributed_signups', (select count(*) from signup_touch),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('source', src, 'visitors', vs, 'signups', sg) order by vs desc, sg desc), '[]'::jsonb)
      from (
        select coalesce(a.src, b.src) src, coalesce(a.n, 0) vs, coalesce(b.n, 0) sg
        from (select public.analytics_source(utm_source, referrer) src, count(*) n from new_in_range group by 1) a
        full join (select public.analytics_source(utm_source, referrer) src, count(*) n from signup_touch group by 1) b on a.src = b.src
        order by 2 desc, 3 desc limit 12
      ) t
    ),
    'campaigns', (
      select coalesce(jsonb_agg(jsonb_build_object('campaign', cmp, 'visitors', vs, 'signups', sg) order by vs desc), '[]'::jsonb)
      from (
        select coalesce(a.cmp, b.cmp) cmp, coalesce(a.n, 0) vs, coalesce(b.n, 0) sg
        from (select utm_campaign cmp, count(*) n from new_in_range where utm_campaign is not null group by 1) a
        full join (select utm_campaign cmp, count(*) n from signup_touch where utm_campaign is not null group by 1) b on a.cmp = b.cmp
        order by 2 desc limit 12
      ) t
    ),
    'landing', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'signups', n) order by n desc), '[]'::jsonb)
      from (select path, count(*) n from signup_touch group by path order by n desc limit 10) t
    ),
    'locales', (
      select coalesce(jsonb_agg(jsonb_build_object('locale', loc, 'views', n) order by n desc), '[]'::jsonb)
      from (select coalesce(locale, '??') loc, count(*) n from public.page_views where created_at >= v_from group by 1 order by n desc limit 5) t
    ),
    'visitor_kinds', jsonb_build_object(
      'new', (select count(*) from new_in_range),
      'returning', (
        select count(distinct visitor_id) from public.page_views pv
        where pv.created_at >= v_from and pv.visitor_id is not null
          and exists (select 1 from public.page_views o where o.visitor_id = pv.visitor_id and o.created_at < v_from)
      )
    ),
    'top_cities', (
      select coalesce(jsonb_agg(jsonb_build_object('city', city, 'country', country, 'users', n) order by n desc), '[]'::jsonb)
      from (
        select city, max(country) country, count(*) n from public.user_presence
        where city is not null group by city order by n desc limit 10
      ) t
    ),
    'blog', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', n, 'visitors', v) order by n desc), '[]'::jsonb)
      from (
        select path, count(*) n, count(distinct visitor_id) v from public.page_views
        where created_at >= v_from and path ~ '^/blog/[^/]+$' and path not like '/blog/category/%' and path not like '/blog/tag/%'
        group by path order by n desc limit 10
      ) t
    )
  ) into v_result;
  return v_result;
end;
$$;
revoke execute on function public.admin_analytics_sources(integer) from public, anon;
grant execute on function public.admin_analytics_sources(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Business and support: plans, requests, farms near their limits,
-- community, and everything waiting for an admin.
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics_business(p_days integer default 30)
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
    'plans', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', p.key, 'name_en', p.name_en, 'name_bn', p.name_bn, 'price', p.price_monthly,
        'farms', (select count(*) from public.farms f where f.plan = p.key)
      ) order by p.sort_order), '[]'::jsonb)
      from public.plans p
    ),
    'requests', jsonb_build_object(
      'upgrade_open', (select count(*) from public.requests where kind = 'upgrade' and status = 'open'),
      'upgrade_approved', (select count(*) from public.requests where kind = 'upgrade' and status = 'approved' and created_at >= v_from),
      'upgrade_rejected', (select count(*) from public.requests where kind = 'upgrade' and status = 'rejected' and created_at >= v_from),
      'support_open', (select count(*) from public.requests where kind = 'support' and status = 'open'),
      'support_resolved', (select count(*) from public.requests where kind = 'support' and status in ('resolved', 'approved', 'rejected') and created_at >= v_from),
      'avg_hours_to_resolve', (
        select round(avg(extract(epoch from (resolved_at - created_at)) / 3600)::numeric, 1)
        from public.requests where resolved_at is not null and created_at >= v_from)
    ),
    'near_limit', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.pct desc), '[]'::jsonb)
      from (
        select f.id as farm_id, f.name, f.plan, u.email,
               pl.max_cattle, pl.max_flocks,
               (select count(*) from public.cattle c where c.farm_id = f.id and c.deleted_at is null and c.status <> 'archived') as cattle,
               (select count(*) from public.flocks x where x.farm_id = f.id and x.deleted_at is null) as flocks,
               greatest(
                 case when pl.max_cattle > 0 then (select count(*) from public.cattle c where c.farm_id = f.id and c.deleted_at is null and c.status <> 'archived')::numeric / pl.max_cattle else 0 end,
                 case when pl.max_flocks > 0 then (select count(*) from public.flocks x where x.farm_id = f.id and x.deleted_at is null)::numeric / pl.max_flocks else 0 end
               ) as pct
        from public.farms f
        join public.plans pl on pl.key = f.plan
        join auth.users u on u.id = f.owner_id
        where pl.max_cattle is not null or pl.max_flocks is not null
      ) t
      where t.pct >= 0.8
      limit 20
    ),
    'support', jsonb_build_object(
      'requests_open', (select count(*) from public.requests where status = 'open'),
      'messages_new', (select count(*) from public.contact_messages where status = 'new'),
      'reviews_pending', (select count(*) from public.reviews where status = 'pending'),
      'reports_open', (select count(*) from public.community_reports where status = 'open'),
      'posts_waiting', (select count(*) from public.community_questions where status = 'pending')
    ),
    'community', jsonb_build_object(
      'questions', (select count(*) from public.community_questions where created_at >= v_from and status <> 'hidden'),
      'answers', (select count(*) from public.community_answers where created_at >= v_from),
      'unanswered', (select count(*) from public.community_questions where status = 'published' and answer_count = 0),
      'members_posting', (select count(distinct author_id) from public.community_questions where created_at >= v_from)
    )
  ) into v_result;
  return v_result;
end;
$$;
revoke execute on function public.admin_analytics_business(integer) from public, anon;
grant execute on function public.admin_analytics_business(integer) to authenticated;
