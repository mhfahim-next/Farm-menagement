-- Promo boxes on the blog and community pages: FarmFlows' own promotions
-- ("house") and paid sponsor banners ("sponsor"), managed in /admin/promos.
--
-- Pages read the active boxes with the cookie-free public client and cache
-- them (ISR). A click goes through /api/promo/<id>, which counts it with
-- record_promo_click() and redirects to the box's link. Nothing about the
-- visitor is stored: only a count per box per day.

create table public.promos (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'house' check (kind in ('house', 'sponsor')),
  sponsor_name text check (sponsor_name is null or length(sponsor_name) <= 80),
  title_en text not null check (length(title_en) between 1 and 120),
  title_bn text not null check (length(title_bn) between 1 and 120),
  body_en text check (body_en is null or length(body_en) <= 300),
  body_bn text check (body_bn is null or length(body_bn) <= 300),
  cta_en text not null check (length(cta_en) between 1 and 40),
  cta_bn text not null check (length(cta_bn) between 1 and 40),
  -- A page of this site ("/signup") or a secure outside address.
  url text not null check (url ~ '^(/[^/\s]|/$|https://[^\s]+$)' and length(url) <= 500),
  -- Optional picture from the blog image library (blog-images bucket path).
  image_path text check (image_path is null or length(image_path) <= 300),
  placements text[] not null default '{}'
    check (placements <@ array['blog_mid', 'blog_end', 'community_list', 'community_question']::text[]),
  -- Blog category slugs; empty = every article. Not used on community pages.
  categories text[] not null default '{}',
  starts_on date,
  ends_on date,
  priority int not null default 0 check (priority between -100 and 100),
  active boolean not null default true,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'house' or sponsor_name is not null),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create table public.promo_clicks (
  promo_id uuid not null references public.promos (id) on delete cascade,
  day date not null default current_date,
  clicks int not null default 0,
  primary key (promo_id, day)
);

alter table public.promos enable row level security;
alter table public.promo_clicks enable row level security;

-- Visitors see the boxes that are switched on (the page filters the dates).
create policy "promos: active ones are public" on public.promos
  for select to anon, authenticated using (active);
create policy "promos: super admin reads all" on public.promos
  for select to authenticated using (public.is_super_admin());
create policy "promo clicks: super admin reads" on public.promo_clicks
  for select to authenticated using (public.is_super_admin());

grant select on public.promos to anon, authenticated;
grant select on public.promo_clicks to authenticated;

