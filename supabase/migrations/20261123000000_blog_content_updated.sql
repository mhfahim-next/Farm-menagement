-- A real "last modified" date for blog articles (dateModified in the article's
-- structured data and article:modified_time). updated_at changes on every row
-- update (publishing, bulk scripts), so many articles shared one timestamp.
-- content_updated_at changes only when the article itself changes.

alter table public.blog_posts add column content_updated_at timestamptz;

-- Backfill: a timestamp shared by 3 or more articles is a bulk update, not an
-- edit, so those articles count as unchanged since they were published.
update public.blog_posts p
   set content_updated_at = case
     when (select count(*) from public.blog_posts q where q.updated_at = p.updated_at) >= 3 then coalesce(p.published_at, p.created_at)
     else greatest(p.updated_at, coalesce(p.published_at, p.created_at))
   end;

create or replace function public.blog_touch_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.content_updated_at := coalesce(new.published_at, now());
  elsif (new.title_en, new.title_bn, new.summary_en, new.summary_bn, new.body_en, new.body_bn, new.cover_image_id, new.category_id)
        is distinct from (old.title_en, old.title_bn, old.summary_en, old.summary_bn, old.body_en, old.body_bn, old.cover_image_id, old.category_id) then
    new.content_updated_at := now();
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;

create trigger blog_touch_content before insert or update on public.blog_posts
  for each row execute function public.blog_touch_content();
