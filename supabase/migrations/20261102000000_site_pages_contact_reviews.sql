-- =====================================================================
-- Public site content managed by super admins: legal pages (terms,
-- privacy), contact details, contact-form messages and customer reviews.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Legal / content pages
-- ---------------------------------------------------------------------
create table public.site_pages (
  slug        text primary key check (slug in ('terms', 'privacy')),
  title_en    text not null check (char_length(title_en) between 1 and 200),
  title_bn    text not null check (char_length(title_bn) between 1 and 200),
  body_en     text not null check (char_length(body_en) <= 60000),
  body_bn     text not null check (char_length(body_bn) <= 60000),
  updated_at  timestamptz not null default now()
);
alter table public.site_pages enable row level security;
create policy "site_pages: public read" on public.site_pages for select to anon, authenticated using (true);
revoke all on public.site_pages from anon, authenticated;
grant select on public.site_pages to anon, authenticated;

create or replace function public.admin_save_site_page(
  p_slug text, p_title_en text, p_title_bn text, p_body_en text, p_body_bn text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if coalesce(trim(p_title_en), '') = '' or coalesce(trim(p_title_bn), '') = ''
     or coalesce(trim(p_body_en), '') = '' or coalesce(trim(p_body_bn), '') = '' then
    raise exception 'Fill in the title and text in both languages.' using errcode = '22023';
  end if;
  update public.site_pages
     set title_en = trim(p_title_en), title_bn = trim(p_title_bn),
         body_en = p_body_en, body_bn = p_body_bn, updated_at = now()
   where slug = p_slug;
  if not found then
    raise exception 'Unknown page.' using errcode = '22023';
  end if;
  perform public.admin_log('site_page.save', 'site_page', p_slug);
end;
$$;
revoke execute on function public.admin_save_site_page(text, text, text, text, text) from public, anon;
grant execute on function public.admin_save_site_page(text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Contact details shown on the contact page and footer
-- ---------------------------------------------------------------------
create table public.site_info (
  id             integer primary key default 1 check (id = 1),
  contact_email  text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone  text check (contact_phone is null or char_length(contact_phone) <= 40),
  whatsapp       text check (whatsapp is null or char_length(whatsapp) <= 40),
  address_en     text check (address_en is null or char_length(address_en) <= 300),
  address_bn     text check (address_bn is null or char_length(address_bn) <= 300),
  office_hours_en text check (office_hours_en is null or char_length(office_hours_en) <= 120),
  office_hours_bn text check (office_hours_bn is null or char_length(office_hours_bn) <= 120),
  updated_at     timestamptz not null default now()
);
insert into public.site_info (id, contact_email, contact_phone, address_en, address_bn, office_hours_en, office_hours_bn)
values (1, 'support@farmflows.app', '+880 1700-000000', 'Dhaka, Bangladesh', 'ঢাকা, বাংলাদেশ',
        'Sat–Thu, 9am–6pm', 'শনি–বৃহস্পতি, সকাল ৯টা–সন্ধ্যা ৬টা');
alter table public.site_info enable row level security;
create policy "site_info: public read" on public.site_info for select to anon, authenticated using (true);
revoke all on public.site_info from anon, authenticated;
grant select on public.site_info to anon, authenticated;

create or replace function public.admin_save_site_info(
  p_email text, p_phone text, p_whatsapp text, p_address_en text, p_address_bn text,
  p_hours_en text, p_hours_bn text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.site_info set
    contact_email = nullif(trim(p_email), ''),
    contact_phone = nullif(trim(p_phone), ''),
    whatsapp = nullif(trim(p_whatsapp), ''),
    address_en = nullif(trim(p_address_en), ''),
    address_bn = nullif(trim(p_address_bn), ''),
    office_hours_en = nullif(trim(p_hours_en), ''),
    office_hours_bn = nullif(trim(p_hours_bn), ''),
    updated_at = now()
  where id = 1;
  perform public.admin_log('site_info.save', 'system', '1');
end;
$$;
revoke execute on function public.admin_save_site_info(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_save_site_info(text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Contact-form messages
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (phone is null or char_length(phone) <= 40),
  subject     text check (subject is null or char_length(subject) <= 160),
  message     text not null check (char_length(message) between 5 and 4000),
  user_id     uuid references auth.users (id) on delete set null,
  status      text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using (public.is_super_admin());
-- Writes only through the functions below.

create or replace function public.submit_contact_message(
  p_name text, p_email text, p_phone text, p_subject text, p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if coalesce(trim(p_name), '') = '' or char_length(trim(coalesce(p_message, ''))) < 5 then
    raise exception 'Enter your name and a message.' using errcode = '22023';
  end if;
  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_phone), '') = '' then
    raise exception 'Give an email or a phone number so we can reply.' using errcode = '22023';
  end if;
  -- Simple flood guard: at most 20 messages in 10 minutes site-wide.
  select count(*) into v_recent from public.contact_messages where created_at > now() - interval '10 minutes';
  if v_recent >= 20 then
    raise exception 'Too many messages right now. Please try again later.' using errcode = '22023';
  end if;
  insert into public.contact_messages (name, email, phone, subject, message, user_id)
  values (left(trim(p_name), 120), nullif(lower(trim(p_email)), ''), nullif(left(trim(p_phone), 40), ''),
          nullif(left(trim(p_subject), 160), ''), left(trim(p_message), 4000), auth.uid());
end;
$$;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

create or replace function public.admin_set_contact_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_status not in ('new', 'read', 'archived') then
    raise exception 'Unknown status.' using errcode = '22023';
  end if;
  update public.contact_messages set status = p_status where id = p_id;
end;
$$;
revoke execute on function public.admin_set_contact_status(uuid, text) from public, anon;
grant execute on function public.admin_set_contact_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Customer reviews: users write one, a super admin approves it before it
-- appears on the home page.
-- ---------------------------------------------------------------------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  role         text check (role is null or char_length(role) <= 120),   -- e.g. "Dairy farmer, Bogura"
  rating       integer not null check (rating between 1 and 5),
  body         text not null check (char_length(body) between 10 and 600),
  lang         text not null default 'bn' check (lang in ('bn', 'en')),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  approved_at  timestamptz
);
create index reviews_status_idx on public.reviews (status, approved_at desc);
alter table public.reviews enable row level security;
create policy "reviews: approved public, own, admin" on public.reviews
  for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_super_admin());
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

-- Write or edit your own review; any change goes back to "pending".
create or replace function public.submit_review(p_name text, p_role text, p_rating integer, p_body text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in to write a review.' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' or p_rating is null or p_rating not between 1 and 5
     or char_length(trim(coalesce(p_body, ''))) not between 10 and 600 then
    raise exception 'Give a name, 1–5 stars and 10–600 characters of text.' using errcode = '22023';
  end if;
  insert into public.reviews (user_id, name, role, rating, body, lang)
  values (v_uid, left(trim(p_name), 80), nullif(left(trim(p_role), 120), ''), p_rating, trim(p_body),
          case when p_lang = 'en' then 'en' else 'bn' end)
  on conflict (user_id) do update set
    name = excluded.name, role = excluded.role, rating = excluded.rating, body = excluded.body,
    lang = excluded.lang, status = 'pending', approved_at = null, updated_at = now();
end;
$$;
revoke execute on function public.submit_review(text, text, integer, text, text) from public, anon;
grant execute on function public.submit_review(text, text, integer, text, text) to authenticated;

create or replace function public.admin_set_review_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Unknown status.' using errcode = '22023';
  end if;
  update public.reviews
     set status = p_status,
         approved_at = case when p_status = 'approved' then now() else null end,
         updated_at = now()
   where id = p_id;
  perform public.admin_log('review.' || p_status, 'review', p_id::text);
end;
$$;
revoke execute on function public.admin_set_review_status(uuid, text) from public, anon;
grant execute on function public.admin_set_review_status(uuid, text) to authenticated;

create or replace function public.admin_delete_review(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.reviews where id = p_id;
  perform public.admin_log('review.delete', 'review', p_id::text);
end;
$$;
revoke execute on function public.admin_delete_review(uuid) from public, anon;
grant execute on function public.admin_delete_review(uuid) to authenticated;

-- Platform totals for the home page (counts only, nothing identifying).
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'farms', (select count(*) from public.farms),
    'animals', (select count(*) from public.cattle where deleted_at is null and status = 'active'),
    'birds', (select coalesce(sum(current_count), 0) from public.flock_stats),
    'records', (select (select count(*) from public.milk_records) + (select count(*) from public.health_records)
                     + (select count(*) from public.breeding_events) + (select count(*) from public.flock_daily_logs))
  );
$$;
grant execute on function public.public_stats() to anon, authenticated;

-- Default text for the legal pages (super admins can edit it in Admin → Pages).
insert into public.site_pages (slug, title_en, title_bn, body_en, body_bn) values
  ('terms', 'Terms & Conditions', 'শর্তাবলী', $body$_Last updated: October 2026_

These terms explain the rules for using **FarmFlows** (the website, the web app and any mobile app). By creating an account you agree to them.

## 1. Who we are
FarmFlows is an online farm-management service for dairy, cattle and layer-poultry farms. Contact details are on the [Contact](/contact) page.

## 2. Your account
- Give correct information when you sign up and keep your password safe.
- You are responsible for what happens under your account and for the people you invite to your farm (managers, workers, doctors).
- You must be at least 18 years old, or use FarmFlows with a parent's or employer's permission.

## 3. Your farm data
- The records you enter (animals, milk, eggs, health, breeding, staff, money) belong to you.
- You give us permission to store and process them only to run the service for you.
- You can export your data on plans that include export, and you can ask us to delete your account.

## 4. Plans and payments
- The Free plan is free. Paid plans are billed as shown on the pricing section.
- Limits (number of animals, flocks, team members, AI prompts) depend on your plan. If you go over a limit, you may need to upgrade before adding more.
- Prices may change; we will tell you before a change affects you.

## 5. Acceptable use
Do not misuse FarmFlows: no illegal activity, no attempts to break security, no spam, no access to other people's farms without permission, and no automated scraping.

## 6. AI assistant
The AI assistant suggests records from what you type. **Nothing is saved until you press Confirm.** Always check the suggestion — you are responsible for the records you save. Advice from the app does not replace a qualified veterinarian.

## 7. Availability
We work to keep FarmFlows running, but we cannot promise it will never be interrupted. Keep your own copies of important records.

## 8. Suspension and closing
We may suspend accounts that break these terms. You can stop using FarmFlows at any time.

## 9. Liability
FarmFlows is provided "as is". As far as the law allows, we are not liable for indirect losses, such as lost profit, caused by using the service.

## 10. Changes
We may update these terms. If a change is important we will tell you in the app. Continuing to use FarmFlows means you accept the new terms.

## 11. Law
These terms are governed by the laws of Bangladesh.
$body$, $body$_সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬_

এই শর্তাবলীতে **FarmFlows** (ওয়েবসাইট, ওয়েব অ্যাপ ও মোবাইল অ্যাপ) ব্যবহারের নিয়ম বলা আছে। অ্যাকাউন্ট খুললে আপনি এই শর্তগুলো মেনে নিচ্ছেন।

## ১. আমরা কারা
FarmFlows ডেইরি, গবাদিপশু ও লেয়ার মুরগির খামারের জন্য একটি অনলাইন খামার-ব্যবস্থাপনা সেবা। যোগাযোগের তথ্য [যোগাযোগ](/contact) পাতায় আছে।

## ২. আপনার অ্যাকাউন্ট
- সাইন আপের সময় সঠিক তথ্য দিন এবং পাসওয়ার্ড গোপন রাখুন।
- আপনার অ্যাকাউন্টে যা হয় এবং আপনি খামারে যাদের আমন্ত্রণ জানান (ম্যানেজার, কর্মী, ডাক্তার), তার দায়িত্ব আপনার।
- আপনার বয়স অন্তত ১৮ বছর হতে হবে, অথবা অভিভাবক বা নিয়োগকর্তার অনুমতি নিয়ে ব্যবহার করতে হবে।

## ৩. আপনার খামারের তথ্য
- আপনি যে তথ্য লেখেন (পশু, দুধ, ডিম, স্বাস্থ্য, প্রজনন, কর্মী, টাকা) তা আপনার।
- শুধু আপনাকে সেবা দেওয়ার জন্য আমরা এগুলো সংরক্ষণ ও প্রক্রিয়া করি।
- এক্সপোর্টসহ প্ল্যানে আপনি তথ্য নামিয়ে নিতে পারবেন, আর অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারবেন।

## ৪. প্ল্যান ও পেমেন্ট
- ফ্রি প্ল্যান বিনামূল্যে। পেইড প্ল্যানের দাম দামের অংশে দেখানো আছে।
- পশু, ফ্লক, টিম সদস্য ও এআই প্রম্পটের সীমা আপনার প্ল্যানের উপর নির্ভর করে। সীমা পার হলে আরও যোগ করতে আপগ্রেড লাগতে পারে।
- দাম বদলাতে পারে; বদল আপনার উপর প্রভাব ফেলার আগে আমরা জানাব।

## ৫. গ্রহণযোগ্য ব্যবহার
অবৈধ কাজ, নিরাপত্তা ভাঙার চেষ্টা, স্প্যাম, অনুমতি ছাড়া অন্যের খামারে প্রবেশ বা স্বয়ংক্রিয়ভাবে তথ্য টেনে নেওয়া — এসব করবেন না।

## ৬. এআই সহকারী
এআই সহকারী আপনার লেখা থেকে রেকর্ডের প্রস্তাব দেয়। **আপনি নিশ্চিত না করা পর্যন্ত কিছুই সংরক্ষিত হয় না।** প্রস্তাবটি সবসময় দেখে নিন — সংরক্ষিত রেকর্ডের দায়িত্ব আপনার। অ্যাপের পরামর্শ অভিজ্ঞ পশু চিকিৎসকের বিকল্প নয়।

## ৭. সেবার প্রাপ্যতা
আমরা FarmFlows চালু রাখতে চেষ্টা করি, তবে কখনো বিঘ্ন হবে না — এমন নিশ্চয়তা দিতে পারি না। গুরুত্বপূর্ণ রেকর্ডের নিজস্ব কপি রাখুন।

## ৮. স্থগিত ও বন্ধ করা
এই শর্ত ভাঙলে আমরা অ্যাকাউন্ট স্থগিত করতে পারি। আপনি যেকোনো সময় ব্যবহার বন্ধ করতে পারেন।

## ৯. দায়
FarmFlows "যেমন আছে" ভিত্তিতে দেওয়া হয়। আইন যতটুকু অনুমতি দেয়, সেবা ব্যবহারের কারণে পরোক্ষ ক্ষতির (যেমন লাভ হারানো) দায় আমাদের নয়।

## ১০. পরিবর্তন
আমরা এই শর্তাবলী হালনাগাদ করতে পারি। বড় পরিবর্তন হলে অ্যাপে জানাব। এরপরও ব্যবহার চালিয়ে গেলে নতুন শর্ত মেনে নেওয়া হবে।

## ১১. আইন
এই শর্তাবলী বাংলাদেশের আইন অনুযায়ী পরিচালিত হবে।
$body$),
  ('privacy', 'Privacy Policy', 'গোপনীয়তা নীতি', $body$_Last updated: October 2026_

This policy explains what **FarmFlows** collects, why, and the choices you have.

## What we collect
- **Account details:** name, email, phone (optional) and profile photo.
- **Farm records:** everything you and your team enter — animals, milk, eggs, health, breeding, staff, salary and money.
- **Sign-in and usage data:** the IP address and approximate location (country, region, city) of signed-in users, taken from our hosting provider's network, plus the date of each sign-in.
- **Site visits:** pages viewed, the referring website, device type and country. Visitors who are not signed in are counted **without** storing their IP address. A random visitor ID is kept in your browser; "Do Not Track" is respected.
- **Messages you send us** through the contact form, and **reviews** you write.

## Why we use it
To run your farm account, keep it secure (for example, spotting unusual sign-ins), answer your messages, improve the service, and show approved reviews on our website.

## AI assistant
When you use the AI assistant, the text you type and a short summary of your farm (for example, animal tag numbers) are sent to the AI provider chosen by FarmFlows (Google Gemini or Anthropic Claude) to prepare a suggestion. Nothing is saved until you confirm.

## Who can see your data
- People you add to your farm, according to their role. Doctors cannot see finances.
- FarmFlows administrators, only to provide support and keep the service safe.
- Service providers that host and run FarmFlows (database and hosting, email delivery, the AI provider). We do **not** sell your data.

## Cookies and storage
We use cookies to keep you signed in and remember your language and theme. We use browser storage for a random visitor ID. We do not use advertising cookies.

## How long we keep it
Farm records stay while your account exists. Page-view statistics are deleted after about 13 months.

## Your choices
You can update your profile, export your data (on plans with export), and ask us to delete your account and farm data. Contact us through the [Contact](/contact) page.

## Children
FarmFlows is not meant for children under 13.

## Changes
We may update this policy and will show the new date above.
$body$, $body$_সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬_

এই নীতিতে **FarmFlows** কী তথ্য নেয়, কেন নেয় এবং আপনার কী কী সুযোগ আছে তা বলা আছে।

## আমরা কী তথ্য নিই
- **অ্যাকাউন্টের তথ্য:** নাম, ইমেইল, ফোন (ঐচ্ছিক) ও প্রোফাইল ছবি।
- **খামারের রেকর্ড:** আপনি ও আপনার টিম যা লেখেন — পশু, দুধ, ডিম, স্বাস্থ্য, প্রজনন, কর্মী, বেতন ও টাকার হিসাব।
- **লগইন ও ব্যবহারের তথ্য:** লগইন করা ব্যবহারকারীর আইপি ঠিকানা ও আনুমানিক অবস্থান (দেশ, অঞ্চল, শহর) — হোস্টিং সেবার নেটওয়ার্ক থেকে — এবং প্রতিটি লগইনের সময়।
- **সাইট ভিজিট:** কোন পাতা দেখা হয়েছে, কোন সাইট থেকে এসেছেন, ডিভাইসের ধরন ও দেশ। লগইন না করা ভিজিটরের আইপি **রাখা হয় না**। আপনার ব্রাউজারে একটি এলোমেলো ভিজিটর আইডি রাখা হয়; "Do Not Track" মানা হয়।
- **যোগাযোগ ফর্মে পাঠানো বার্তা** ও আপনার লেখা **রিভিউ**।

## কেন ব্যবহার করি
আপনার খামারের অ্যাকাউন্ট চালাতে, নিরাপদ রাখতে (যেমন অস্বাভাবিক লগইন ধরতে), আপনার বার্তার উত্তর দিতে, সেবা উন্নত করতে এবং অনুমোদিত রিভিউ ওয়েবসাইটে দেখাতে।

## এআই সহকারী
এআই সহকারী ব্যবহার করলে আপনার লেখা ও খামারের সংক্ষিপ্ত তথ্য (যেমন পশুর ট্যাগ নম্বর) FarmFlows নির্বাচিত এআই সেবায় (Google Gemini বা Anthropic Claude) পাঠানো হয় প্রস্তাব তৈরির জন্য। আপনি নিশ্চিত না করা পর্যন্ত কিছুই সংরক্ষিত হয় না।

## কারা আপনার তথ্য দেখতে পায়
- আপনি খামারে যাদের যোগ করেন, তাদের ভূমিকা অনুযায়ী। ডাক্তাররা আয়-ব্যয় দেখতে পান না।
- FarmFlows-এর অ্যাডমিনরা, শুধু সহায়তা দিতে ও সেবা নিরাপদ রাখতে।
- যে সেবাগুলো FarmFlows চালায় (ডাটাবেস ও হোস্টিং, ইমেইল পাঠানো, এআই সেবা)। আমরা আপনার তথ্য **বিক্রি করি না**।

## কুকি ও স্টোরেজ
লগইন রাখা এবং ভাষা ও থিম মনে রাখার জন্য কুকি ব্যবহার করি। এলোমেলো ভিজিটর আইডির জন্য ব্রাউজার স্টোরেজ ব্যবহার করি। বিজ্ঞাপনের কুকি ব্যবহার করি না।

## কতদিন রাখি
অ্যাকাউন্ট থাকা পর্যন্ত খামারের রেকর্ড থাকে। পেজ ভিউয়ের হিসাব প্রায় ১৩ মাস পর মুছে ফেলা হয়।

## আপনার সুযোগ
প্রোফাইল হালনাগাদ করতে, তথ্য এক্সপোর্ট করতে (এক্সপোর্টসহ প্ল্যানে) এবং অ্যাকাউন্ট ও খামারের তথ্য মুছে ফেলার অনুরোধ করতে পারেন। [যোগাযোগ](/contact) পাতা থেকে আমাদের জানান।

## শিশু
FarmFlows ১৩ বছরের কম বয়সী শিশুদের জন্য নয়।

## পরিবর্তন
আমরা এই নীতি হালনাগাদ করতে পারি এবং উপরে নতুন তারিখ দেখাব।
$body$);

-- Page views older than ~13 months are cleared now and then (about 1 in 500 visits).
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
  if random() < 0.002 then
    delete from public.page_views where created_at < now() - interval '400 days';
  end if;
end;
$$;
