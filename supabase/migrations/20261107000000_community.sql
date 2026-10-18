-- =====================================================================
-- Community, phase 1: farmers' questions and answers.
-- Anyone can read published posts; signed-in users write. Verified vets
-- get a badge. Members report bad posts; posts with 3 reports are hidden
-- until a super admin reviews them. Super admins can switch on
-- pre-moderation (new posts wait for approval) and block users.
-- All writes go through the functions below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Settings and per-user block
-- ---------------------------------------------------------------------
alter table public.system_settings
  add column community_premoderation boolean not null default false;

alter table public.profiles
  add column community_banned boolean not null default false;

-- ---------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------
create table public.community_topics (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  name_en    text not null check (char_length(trim(name_en)) between 1 and 60),
  name_bn    text not null check (char_length(trim(name_bn)) between 1 and 60),
  sort_order int not null default 0
);
alter table public.community_topics enable row level security;
create policy "community_topics: read" on public.community_topics for select to anon, authenticated using (true);
revoke all on public.community_topics from anon, authenticated;
grant select on public.community_topics to anon, authenticated;

insert into public.community_topics (slug, name_en, name_bn, sort_order) values
  ('cattle-health', 'Cattle health', 'গরুর স্বাস্থ্য', 1),
  ('breeding', 'Breeding & calving', 'প্রজনন ও বাছুর', 2),
  ('feed', 'Feed & fodder', 'খাদ্য ও ঘাস', 3),
  ('milk', 'Milk & dairy', 'দুধ ও দুগ্ধ খামার', 4),
  ('poultry', 'Layer poultry', 'লেয়ার মুরগি', 5),
  ('market', 'Prices & market', 'দাম ও বাজার', 6),
  ('general', 'Farm management', 'খামার ব্যবস্থাপনা', 7);

