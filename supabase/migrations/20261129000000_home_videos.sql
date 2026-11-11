-- Demo videos on the home page (YouTube), one per farm kind, managed in
-- Admin → Site. A video shows only when it has a YouTube video id and is on.

create table public.home_videos (
  slug text primary key check (slug ~ '^[a-z][a-z0-9-]{1,30}$'),
  label_en text not null check (length(label_en) between 1 and 40),
  label_bn text not null check (length(label_bn) between 1 and 40),
  title_en text not null check (length(title_en) between 1 and 120),
  title_bn text not null check (length(title_bn) between 1 and 120),
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.home_videos enable row level security;
create policy "home videos: ready ones are public" on public.home_videos
  for select to anon, authenticated using (active and youtube_id is not null);
create policy "home videos: super admin reads all" on public.home_videos
  for select to authenticated using (public.is_super_admin());
grant select on public.home_videos to anon, authenticated;

create or replace function public.admin_save_home_video(
  p_slug text, p_label_en text, p_label_bn text, p_title_en text, p_title_bn text, p_youtube_id text, p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_assert();
  update public.home_videos
     set label_en = trim(p_label_en),
         label_bn = trim(p_label_bn),
         title_en = trim(p_title_en),
         title_bn = trim(p_title_bn),
         youtube_id = nullif(trim(p_youtube_id), ''),
         active = coalesce(p_active, true),
         updated_at = now()
   where slug = p_slug;
  if not found then
    raise exception 'Video not found.' using errcode = 'P0002';
  end if;
  perform public.admin_log('home_video.save', 'home_video', p_slug);
end;
$$;
revoke execute on function public.admin_save_home_video(text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.admin_save_home_video(text, text, text, text, text, text, boolean) to authenticated;

-- The three demo videos; the links are added in admin after uploading to YouTube.
insert into public.home_videos (slug, label_en, label_bn, title_en, title_bn, sort_order) values
  ('cattle', 'Dairy & cattle', 'গরু ও দুধ', 'How a dairy farm keeps its records in FarmFlows', 'গরু আর দুধের খামারে FarmFlows যেভাবে কাজ করে', 1),
  ('goat', 'Goats', 'ছাগল', 'How a goat farm keeps its records in FarmFlows', 'ছাগলের খামারে FarmFlows যেভাবে কাজ করে', 2),
  ('poultry', 'Poultry', 'মুরগি', 'How a poultry farm keeps its records in FarmFlows', 'মুরগির খামারে FarmFlows যেভাবে কাজ করে', 3);