-- Counts a click and returns where to send the visitor (null: box gone or off).
create or replace function public.record_promo_click(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  update public.promos set clicks = clicks + 1 where id = p_id and active returning url into v_url;
  if v_url is null then
    return null;
  end if;
  insert into public.promo_clicks (promo_id, day, clicks) values (p_id, current_date, 1)
  on conflict (promo_id, day) do update set clicks = public.promo_clicks.clicks + 1;
  return v_url;
end;
$$;
revoke execute on function public.record_promo_click(uuid) from public;
grant execute on function public.record_promo_click(uuid) to anon, authenticated;

-- Create (p_id null) or update a box. Returns its id.
create or replace function public.admin_save_promo(
  p_id uuid,
  p_kind text,
  p_sponsor_name text,
  p_title_en text,
  p_title_bn text,
  p_body_en text,
  p_body_bn text,
  p_cta_en text,
  p_cta_bn text,
  p_url text,
  p_image_path text,
  p_placements text[],
  p_categories text[],
  p_starts_on date,
  p_ends_on date,
  p_priority int,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.admin_assert();
  if coalesce(cardinality(p_placements), 0) = 0 then
    raise exception 'Pick at least one place.' using errcode = '22023';
  end if;
  if p_id is null then
    insert into public.promos (kind, sponsor_name, title_en, title_bn, body_en, body_bn, cta_en, cta_bn, url, image_path,
                               placements, categories, starts_on, ends_on, priority, active)
    values (p_kind, nullif(trim(p_sponsor_name), ''), trim(p_title_en), trim(p_title_bn), nullif(trim(p_body_en), ''),
            nullif(trim(p_body_bn), ''), trim(p_cta_en), trim(p_cta_bn), trim(p_url), nullif(trim(p_image_path), ''),
            p_placements, coalesce(p_categories, '{}'), p_starts_on, p_ends_on, coalesce(p_priority, 0), coalesce(p_active, true))
    returning id into v_id;
    perform public.admin_log('promo.create', 'promo', v_id::text);
  else
    update public.promos
       set kind = p_kind,
           sponsor_name = nullif(trim(p_sponsor_name), ''),
           title_en = trim(p_title_en),
           title_bn = trim(p_title_bn),
           body_en = nullif(trim(p_body_en), ''),
           body_bn = nullif(trim(p_body_bn), ''),
           cta_en = trim(p_cta_en),
           cta_bn = trim(p_cta_bn),
           url = trim(p_url),
           image_path = nullif(trim(p_image_path), ''),
           placements = p_placements,
           categories = coalesce(p_categories, '{}'),
           starts_on = p_starts_on,
           ends_on = p_ends_on,
           priority = coalesce(p_priority, 0),
           active = coalesce(p_active, true),
           updated_at = now()
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Promo not found.' using errcode = 'P0002';
    end if;
    perform public.admin_log('promo.update', 'promo', v_id::text);
  end if;
  return v_id;
end;
$$;
revoke execute on function public.admin_save_promo(uuid, text, text, text, text, text, text, text, text, text, text, text[], text[], date, date, int, boolean) from public, anon;
grant execute on function public.admin_save_promo(uuid, text, text, text, text, text, text, text, text, text, text, text[], text[], date, date, int, boolean) to authenticated;

create or replace function public.admin_set_promo_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.promos set active = p_active, updated_at = now() where id = p_id;
  perform public.admin_log(case when p_active then 'promo.on' else 'promo.off' end, 'promo', p_id::text);
end;
$$;
revoke execute on function public.admin_set_promo_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_promo_active(uuid, boolean) to authenticated;

create or replace function public.admin_delete_promo(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.promos where id = p_id;
  perform public.admin_log('promo.delete', 'promo', p_id::text);
end;
$$;
revoke execute on function public.admin_delete_promo(uuid) from public, anon;
grant execute on function public.admin_delete_promo(uuid) to authenticated;

-- FarmFlows' own boxes to start with: one per blog topic, matched to what the
-- reader is reading, and a general one for the end of articles and the community.
insert into public.promos (kind, title_en, title_bn, body_en, body_bn, cta_en, cta_bn, url, placements, categories, priority) values
  ('house',
   'Never miss a vaccine date again',
   'টিকার তারিখ আর ভুলবেন না',
   'Write each vaccine and deworming once. FarmFlows reminds you on your phone a few days before the next dose is due.',
   'প্রতিটা টিকা আর কৃমিনাশক একবার লিখে রাখুন। পরের ডোজের কয়েক দিন আগে FarmFlows আপনার ফোনে মনে করিয়ে দেবে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_mid'], array['cattle-health', 'goats'], 10),
  ('house',
   'Know what your vermicompost really earns',
   'কেঁচো সারে আসলে কত লাভ, জেনে নিন',
   'Write down dung, worms, labour and every sack you sell. FarmFlows works out the cost and profit for you each month.',
   'গোবর, কেঁচো, মজুরি আর প্রতিটা বস্তা বিক্রির হিসাব লিখে রাখুন। মাস শেষে খরচ আর লাভ FarmFlows নিজেই বের করে দেবে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_mid'], array['compost-soil'], 10),
  ('house',
   'Heat, insemination and calving dates in one place',
   'গরম আসা, বীজ দেওয়া, বাচ্চা হওয়ার তারিখ এক জায়গায়',
   'Note the day a cow is inseminated. FarmFlows tells you when to check pregnancy, when to dry her off and when she will calve.',
   'কোন দিন বীজ দিলেন, শুধু সেটা লিখুন। কবে গর্ভ পরীক্ষা, কবে দুধ বন্ধ আর কবে বাচ্চা হবে, FarmFlows জানিয়ে দেবে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_mid'], array['breeding'], 10),
  ('house',
   'What does one litre of milk cost you?',
   'এক লিটার দুধে আপনার খরচ কত?',
   'Add feed, medicine and wages as you go. FarmFlows shows your cost per litre and your profit for the month.',
   'খাবার, ওষুধ আর মজুরির খরচ যখন হয় তখনই লিখুন। প্রতি লিটারে খরচ আর মাসের লাভ FarmFlows দেখিয়ে দেবে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_mid'], array['feed-nutrition', 'farm-business'], 10),
  ('house',
   'Daily eggs, feed and deaths in under a minute',
   'প্রতিদিনের ডিম, খাবার আর মৃত্যু, এক মিনিটেই লেখা',
   'Keep the shed record on your phone. FarmFlows shows the laying rate and the cost of each egg.',
   'শেডের হিসাব ফোনেই রাখুন। ডিম পাড়ার হার আর প্রতিটা ডিমের খরচ FarmFlows দেখিয়ে দেবে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_mid'], array['poultry'], 10),
  ('house',
   'Keep your whole farm in one free app',
   'পুরো খামারের হিসাব এক ফ্রি অ্যাপে',
   'Milk, eggs, vaccines, breeding, feed stock, sales and profit. In Bangla, on your phone or computer.',
   'দুধ, ডিম, টিকা, প্রজনন, খাবারের মজুত, বিক্রি আর লাভ। বাংলায়, ফোনে বা কম্পিউটারে।',
   'Start free', 'বিনামূল্যে শুরু করুন', '/signup',
   array['blog_end', 'community_question'], '{}', 0),
  ('house',
   'Free farm calculators',
   'খামারের ফ্রি ক্যালকুলেটর',
   'Cattle weight by tape, feed ration, calving date and more. No sign-up needed.',
   'ফিতা দিয়ে গরুর ওজন, খাবারের রেশন, বাচ্চা হওয়ার তারিখ আর আরও অনেক কিছু। সাইনআপ লাগবে না।',
   'Open the tools', 'ক্যালকুলেটর দেখুন', '/tools',
   array['community_list'], '{}', 0);