-- ---------------------------------------------------------------------
-- Questions and answers
-- ---------------------------------------------------------------------
create table public.community_questions (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references auth.users (id) on delete cascade,
  topic_id         uuid references public.community_topics (id) on delete set null,
  title            text not null check (char_length(trim(title)) between 10 and 200),
  body             text not null check (char_length(trim(body)) between 10 and 10000),
  images           text[] not null default '{}' check (cardinality(images) <= 4),
  status           text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  best_answer_id   uuid,
  answer_count     int not null default 0,
  helpful_count    int not null default 0,
  report_count     int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index community_questions_list_idx on public.community_questions (status, last_activity_at desc);
create index community_questions_topic_idx on public.community_questions (topic_id, status, last_activity_at desc);
create index community_questions_author_idx on public.community_questions (author_id);
create trigger set_updated_at before update on public.community_questions
  for each row execute function public.set_updated_at();

create table public.community_answers (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.community_questions (id) on delete cascade,
  author_id     uuid not null references auth.users (id) on delete cascade,
  body          text not null check (char_length(trim(body)) between 2 and 10000),
  images        text[] not null default '{}' check (cardinality(images) <= 4),
  status        text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  helpful_count int not null default 0,
  report_count  int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index community_answers_question_idx on public.community_answers (question_id, created_at);
create index community_answers_author_idx on public.community_answers (author_id);
create trigger set_updated_at before update on public.community_answers
  for each row execute function public.set_updated_at();

alter table public.community_questions
  add constraint community_questions_best_answer_fk
  foreign key (best_answer_id) references public.community_answers (id) on delete set null;

-- "Helpful" marks (one per member per post) and reports.
create table public.community_votes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('question', 'answer')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index community_votes_target_idx on public.community_votes (target_type, target_id);

create table public.community_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('question', 'answer')),
  target_id   uuid not null,
  reason      text not null check (reason in ('spam', 'wrong', 'abusive', 'other')),
  note        text check (note is null or char_length(note) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index community_reports_open_idx on public.community_reports (status, created_at desc);

-- ---------------------------------------------------------------------
-- Read access
-- ---------------------------------------------------------------------
alter table public.community_questions enable row level security;
alter table public.community_answers enable row level security;
alter table public.community_votes enable row level security;
alter table public.community_reports enable row level security;

create policy "community_questions: read" on public.community_questions for select to anon, authenticated
  using (
    status = 'published'
    or (auth.uid() is not null and (author_id = auth.uid() or public.is_super_admin()))
  );
-- An answer is visible when it and its question are published (authors see their own; admins see all).
create policy "community_answers: read" on public.community_answers for select to anon, authenticated
  using (
    (status = 'published' and exists (
      select 1 from public.community_questions q where q.id = question_id and q.status = 'published'))
    or (auth.uid() is not null and (author_id = auth.uid() or public.is_super_admin()))
  );
create policy "community_votes: read own" on public.community_votes for select to authenticated
  using (user_id = auth.uid());
create policy "community_reports: admins read" on public.community_reports for select to authenticated
  using (public.is_super_admin());

revoke all on public.community_questions, public.community_answers, public.community_votes, public.community_reports
  from anon, authenticated;
grant select on public.community_questions, public.community_answers to anon, authenticated;
grant select on public.community_votes, public.community_reports to authenticated;

-- Public author cards: only name, photo and vet badge, and only for people who have posted.
create or replace function public.community_authors(p_ids uuid[])
returns table (id uuid, full_name text, avatar_url text, is_vet boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(trim(p.full_name), ''), 'FarmFlows member'), p.avatar_url,
         (p.account_type = 'doctor' and p.doctor_verified)
  from public.profiles p
  where p.id = any (p_ids[1:200])
    and (exists (select 1 from public.community_questions q where q.author_id = p.id)
         or exists (select 1 from public.community_answers a where a.author_id = p.id));
$$;

-- Is the signed-in user allowed to post? (Shown in the UI.)
create or replace function public.community_can_post()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and not coalesce((select community_banned from public.profiles where id = auth.uid()), true);
$$;

-- ---------------------------------------------------------------------
-- Counters
-- ---------------------------------------------------------------------
create or replace function public.community_refresh_question(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.community_questions q set
    answer_count = (select count(*) from public.community_answers a where a.question_id = q.id and a.status = 'published'),
    helpful_count = (select count(*) from public.community_votes v where v.target_type = 'question' and v.target_id = q.id)
  where q.id = p_id;
$$;

-- ---------------------------------------------------------------------
-- Write functions
-- ---------------------------------------------------------------------

-- Common checks: signed in, not blocked, images inside the user's own folder.
create or replace function public.community_assert_writer(p_images text[])
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_img text;
begin
  if auth.uid() is null then raise exception 'Sign in to post.' using errcode = '42501'; end if;
  if coalesce((select community_banned from public.profiles where id = auth.uid()), true) then
    raise exception 'You cannot post in the community.' using errcode = '42501';
  end if;
  foreach v_img in array coalesce(p_images, '{}') loop
    if v_img !~ ('^' || auth.uid()::text || '/[a-z0-9-]+\.webp$') then
      raise exception 'Invalid image.' using errcode = '22023';
    end if;
  end loop;
  return case when (select community_premoderation from public.system_settings where id = 1)
              and not public.is_super_admin() then 'pending' else 'published' end;
end;
$$;

create or replace function public.community_ask(p_topic uuid, p_title text, p_body text, p_images text[] default '{}')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := public.community_assert_writer(p_images);
  v_id uuid;
begin
  if (select count(*) from public.community_questions
      where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many questions. Please wait a while.' using errcode = '54000';
  end if;
  insert into public.community_questions (author_id, topic_id, title, body, images, status)
  values (auth.uid(), p_topic, trim(p_title), trim(p_body), coalesce(p_images, '{}'), v_status)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.community_answer(p_question uuid, p_body text, p_images text[] default '{}')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := public.community_assert_writer(p_images);
  v_id uuid;
begin
  if not exists (select 1 from public.community_questions where id = p_question and status = 'published') then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;
  if (select count(*) from public.community_answers
      where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many answers. Please wait a while.' using errcode = '54000';
  end if;
  insert into public.community_answers (question_id, author_id, body, images, status)
  values (p_question, auth.uid(), trim(p_body), coalesce(p_images, '{}'), v_status)
  returning id into v_id;
  if v_status = 'published' then
    update public.community_questions set last_activity_at = now() where id = p_question;
    perform public.community_refresh_question(p_question);
  end if;
  return v_id;
end;
$$;

-- Authors edit their own posts (title/topic only for questions).
create or replace function public.community_edit(
  p_type text, p_id uuid, p_body text, p_title text default null, p_topic uuid default null, p_images text[] default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.community_assert_writer(coalesce(p_images, '{}'));
  if p_type = 'question' then
    update public.community_questions set
      body = trim(p_body), title = coalesce(trim(p_title), title), topic_id = coalesce(p_topic, topic_id),
      images = coalesce(p_images, images)
    where id = p_id and author_id = auth.uid();
  elsif p_type = 'answer' then
    update public.community_answers set body = trim(p_body), images = coalesce(p_images, images)
    where id = p_id and author_id = auth.uid();
  else
    raise exception 'Bad type' using errcode = '22023';
  end if;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
end;
$$;

-- Authors (and super admins) delete posts. Returns the image paths to remove from storage.
create or replace function public.community_delete(p_type text, p_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_images text[];
  v_question uuid;
  v_author uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_type = 'question' then
    select author_id into v_author from public.community_questions where id = p_id;
    if v_author is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
    if v_author <> auth.uid() and not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
    select coalesce(array_agg(i), '{}') into v_images from (
      select unnest(images) i from public.community_questions where id = p_id
      union all
      select unnest(images) from public.community_answers where question_id = p_id) x;
    delete from public.community_questions where id = p_id;
    delete from public.community_votes where target_type = 'question' and target_id = p_id;
    delete from public.community_reports where target_type = 'question' and target_id = p_id;
  elsif p_type = 'answer' then
    select author_id, question_id, images into v_author, v_question, v_images from public.community_answers where id = p_id;
    if v_author is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
    if v_author <> auth.uid() and not public.is_super_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
    delete from public.community_answers where id = p_id;
    delete from public.community_votes where target_type = 'answer' and target_id = p_id;
    delete from public.community_reports where target_type = 'answer' and target_id = p_id;
    perform public.community_refresh_question(v_question);
  else
    raise exception 'Bad type' using errcode = '22023';
  end if;
  if public.is_super_admin() and v_author <> auth.uid() then
    perform public.admin_log('community.delete', 'community_' || p_type, p_id::text);
  end if;
  return v_images;
end;
$$;

-- Toggle "helpful". Returns true when the mark is now on.
create or replace function public.community_toggle_helpful(p_type text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_question uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_type = 'question' then
    select author_id, id into v_author, v_question from public.community_questions where id = p_id and status = 'published';
  elsif p_type = 'answer' then
    select a.author_id, a.question_id into v_author, v_question from public.community_answers a
    where a.id = p_id and a.status = 'published';
  end if;
  if v_author is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
  if v_author = auth.uid() then raise exception 'You cannot mark your own post.' using errcode = '22023'; end if;

  delete from public.community_votes where user_id = auth.uid() and target_type = p_type and target_id = p_id;
  if found then
    if p_type = 'answer' then
      update public.community_answers set helpful_count = greatest(helpful_count - 1, 0) where id = p_id;
    end if;
    perform public.community_refresh_question(v_question);
    return false;
  end if;
  insert into public.community_votes (user_id, target_type, target_id) values (auth.uid(), p_type, p_id);
  if p_type = 'answer' then
    update public.community_answers set helpful_count = helpful_count + 1 where id = p_id;
  end if;
  perform public.community_refresh_question(v_question);
  return true;
end;
$$;

-- The asker picks (or un-picks) the answer that solved the problem.
create or replace function public.community_set_best_answer(p_question uuid, p_answer uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_answer is not null and not exists (
    select 1 from public.community_answers where id = p_answer and question_id = p_question and status = 'published'
  ) then
    raise exception 'Answer not found' using errcode = 'P0002';
  end if;
  update public.community_questions set best_answer_id = p_answer
  where id = p_question and (author_id = auth.uid() or public.is_super_admin());
  if not found then raise exception 'Forbidden' using errcode = '42501'; end if;
end;
$$;

-- Report a post. 3 open reports hide it until a super admin looks.
create or replace function public.community_report(p_type text, p_id uuid, p_reason text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_type = 'question' and not exists (select 1 from public.community_questions where id = p_id and status = 'published')
     or p_type = 'answer' and not exists (select 1 from public.community_answers where id = p_id and status = 'published')
     or p_type not in ('question', 'answer') then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  insert into public.community_reports (reporter_id, target_type, target_id, reason, note)
  values (auth.uid(), p_type, p_id, p_reason, nullif(trim(p_note), ''))
  on conflict (reporter_id, target_type, target_id) do nothing;

  select count(*) into v_count from public.community_reports
  where target_type = p_type and target_id = p_id and status = 'open';
  if p_type = 'question' then
    update public.community_questions set report_count = v_count,
      status = case when v_count >= 3 then 'hidden' else status end
    where id = p_id;
  else
    update public.community_answers set report_count = v_count,
      status = case when v_count >= 3 then 'hidden' else status end
    where id = p_id;
    perform public.community_refresh_question((select question_id from public.community_answers where id = p_id));
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Super admin moderation
-- ---------------------------------------------------------------------
create or replace function public.admin_community_set_status(p_type text, p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question uuid;
begin
  perform public.admin_assert();
  if p_status not in ('pending', 'published', 'hidden') then raise exception 'Bad status' using errcode = '22023'; end if;
  if p_type = 'question' then
    update public.community_questions set status = p_status where id = p_id returning id into v_question;
  elsif p_type = 'answer' then
    update public.community_answers set status = p_status where id = p_id returning question_id into v_question;
  end if;
  if v_question is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
  -- Approving or restoring clears its reports.
  if p_status = 'published' then
    update public.community_reports set status = 'resolved' where target_type = p_type and target_id = p_id;
    if p_type = 'question' then update public.community_questions set report_count = 0 where id = p_id;
    else update public.community_answers set report_count = 0 where id = p_id; end if;
  end if;
  perform public.community_refresh_question(v_question);
  perform public.admin_log('community.' || p_status, 'community_' || p_type, p_id::text);
end;
$$;

create or replace function public.admin_community_dismiss_reports(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.community_reports set status = 'resolved' where target_type = p_type and target_id = p_id;
  perform public.admin_community_set_status(p_type, p_id, 'published');
end;
$$;

create or replace function public.admin_community_ban(p_user uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.profiles set community_banned = p_banned where id = p_user;
  if not found then raise exception 'User not found' using errcode = 'P0002'; end if;
  perform public.admin_log(case when p_banned then 'community.ban' else 'community.unban' end, 'user', p_user::text);
end;
$$;

create or replace function public.admin_set_community_premoderation(p_value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.system_settings set community_premoderation = p_value where id = 1;
  perform public.admin_log('community.premoderation', 'settings', '1', jsonb_build_object('value', p_value));
end;
$$;

revoke execute on function
  public.community_refresh_question(uuid),
  public.community_assert_writer(text[])
  from public, anon, authenticated;
revoke execute on function
  public.community_ask(uuid, text, text, text[]),
  public.community_answer(uuid, text, text[]),
  public.community_edit(text, uuid, text, text, uuid, text[]),
  public.community_delete(text, uuid),
  public.community_toggle_helpful(text, uuid),
  public.community_set_best_answer(uuid, uuid),
  public.community_report(text, uuid, text, text),
  public.admin_community_set_status(text, uuid, text),
  public.admin_community_dismiss_reports(text, uuid),
  public.admin_community_ban(uuid, boolean),
  public.admin_set_community_premoderation(boolean)
  from public, anon;
grant execute on function
  public.community_ask(uuid, text, text, text[]),
  public.community_answer(uuid, text, text[]),
  public.community_edit(text, uuid, text, text, uuid, text[]),
  public.community_delete(text, uuid),
  public.community_toggle_helpful(text, uuid),
  public.community_set_best_answer(uuid, uuid),
  public.community_report(text, uuid, text, text),
  public.admin_community_set_status(text, uuid, text),
  public.admin_community_dismiss_reports(text, uuid),
  public.admin_community_ban(uuid, boolean),
  public.admin_set_community_premoderation(boolean)
  to authenticated;
grant execute on function public.community_authors(uuid[]), public.community_can_post() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Photos: public bucket, each member writes only in their own folder.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-images', 'community-images', true, 3145728, array['image/webp'])
on conflict (id) do nothing;

create policy "community-images: read own" on storage.objects for select to authenticated
  using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "community-images: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text
              and not coalesce((select community_banned from public.profiles where id = auth.uid()), true));
create policy "community-images: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'community-images'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin()));
