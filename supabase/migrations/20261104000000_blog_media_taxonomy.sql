-- =====================================================================
-- Blog: image library (alt text, renameable files), categories and tags,
-- cover images. All writes go through admin_* functions.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Image library
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public bucket: anyone can view by URL. Only super admins may list/upload/move/delete.
create policy "blog-images: admins read" on storage.objects
  for select to authenticated
  using (bucket_id = 'blog-images' and public.is_super_admin());
create policy "blog-images: admins upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-images' and public.is_super_admin());
create policy "blog-images: admins update" on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-images' and public.is_super_admin());
create policy "blog-images: admins delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_super_admin());

create table public.blog_images (
  id          uuid primary key default gen_random_uuid(),
  -- Path inside the blog-images bucket; the file name is what search engines see.
  path        text not null unique
              check (path ~ '^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|png|webp)$' and char_length(path) <= 120),
  alt_en      text check (alt_en is null or char_length(alt_en) <= 250),
  alt_bn      text check (alt_bn is null or char_length(alt_bn) <= 250),
  caption_en  text check (caption_en is null or char_length(caption_en) <= 300),
  caption_bn  text check (caption_bn is null or char_length(caption_bn) <= 300),
  width       int check (width is null or width between 1 and 10000),
  height      int check (height is null or height between 1 and 10000),
  size_bytes  int check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger set_updated_at before update on public.blog_images
  for each row execute function public.set_updated_at();

alter table public.blog_images enable row level security;
-- Alt text and sizes are needed to render public articles.
create policy "blog_images: read" on public.blog_images for select to anon, authenticated using (true);
revoke all on public.blog_images from anon, authenticated;
grant select on public.blog_images to anon, authenticated;

-- ---------------------------------------------------------------------
-- Categories and tags
-- ---------------------------------------------------------------------
create table public.blog_categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name_en        text not null check (char_length(trim(name_en)) between 1 and 60),
  name_bn        text not null check (char_length(trim(name_bn)) between 1 and 60),
  description_en text check (description_en is null or char_length(description_en) <= 300),
  description_bn text check (description_bn is null or char_length(description_bn) <= 300),
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create table public.blog_tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique
             check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name_en    text not null check (char_length(trim(name_en)) between 1 and 40),
  name_bn    text not null check (char_length(trim(name_bn)) between 1 and 40),
  created_at timestamptz not null default now()
);

alter table public.blog_posts
  add column category_id    uuid references public.blog_categories (id) on delete set null,
  add column cover_image_id uuid references public.blog_images (id) on delete set null;
create index blog_posts_category_idx on public.blog_posts (category_id);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id  uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index blog_post_tags_tag_idx on public.blog_post_tags (tag_id);

alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_post_tags enable row level security;
create policy "blog_categories: read" on public.blog_categories for select to anon, authenticated using (true);
create policy "blog_tags: read" on public.blog_tags for select to anon, authenticated using (true);
-- A tag link is visible when its post is (published, or the reader is a super admin).
create policy "blog_post_tags: read" on public.blog_post_tags for select to anon, authenticated
  using (exists (select 1 from public.blog_posts p where p.id = post_id));
revoke all on public.blog_categories, public.blog_tags, public.blog_post_tags from anon, authenticated;
grant select on public.blog_categories, public.blog_tags, public.blog_post_tags to anon, authenticated;

