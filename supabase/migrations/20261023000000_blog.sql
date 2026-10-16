-- =====================================================================
-- Blog: public articles managed by super admins
-- =====================================================================
create table public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title_en      text check (title_en is null or char_length(title_en) <= 200),
  title_bn      text check (title_bn is null or char_length(title_bn) <= 200),
  summary_en    text check (summary_en is null or char_length(summary_en) <= 500),
  summary_bn    text check (summary_bn is null or char_length(summary_bn) <= 500),
  body_en       text check (body_en is null or char_length(body_en) <= 60000),
  body_bn       text check (body_bn is null or char_length(body_bn) <= 60000),
  published     boolean not null default false,
  published_at  timestamptz,
  author_id     uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- at least one language must be complete
  check (
    (nullif(trim(title_en), '') is not null and nullif(trim(body_en), '') is not null)
    or (nullif(trim(title_bn), '') is not null and nullif(trim(body_bn), '') is not null)
  )
);

create index blog_posts_published_idx on public.blog_posts (published, published_at desc);
create trigger set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;
create policy "blog: read published, admins read all" on public.blog_posts
  for select to anon, authenticated
  using (published or (auth.uid() is not null and public.is_super_admin()));

-- All writes go through the admin_* functions below (no direct table writes).
revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;

create or replace function public.admin_save_blog_post(
  p_id uuid, p_slug text,
  p_title_en text, p_title_bn text,
  p_summary_en text, p_summary_bn text,
  p_body_en text, p_body_bn text,
  p_published boolean
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

  if p_id is null then
    insert into public.blog_posts (
      slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn,
      published, published_at, author_id
    ) values (
      lower(trim(p_slug)), nullif(trim(p_title_en), ''), nullif(trim(p_title_bn), ''),
      nullif(trim(p_summary_en), ''), nullif(trim(p_summary_bn), ''),
      nullif(trim(p_body_en), ''), nullif(trim(p_body_bn), ''),
      coalesce(p_published, false),
      case when coalesce(p_published, false) then now() end,
      auth.uid()
    ) returning id into v_id;
    perform public.admin_log('blog.create', 'blog_post', v_id::text, jsonb_build_object('slug', lower(trim(p_slug))));
  else
    update public.blog_posts set
      slug = lower(trim(p_slug)),
      title_en = nullif(trim(p_title_en), ''), title_bn = nullif(trim(p_title_bn), ''),
      summary_en = nullif(trim(p_summary_en), ''), summary_bn = nullif(trim(p_summary_bn), ''),
      body_en = nullif(trim(p_body_en), ''), body_bn = nullif(trim(p_body_bn), ''),
      published = coalesce(p_published, false),
      published_at = case
        when coalesce(p_published, false) then coalesce(published_at, now())
        else published_at end
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
    perform public.admin_log('blog.update', 'blog_post', v_id::text,
      jsonb_build_object('slug', lower(trim(p_slug)), 'published', coalesce(p_published, false)));
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_delete_blog_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.blog_posts where id = p_id;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.delete', 'blog_post', p_id::text);
end;
$$;

revoke execute on function
  public.admin_save_blog_post(uuid, text, text, text, text, text, text, text, boolean),
  public.admin_delete_blog_post(uuid)
  from public, anon;
grant execute on function
  public.admin_save_blog_post(uuid, text, text, text, text, text, text, text, boolean),
  public.admin_delete_blog_post(uuid)
  to authenticated;

-- First article: how to organise cattle tag numbers.
insert into public.blog_posts (slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn, published, published_at)
values (
  $body$how-to-organise-cattle-tag-numbers$body$, $body$How to organise cattle tag numbers: simple, mistake-proof rules$body$, $body$গরুর ট্যাগ নম্বর কীভাবে সাজাবেন: সহজ ও নির্ভুল নিয়ম$body$,
  $body$How to number your cattle so every animal is easy to identify and records never get mixed up: 5 rules, 3 patterns and how to do it in FarmFlow.$body$, $body$ট্যাগ নম্বর কীভাবে সাজালে পশু চেনা সহজ হয়, রেকর্ড গুলিয়ে যায় না: ৫টি নিয়ম, তিনটি ছাঁচ ও FarmFlow-এ ধাপে ধাপে বসানোর উপায়।$body$,
  $body$A cattle tag number is more than a number. It is each animal's **ID card**. Milk yields, vaccines and breeding records all hang on it, so when numbers get mixed up, records get mixed up. Pick a clear system on day one.

## 5 rules for good tag numbers

1. **Every number is unique.** Never give the same number to two animals.
2. **Keep it short and readable.** 3 to 6 characters is plenty. It fits large on an ear tag and can be read from a distance.
3. **Never reuse a number.** Even after an animal is sold or dies, do not give its number to another animal, or old records will mix with the new animal.
4. **One pattern for everybody.** If one animal is `7`, another `cow-09` and another `C12`, finding them gets hard.
5. **The ear tag and your register or app must match exactly.**

## Three popular patterns

| Pattern | Example | Good when |
| --- | --- | --- |
| Plain running number | `001`, `002`, `003` | Small farms, simplest |
| Type + number | `C-001` (cow), `H-001` (heifer), `B-001` (bull) | You want to know the type at a glance |
| Year + number | `26-001`, `26-002` (arrived or born in 2026) | Larger farms, age is easy to guess |

**Our advice:** with fewer than 100 animals, use a plain running number (`001`, `002`...). It causes the fewest mistakes. FarmFlow already stores type and date of birth, so there is no need to pack them into the number.

## Pad with zeros: `001`, `002`

When a computer sorts numbers as text, it puts `1, 10, 11, 2, 3` in that order. Always write the same length (`001, 002 ... 010, 011`) and the list stays in the right order.

## Calf tags

- Tag the calf **within 7 days** of birth and record it.
- **Do not put the mother's number in the calf's number.** In FarmFlow, choose the mother in the "Mother" field and the link is kept. Just give the calf the next number in your sequence.
- When you record a calving on the Breeding page, you can add the calf right there with its tag. Mother and father are filled in for you.

## Bought animals

A purchased animal may already carry the previous owner's tag. If you don't want to replace it, give the animal **your own new number** and write the old tag in the Notes field. Your sequence stays clean and the history is not lost.

## Sold, dead and archived

- Mark an animal **Sold** or **Dead** when that happens.
- To hide an animal from your lists for now, **Archive** it. Its records stay and you can restore it later.
- Use **Delete** only for animals added by mistake. It also permanently removes all of the animal's milk, health and breeding records.

## Adding and changing tags in FarmFlow

1. Open **Cattle**, type the tag in the "Tag number" field of the form and add the animal.
2. Made a mistake? Open the animal's page, fix the tag in the **Details** card and save. All earlier records stay attached.
3. If the number already exists, FarmFlow tells you.
4. Type a tag, name or breed in the search box above the list to find an animal quickly.

## Common mistakes

- **Packing too much into the number,** like `HF-26-MAR-COW-07`. Long numbers are easy to write and read wrongly.
- **Mixing letters and digits:** `O` and `0`, `I` and `1`. Prefer digits only.
- **Making the number do the colour's job.** Use different coloured tags to separate groups (milking, heifers, bulls) and keep the number pattern the same.
- **Re-issuing a number after a lost tag.** That is fine if you know the animal, but check first that the number does not belong to another animal.

## Quick checklist

- Choose a pattern (simplest: `001`, `002`...)
- Every number unique and never reused
- Ear tag and FarmFlow number identical
- Calves tagged and recorded within 7 days
- On sale or death, change the status; don't delete
$body$,
  $body$গরুর ট্যাগ নম্বর শুধু একটা সংখ্যা নয়। এটাই প্রতিটি পশুর **পরিচয়পত্র**। দুধ কত দিল, কবে টিকা পড়ল, কবে প্রজনন করানো হলো, সবকিছু এই নম্বর ধরেই মেলে। নম্বর গুলিয়ে গেলে রেকর্ডও গুলিয়ে যায়। তাই শুরুতেই একটা পরিষ্কার নিয়ম ঠিক করে নিন।

## ভালো ট্যাগ নম্বরের ৫টি নিয়ম

1. **প্রতিটি নম্বর আলাদা হবে।** একই নম্বর কখনোই দুটি পশুকে দেবেন না।
2. **ছোট ও সহজ রাখুন।** ৩ থেকে ৬ অক্ষরই যথেষ্ট। কানের ট্যাগে বড় করে লেখা যায়, দূর থেকেও পড়া যায়।
3. **পুরনো নম্বর আর ব্যবহার করবেন না।** পশু বিক্রি হলে বা মারা গেলেও তার নম্বর আর কাউকে দেবেন না। নইলে পুরনো রেকর্ডে অন্য পশুর তথ্য মিশে যাবে।
4. **একই ছাঁচ সবার জন্য।** কারও নম্বর `7`, কারও `গাভী-০৯`, কারও `C12`, এমন হলে খুঁজে পাওয়া কঠিন।
5. **কানের ট্যাগ আর খাতা বা অ্যাপের নম্বর হুবহু এক হবে।** দুই জায়গায় দুই রকম হলে বিভ্রান্তি নিশ্চিত।

## তিনটি জনপ্রিয় ছাঁচ

| ছাঁচ | উদাহরণ | কখন ভালো |
| --- | --- | --- |
| শুধু ক্রমিক সংখ্যা | `001`, `002`, `003` | ছোট খামার, সবচেয়ে সহজ |
| ধরন + ক্রম | `C-001` (গাভী), `H-001` (বকনা), `B-001` (ষাঁড়) | ধরন দেখেই চেনা যায় |
| বছর + ক্রম | `26-001`, `26-002` (২০২৬ সালে আসা বা জন্মানো) | বড় খামার, বয়স আন্দাজ করা যায় |

**আমাদের পরামর্শ:** ১০০টির কম পশু হলে শুধু ক্রমিক সংখ্যা (`001`, `002`...) রাখুন। এটাই সবচেয়ে কম ভুল হয়। ধরন বা বয়স জানতে চাইলে FarmFlow-এ পশুর ধরন ও জন্মতারিখ তো রাখাই আছে, নম্বরের ভেতরে সেগুলো ঢোকানোর দরকার নেই।

## শূন্য দিয়ে ভরাট করুন: `001`, `002`

কম্পিউটারে নম্বর যখন লেখা হিসেবে সাজানো হয়, তখন `1, 10, 11, 2, 3` এই ক্রমে আসে। এড়াতে সবসময় একই দৈর্ঘ্যে লিখুন: `001, 002, 003 ... 010, 011`। তাহলে তালিকা ঠিক ক্রমে সাজানো থাকে।

## বাছুরের ট্যাগ

- জন্মের **৭ দিনের মধ্যে** কানে ট্যাগ পরান এবং রেকর্ডে তুলুন।
- **মায়ের নম্বর বাছুরের নম্বরে ঢোকাবেন না।** FarmFlow-এ বাছুরের "মা" ঘরে মাকে বেছে দিলেই সম্পর্ক সংরক্ষিত থাকে। বাছুরকে সাধারণ ক্রমের পরের নম্বরই দিন।
- প্রজনন পাতায় "বাছুর হয়েছে" লিখলে সেখানেই বাছুরের ট্যাগ দিয়ে তাকে খামারে যোগ করা যায়। মা ও বাবার তথ্য নিজে থেকে বসে যায়।

## কিনে আনা পশু

কেনা পশুর আগের মালিকের ট্যাগ থাকতে পারে। সেটা বদলাতে না চাইলে **নিজের নতুন নম্বর** দিন, আর আগের ট্যাগটা "নোট" ঘরে লিখে রাখুন। এতে আপনার ক্রম ঠিক থাকে, আগের ইতিহাসও হারায় না।

## বিক্রি, মৃত্যু আর আর্কাইভ

- বিক্রি হলে অবস্থা **"বিক্রিত"**, মারা গেলে **"মৃত"** করুন।
- পশুটিকে আপাতত তালিকা থেকে সরাতে চাইলে **আর্কাইভ** করুন। রেকর্ড থাকবে, চাইলে পরে ফিরিয়ে আনা যাবে।
- **মুছে ফেলুন** কেবল ভুল করে যোগ হওয়া পশুর জন্য। এতে পশুর সব দুধ, স্বাস্থ্য ও প্রজননের রেকর্ডও চিরতরে মুছে যায়।

## FarmFlow-এ ট্যাগ বসানো ও বদলানো

1. **গবাদিপশু** পাতায় যান, ডানের ফর্মে "ট্যাগ নম্বর" লিখে পশু যোগ করুন।
2. ভুল হলে পশুর পাতা খুলে নিচের **"বিবরণ"** কার্ডে ট্যাগ নম্বর ঠিক করে সংরক্ষণ করুন। আগের সব রেকর্ড ঠিক থাকবে।
3. একই নম্বর আগে থেকে থাকলে FarmFlow নিজেই জানিয়ে দেবে।
4. তালিকার ওপরের খোঁজার ঘরে ট্যাগ, নাম বা জাত লিখে সহজে পশু খুঁজে নিন।

## সাধারণ কিছু ভুল

- **নম্বরে অনেক তথ্য ঢোকানো**, যেমন `HF-26-মার্চ-গাভী-07`। লম্বা নম্বর ভুল লেখা আর ভুল পড়ার ঝুঁকি বাড়ায়।
- **অক্ষর আর সংখ্যা গুলিয়ে ফেলা:** `O` আর `0`, `I` আর `1`। সম্ভব হলে অক্ষর কমিয়ে শুধু সংখ্যা রাখুন।
- **রঙের কাজ নম্বরকে দিয়ে করানো।** দলের পার্থক্য (দুধেল, বকনা, ষাঁড়) বোঝাতে বরং আলাদা রঙের ট্যাগ ব্যবহার করুন, নম্বর একই ছাঁচে থাকুক।
- **ট্যাগ হারিয়ে গেলে একই নম্বরে নতুন ট্যাগ বানানো।** পশু চেনা থাকলে ঠিক আছে, কিন্তু আগে নিশ্চিত হয়ে নিন, নম্বরটা অন্য পশুর নয়।

## সংক্ষেপে চেকলিস্ট

- ছাঁচ ঠিক করুন (সবচেয়ে সহজ: `001`, `002`...)
- প্রতিটি নম্বর আলাদা, আর কখনো পুনর্ব্যবহার নয়
- কানের ট্যাগ আর FarmFlow-এর নম্বর হুবহু এক
- বাছুর জন্মের ৭ দিনের মধ্যে ট্যাগ ও রেকর্ড
- বিক্রি বা মৃত্যুতে অবস্থা বদলান, মুছবেন না
$body$,
  true, now()
);
