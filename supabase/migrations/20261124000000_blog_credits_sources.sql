-- Who wrote and who reviewed an article, and the sources it rests on.
--
-- * health_topic marks animal-health articles: they always show who wrote
--   them, and the vet reviewer once a super admin has added one (never made
--   up: empty until filled in Admin → Blog).
-- * sources: up to 10 links [{title_en, title_bn, url}] shown under the article.
-- Writes go through admin_set_blog_credits (super admins only).

alter table public.blog_posts
  add column health_topic         boolean not null default false,
  add column author_name          text check (author_name is null or char_length(author_name) between 2 and 100),
  add column reviewer_name        text check (reviewer_name is null or char_length(reviewer_name) between 2 and 100),
  add column reviewer_credentials text check (reviewer_credentials is null or char_length(reviewer_credentials) <= 200),
  add column reviewed_on          date,
  add column sources              jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 10);

create or replace function public.admin_set_blog_credits(
  p_id uuid,
  p_health_topic boolean,
  p_author_name text,
  p_reviewer_name text,
  p_reviewer_credentials text,
  p_reviewed_on date,
  p_sources jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_src jsonb;
begin
  perform public.admin_assert();
  if p_sources is null or jsonb_typeof(p_sources) <> 'array' or jsonb_array_length(p_sources) > 10 then
    raise exception 'Sources must be a list of at most 10 links.' using errcode = '22023';
  end if;
  for v_src in select * from jsonb_array_elements(p_sources) loop
    if coalesce(v_src ->> 'url', '') !~ '^https?://[^\s]+$' or char_length(v_src ->> 'url') > 500
       or char_length(coalesce(v_src ->> 'title_en', '') || coalesce(v_src ->> 'title_bn', '')) = 0
       or char_length(coalesce(v_src ->> 'title_en', '')) > 200 or char_length(coalesce(v_src ->> 'title_bn', '')) > 200 then
      raise exception 'Each source needs a title and a web address (http or https).' using errcode = '22023';
    end if;
  end loop;
  if nullif(trim(p_reviewer_name), '') is null and p_reviewed_on is not null then
    raise exception 'A review date needs a reviewer.' using errcode = '22023';
  end if;
  update public.blog_posts set
    health_topic = coalesce(p_health_topic, false),
    author_name = nullif(trim(p_author_name), ''),
    reviewer_name = nullif(trim(p_reviewer_name), ''),
    reviewer_credentials = case when nullif(trim(p_reviewer_name), '') is null then null else nullif(trim(p_reviewer_credentials), '') end,
    reviewed_on = case when nullif(trim(p_reviewer_name), '') is null then null else p_reviewed_on end,
    sources = p_sources
  where id = p_id;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.credits', 'blog_post', p_id::text,
    jsonb_build_object('reviewer', nullif(trim(p_reviewer_name), ''), 'sources', jsonb_array_length(p_sources)));
end;
$$;
revoke execute on function public.admin_set_blog_credits(uuid, boolean, text, text, text, date, jsonb) from public, anon;
grant execute on function public.admin_set_blog_credits(uuid, boolean, text, text, text, date, jsonb) to authenticated;

-- The starter animal-health articles, with official sources (homepages of the
-- Department of Livestock Services and BLRI; WOAH and FAO topic pages).
do $$
declare
  dls  jsonb := '{"title_en": "Department of Livestock Services (DLS), Bangladesh", "title_bn": "প্রাণিসম্পদ অধিদপ্তর (DLS), বাংলাদেশ", "url": "https://dls.gov.bd/"}';
  blri jsonb := '{"title_en": "Bangladesh Livestock Research Institute (BLRI)", "title_bn": "বাংলাদেশ প্রাণিসম্পদ গবেষণা ইনস্টিটিউট (BLRI)", "url": "https://blri.gov.bd/"}';
  fmd  jsonb := '{"title_en": "WOAH: Foot and mouth disease", "title_bn": "WOAH: ক্ষুরা রোগ (ফুট অ্যান্ড মাউথ ডিজিজ)", "url": "https://www.woah.org/en/disease/foot-and-mouth-disease/"}';
  lsd  jsonb := '{"title_en": "WOAH: Lumpy skin disease", "title_bn": "WOAH: লাম্পি স্কিন ডিজিজ", "url": "https://www.woah.org/en/disease/lumpy-skin-disease/"}';
  ai   jsonb := '{"title_en": "WOAH: Avian influenza", "title_bn": "WOAH: এভিয়ান ইনফ্লুয়েঞ্জা (বার্ড ফ্লু)", "url": "https://www.woah.org/en/disease/avian-influenza/"}';
  nd   jsonb := '{"title_en": "WOAH: Newcastle disease", "title_bn": "WOAH: রানীক্ষেত (নিউক্যাসল ডিজিজ)", "url": "https://www.woah.org/en/disease/newcastle-disease/"}';
  fah  jsonb := '{"title_en": "FAO: Animal health", "title_bn": "FAO: প্রাণিস্বাস্থ্য", "url": "https://www.fao.org/animal-health/en"}';
  fdp  jsonb := '{"title_en": "FAO: Dairy production and products", "title_bn": "FAO: দুগ্ধ উৎপাদন ও দুগ্ধজাত পণ্য", "url": "https://www.fao.org/dairy-production-products/en"}';
begin
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, fmd, lsd, fah) where slug = 'cattle-vaccination-schedule-bangladesh' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, blri, fdp) where slug = 'milk-fever-in-cows-signs-and-prevention' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, blri, fdp) where slug = 'newborn-calf-care-colostrum-first-24-hours' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, fdp, fah) where slug = 'prevent-mastitis-clean-milking-routine' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, blri, fah) where slug = 'protect-dairy-cows-from-summer-heat-stress' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, ai, nd, fah) where slug = 'layer-farm-biosecurity-checklist' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(dls, blri, nd) where slug = 'why-layer-egg-production-drops' and sources = '[]';
end $$;