-- ---------------------------------------------------------------------
-- Admin functions: images
-- ---------------------------------------------------------------------
create or replace function public.admin_save_blog_image(
  p_id uuid, p_path text,
  p_alt_en text, p_alt_bn text, p_caption_en text, p_caption_bn text,
  p_width int, p_height int, p_size_bytes int
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
    insert into public.blog_images (path, alt_en, alt_bn, caption_en, caption_bn, width, height, size_bytes, uploaded_by)
    values (p_path, nullif(trim(p_alt_en), ''), nullif(trim(p_alt_bn), ''),
            nullif(trim(p_caption_en), ''), nullif(trim(p_caption_bn), ''),
            p_width, p_height, p_size_bytes, auth.uid())
    returning id into v_id;
    perform public.admin_log('blog.image.upload', 'blog_image', v_id::text, jsonb_build_object('path', p_path));
  else
    update public.blog_images set
      alt_en = nullif(trim(p_alt_en), ''), alt_bn = nullif(trim(p_alt_bn), ''),
      caption_en = nullif(trim(p_caption_en), ''), caption_bn = nullif(trim(p_caption_bn), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Image not found' using errcode = 'P0002'; end if;
  end if;
  return v_id;
end;
$$;

-- Called after the file was moved in storage: points the row and every
-- article that embeds the old URL at the new file name.
create or replace function public.admin_rename_blog_image(p_id uuid, p_new_path text, p_old_url text, p_new_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
begin
  perform public.admin_assert();
  select path into v_old from public.blog_images where id = p_id;
  if v_old is null then raise exception 'Image not found' using errcode = 'P0002'; end if;
  update public.blog_images set path = p_new_path where id = p_id;
  if coalesce(p_old_url, '') <> '' then
    update public.blog_posts set
      body_en = replace(body_en, p_old_url, p_new_url),
      body_bn = replace(body_bn, p_old_url, p_new_url)
    where body_en like '%' || p_old_url || '%' or body_bn like '%' || p_old_url || '%';
  end if;
  perform public.admin_log('blog.image.rename', 'blog_image', p_id::text,
    jsonb_build_object('from', v_old, 'to', p_new_path));
end;
$$;

create or replace function public.admin_delete_blog_image(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text;
begin
  perform public.admin_assert();
  delete from public.blog_images where id = p_id returning path into v_path;
  if v_path is null then raise exception 'Image not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.image.delete', 'blog_image', p_id::text, jsonb_build_object('path', v_path));
  return v_path;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin functions: categories and tags
-- ---------------------------------------------------------------------
create or replace function public.admin_save_blog_category(
  p_id uuid, p_slug text, p_name_en text, p_name_bn text,
  p_description_en text, p_description_bn text, p_sort_order int
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
    insert into public.blog_categories (slug, name_en, name_bn, description_en, description_bn, sort_order)
    values (lower(trim(p_slug)), trim(p_name_en), trim(p_name_bn),
            nullif(trim(p_description_en), ''), nullif(trim(p_description_bn), ''), coalesce(p_sort_order, 0))
    returning id into v_id;
  else
    update public.blog_categories set
      slug = lower(trim(p_slug)), name_en = trim(p_name_en), name_bn = trim(p_name_bn),
      description_en = nullif(trim(p_description_en), ''), description_bn = nullif(trim(p_description_bn), ''),
      sort_order = coalesce(p_sort_order, 0)
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Category not found' using errcode = 'P0002'; end if;
  end if;
  perform public.admin_log('blog.category.save', 'blog_category', v_id::text, jsonb_build_object('slug', lower(trim(p_slug))));
  return v_id;
end;
$$;

create or replace function public.admin_delete_blog_category(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.blog_categories where id = p_id;
  if not found then raise exception 'Category not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.category.delete', 'blog_category', p_id::text);
end;
$$;

create or replace function public.admin_save_blog_tag(p_id uuid, p_slug text, p_name_en text, p_name_bn text)
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
    insert into public.blog_tags (slug, name_en, name_bn)
    values (lower(trim(p_slug)), trim(p_name_en), trim(p_name_bn))
    on conflict (slug) do update set slug = excluded.slug -- reuse an existing tag
    returning id into v_id;
  else
    update public.blog_tags set slug = lower(trim(p_slug)), name_en = trim(p_name_en), name_bn = trim(p_name_bn)
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Tag not found' using errcode = 'P0002'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_delete_blog_tag(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  delete from public.blog_tags where id = p_id;
  if not found then raise exception 'Tag not found' using errcode = 'P0002'; end if;
  perform public.admin_log('blog.tag.delete', 'blog_tag', p_id::text);
end;
$$;

-- ---------------------------------------------------------------------
-- Saving a post now also sets its category, cover and tags
-- ---------------------------------------------------------------------
drop function public.admin_save_blog_post(uuid, text, text, text, text, text, text, text, boolean);

create or replace function public.admin_save_blog_post(
  p_id uuid, p_slug text,
  p_title_en text, p_title_bn text,
  p_summary_en text, p_summary_bn text,
  p_body_en text, p_body_bn text,
  p_published boolean,
  p_category_id uuid default null,
  p_cover_image_id uuid default null,
  p_tag_ids uuid[] default '{}'
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
  if coalesce(array_length(p_tag_ids, 1), 0) > 15 then
    raise exception 'An article can have at most 15 tags.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.blog_posts (
      slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn,
      published, published_at, author_id, category_id, cover_image_id
    ) values (
      lower(trim(p_slug)), nullif(trim(p_title_en), ''), nullif(trim(p_title_bn), ''),
      nullif(trim(p_summary_en), ''), nullif(trim(p_summary_bn), ''),
      nullif(trim(p_body_en), ''), nullif(trim(p_body_bn), ''),
      coalesce(p_published, false),
      case when coalesce(p_published, false) then now() end,
      auth.uid(), p_category_id, p_cover_image_id
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
        else published_at end,
      category_id = p_category_id,
      cover_image_id = p_cover_image_id
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Post not found' using errcode = 'P0002'; end if;
    perform public.admin_log('blog.update', 'blog_post', v_id::text,
      jsonb_build_object('slug', lower(trim(p_slug)), 'published', coalesce(p_published, false)));
  end if;

  delete from public.blog_post_tags where post_id = v_id and not (tag_id = any (coalesce(p_tag_ids, '{}')));
  insert into public.blog_post_tags (post_id, tag_id)
  select v_id, t from unnest(coalesce(p_tag_ids, '{}')) as t
  on conflict do nothing;
  return v_id;
end;
$$;

create or replace function public.admin_set_blog_published(p_id uuid, p_published boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.blog_posts set
    published = p_published,
    published_at = case when p_published then coalesce(published_at, now()) else published_at end
  where id = p_id;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
  perform public.admin_log(case when p_published then 'blog.publish' else 'blog.unpublish' end, 'blog_post', p_id::text);
end;
$$;

revoke execute on function
  public.admin_save_blog_post(uuid, text, text, text, text, text, text, text, boolean, uuid, uuid, uuid[]),
  public.admin_set_blog_published(uuid, boolean),
  public.admin_save_blog_image(uuid, text, text, text, text, text, int, int, int),
  public.admin_rename_blog_image(uuid, text, text, text),
  public.admin_delete_blog_image(uuid),
  public.admin_save_blog_category(uuid, text, text, text, text, text, int),
  public.admin_delete_blog_category(uuid),
  public.admin_save_blog_tag(uuid, text, text, text),
  public.admin_delete_blog_tag(uuid)
  from public, anon;
grant execute on function
  public.admin_save_blog_post(uuid, text, text, text, text, text, text, text, boolean, uuid, uuid, uuid[]),
  public.admin_set_blog_published(uuid, boolean),
  public.admin_save_blog_image(uuid, text, text, text, text, text, int, int, int),
  public.admin_rename_blog_image(uuid, text, text, text),
  public.admin_delete_blog_image(uuid),
  public.admin_save_blog_category(uuid, text, text, text, text, text, int),
  public.admin_delete_blog_category(uuid),
  public.admin_save_blog_tag(uuid, text, text, text),
  public.admin_delete_blog_tag(uuid)
  to authenticated;

-- ---------------------------------------------------------------------
-- Starter categories and tags
-- ---------------------------------------------------------------------
insert into public.blog_categories (slug, name_en, name_bn, description_en, description_bn, sort_order) values
  ('cattle-health', 'Cattle health', 'গরুর স্বাস্থ্য', 'Vaccines, disease prevention and first aid for cows and calves.', 'গরু ও বাছুরের টিকা, রোগ প্রতিরোধ ও প্রাথমিক চিকিৎসা।', 1),
  ('breeding', 'Breeding', 'প্রজনন', 'Heat detection, artificial insemination, pregnancy and calving.', 'গরম চেনা, কৃত্রিম প্রজনন, গর্ভধারণ ও বাছুর প্রসব।', 2),
  ('feed-nutrition', 'Feed & nutrition', 'খাদ্য ও পুষ্টি', 'Rations, fodder and fattening plans that pay.', 'লাভজনক খাদ্য তালিকা, ঘাস ও মোটাতাজাকরণ।', 3),
  ('poultry', 'Layer poultry', 'লেয়ার মুরগি', 'Egg production, flock health and layer management.', 'ডিম উৎপাদন, মুরগির স্বাস্থ্য ও লেয়ার ব্যবস্থাপনা।', 4),
  ('farm-business', 'Farm business', 'খামার ব্যবসা', 'Costs, profit and record keeping for a farm that makes money.', 'খরচ, লাভ ও হিসাব রেখে লাভজনক খামার।', 5);

insert into public.blog_tags (slug, name_en, name_bn) values
  ('vaccination', 'Vaccination', 'টিকা'),
  ('fmd', 'FMD', 'ক্ষুরা রোগ'),
  ('lumpy-skin', 'Lumpy skin', 'লাম্পি স্কিন'),
  ('heat-detection', 'Heat detection', 'গরম চেনা'),
  ('artificial-insemination', 'Artificial insemination', 'কৃত্রিম প্রজনন'),
  ('cattle-weight', 'Cattle weight', 'গরুর ওজন'),
  ('fattening', 'Fattening', 'মোটাতাজাকরণ'),
  ('qurbani', 'Qurbani', 'কোরবানি'),
  ('egg-production', 'Egg production', 'ডিম উৎপাদন'),
  ('layer-feed', 'Layer feed', 'লেয়ার খাদ্য'),
  ('milk-cost', 'Milk cost', 'দুধের খরচ'),
  ('farm-records', 'Farm records', 'খামারের রেকর্ড'),
  ('profit', 'Profit', 'লাভ'),
  ('calf-care', 'Calf care', 'বাছুরের যত্ন'),
  ('ear-tags', 'Ear tags', 'কানের ট্যাগ');

update public.blog_posts
set category_id = (select id from public.blog_categories where slug = 'farm-business')
where slug = 'how-to-organise-cattle-tag-numbers';
insert into public.blog_post_tags (post_id, tag_id)
select p.id, t.id from public.blog_posts p, public.blog_tags t
where p.slug = 'how-to-organise-cattle-tag-numbers' and t.slug in ('ear-tags', 'farm-records', 'calf-care');
