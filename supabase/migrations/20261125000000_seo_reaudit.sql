-- SEO re-audit fixes.
--
-- 1. Authors as people: a job title and a profile link next to author_name
--    (shown on the article and as schema.org Person). Empty until a super
--    admin fills them in Admin → Blog; nothing is made up here.
-- 2. dateModified: adding or changing an article's sources (or its author)
--    is an edit too. Articles whose sources were added after publishing get
--    the date that happened (their updated_at) instead of the publish date.
-- 3. Sources for the cattle-weight article (FAO pages, checked to open).
-- 4. Meta descriptions (the article summary) over 155 characters shortened.
-- 5. A typo in a community question title.
-- 6. Reviews: a founder's own review is labelled as such on the home page.
--
-- Content updates only touch rows that still hold the original text, so an
-- admin's own later edits are never overwritten.

-- 1 ------------------------------------------------------------------------
alter table public.blog_posts
  add column author_job_title text check (author_job_title is null or char_length(author_job_title) between 2 and 120),
  add column author_url       text check (author_url is null or (author_url ~ '^https?://[^\s]+$' and char_length(author_url) <= 300));

create or replace function public.admin_set_blog_author(p_id uuid, p_job_title text, p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if nullif(trim(p_url), '') is not null and trim(p_url) !~ '^https?://[^\s]+$' then
    raise exception 'The profile link must start with http:// or https://.' using errcode = '22023';
  end if;
  update public.blog_posts set
    author_job_title = nullif(trim(p_job_title), ''),
    author_url = nullif(trim(p_url), '')
  where id = p_id;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.author', 'blog_post', p_id::text, jsonb_build_object('job_title', nullif(trim(p_job_title), '')));
end;
$$;
revoke execute on function public.admin_set_blog_author(uuid, text, text) from public, anon;
grant execute on function public.admin_set_blog_author(uuid, text, text) to authenticated;

-- 2 ------------------------------------------------------------------------
create or replace function public.blog_touch_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.content_updated_at := coalesce(new.published_at, now());
  elsif (new.title_en, new.title_bn, new.summary_en, new.summary_bn, new.body_en, new.body_bn, new.cover_image_id, new.category_id,
         new.sources, new.author_name, new.author_job_title)
        is distinct from (old.title_en, old.title_bn, old.summary_en, old.summary_bn, old.body_en, old.body_bn, old.cover_image_id, old.category_id,
         old.sources, old.author_name, old.author_job_title) then
    new.content_updated_at := now();
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;

-- 4 (summaries are the meta description; a shorter one is not an article edit,
-- so the content date is left alone) ---------------------------------------
-- (The trigger is off for these updates: it would keep the old content date.)
alter table public.blog_posts disable trigger blog_touch_content;

-- Sources were added to the health articles after they were published; the
-- last update of those rows is when that happened.
update public.blog_posts
   set content_updated_at = updated_at
 where sources <> '[]'::jsonb
   and updated_at > coalesce(content_updated_at, published_at, created_at);

update public.blog_posts set summary_en = 'No scale? Measure heart girth and body length with a tape and use one simple formula to estimate live weight within 5–10%. Examples in cm and inches.'
 where slug = 'how-to-measure-cattle-weight-with-a-tape' and summary_en = 'No scale? Measure heart girth and body length with a tape and use one simple formula to estimate live weight within about 5–10%. Worked examples in cm and inches.';
update public.blog_posts set summary_bn = 'ওজন মাপার যন্ত্র নেই? ফিতা দিয়ে বুকের বেড় আর দৈর্ঘ্য মেপে সহজ সূত্রে গরুর ওজন প্রায় ৫–১০% নির্ভুলভাবে বের করুন। সেমি ও ইঞ্চিতে উদাহরণ।'
 where slug = 'how-to-measure-cattle-weight-with-a-tape' and summary_bn = 'ওজন মাপার যন্ত্র নেই? ফিতা দিয়ে বুকের বেড় আর শরীরের দৈর্ঘ্য মেপে একটা সহজ সূত্রে গরুর ওজন প্রায় ৫–১০% নির্ভুলভাবে বের করুন। সেন্টিমিটার ও ইঞ্চি দুই হিসাবেই উদাহরণ।';
update public.blog_posts set summary_en = 'If you don''t know what a litre of milk costs you, you can''t know your profit. A simple monthly method, a worked example and 7 ways to cut the cost.'
 where slug = 'how-to-calculate-milk-production-cost-per-litre' and summary_en = 'If you don''t know what a litre of milk costs you, you can''t know if you make a profit. A simple monthly method, a worked example and 7 proven ways to cut the cost.';
update public.blog_posts set summary_en = 'Silage keeps green fodder good for months. Step by step: when to harvest, how to chop, pack and seal, and how to tell good silage from bad.'
 where slug = 'how-to-make-maize-silage-small-farm' and summary_en = 'Silage stores green fodder for months without losing much quality. Step-by-step: when to harvest, how to chop, pack and seal, and how to tell good silage from bad.';
update public.blog_posts set summary_en = 'A cow is the biggest purchase on a small dairy farm. Ten practical checks (age, udder, real milk yield, health and history) before you pay.'
 where slug = 'how-to-buy-a-good-dairy-cow' and summary_en = 'A cow is the biggest purchase on a small dairy farm. Ten practical checks (age, udder, real milk yield, health and history) so you don''t pay for someone else''s problem.';
update public.blog_posts set summary_bn = 'ছোট দুগ্ধ খামারে সবচেয়ে বড় কেনাকাটা একটা গাভী। বয়স, ওলান, আসল দুধ, স্বাস্থ্য ও ইতিহাস: টাকা দেওয়ার আগে ১০টি বাস্তব যাচাই।'
 where slug = 'how-to-buy-a-good-dairy-cow' and summary_bn = 'ছোট দুগ্ধ খামারে সবচেয়ে বড় কেনাকাটা একটা গাভী। বয়স, ওলান, আসল দুধ, স্বাস্থ্য ও ইতিহাস: অন্যের সমস্যা যাতে টাকা দিয়ে কিনে না আনেন, তার ১০টি বাস্তব যাচাই।';
update public.blog_posts set summary_en = 'Every cow gives a lot of dung each day. Handled well, it becomes fertiliser, cooking gas and extra income. Three practical options compared.'
 where slug = 'cow-dung-compost-vermicompost-biogas-income' and summary_en = 'Every cow produces a lot of dung each day. Handled well, it becomes fertiliser, cooking gas and extra income instead of smell and flies. Three practical options compared.';
update public.blog_posts set summary_en = 'A cow that goes down soon after calving may have milk fever, a calcium shortage that can kill within hours. How to spot, treat and prevent it.'
 where slug = 'milk-fever-in-cows-signs-and-prevention' and summary_en = 'A cow that goes down soon after calving may have milk fever, a calcium shortage that can kill within hours. How to recognise it early, what to do, and how to prevent it.';
update public.blog_posts set summary_en = 'Mastitis is the costliest everyday disease on a dairy farm. Find hidden cases with a simple test and keep udders healthy with an 8-step milking routine.'
 where slug = 'prevent-mastitis-clean-milking-routine' and summary_en = 'Mastitis is the most expensive everyday disease on a dairy farm. Learn how to spot hidden cases with a simple test and the 8-step milking routine that keeps udders healthy.';

alter table public.blog_posts enable trigger blog_touch_content;

-- 3 (a real edit: the content date moves to now) ----------------------------
update public.blog_posts set health_topic = true, sources = jsonb_build_array(
    '{"title_en": "FAO: Animal production (Module 5) — weighing animals and estimating weight from girth", "title_bn": "FAO: পশু উৎপাদন (মডিউল ৫) — পশুর ওজন মাপা ও বুকের বেড় থেকে ওজন অনুমান", "url": "https://www.fao.org/4/x5469e/x5469e08.htm"}'::jsonb,
    '{"title_en": "FAO: Shorthorn cattle of West and Central Africa — production characteristics (live weight from heart girth)", "title_bn": "FAO: পশ্চিম ও মধ্য আফ্রিকার শর্টহর্ন গরু — উৎপাদন বৈশিষ্ট্য (বুকের বেড় থেকে জীবন্ত ওজন)", "url": "https://www.fao.org/4/t1300t/t1300T0d.htm"}'::jsonb)
 where slug = 'how-to-measure-cattle-weight-with-a-tape' and sources = '[]'::jsonb;

-- 5 ------------------------------------------------------------------------
update public.community_questions
   set title = 'How many times do you feed your cow?', body = 'I''m feeding twice. Is it okay?'
 where title = 'How many time do you feed your cow?' and body = 'I''m feeding twice is it okay?';
update public.community_questions
   set title = 'How many times do you feed your cow?'
 where title = 'How many time do you feed your cow?';

-- 6 ------------------------------------------------------------------------
alter table public.reviews add column is_founder boolean not null default false;
comment on column public.reviews.is_founder is 'Written by the founder of FarmFlows: shown with a "Founder" label, never as a customer review.';
update public.reviews set is_founder = true where name = 'Mahmudul Hasan Fahim';
