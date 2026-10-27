-- Animal photos, and deleting your own account (Google Play requires apps to
-- offer this; the website gets the same button).
--
-- 1. cattle.photo_path: a photo of the animal, stored in the public
--    "animal-photos" bucket at <farm id>/<file>. Owners, managers and workers
--    of that farm can add, replace and remove photos; anyone with the link can
--    see one (the paths are random, like profile photos).
-- 2. delete_my_account(): removes the signed-in person. Farms they own alone
--    are deleted with all their records. A farm with other members has to be
--    handed over or emptied first (so nobody loses a shared farm by surprise).
--    Records they entered on other people's farms stay, without their name.

alter table public.cattle add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-photos', 'animal-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- The first folder of the path is the farm; only that farm's staff may write there.
create or replace function public.can_write_animal_photo(p_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_farm_role(((storage.foldername(p_name))[1])::uuid, array['owner', 'manager', 'worker']),
    false
  );
$$;

create policy "animal-photos: staff read" on storage.objects for select to authenticated
  using (bucket_id = 'animal-photos' and public.can_write_animal_photo(name));
create policy "animal-photos: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'animal-photos' and public.can_write_animal_photo(name));
create policy "animal-photos: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'animal-photos' and public.can_write_animal_photo(name))
  with check (bucket_id = 'animal-photos' and public.can_write_animal_photo(name));
create policy "animal-photos: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'animal-photos' and public.can_write_animal_photo(name));

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  shared text;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select string_agg(f.name, ', ' order by f.name) into shared
    from public.farms f
   where f.owner_id = uid
     and exists (select 1 from public.farm_members m where m.farm_id = f.id and m.user_id <> uid);
  if shared is not null then
    raise exception 'SHARED_FARM:%', shared using errcode = 'P0001';
  end if;

  -- Farms they own alone go, with everything in them (cascades).
  delete from public.farms where owner_id = uid;

  -- Records on other farms stay, without the name of who entered them.
  update public.milk_records set created_by = null where created_by = uid;
  update public.health_records set created_by = null where created_by = uid;
  update public.breeding_events set created_by = null where created_by = uid;
  update public.flock_daily_logs set created_by = null where created_by = uid;
  update public.flock_health_records set created_by = null where created_by = uid;
  update public.transactions set created_by = null where created_by = uid;
  update public.cattle_weights set created_by = null where created_by = uid;

  -- Profile, memberships, preferences and sign-in data go with the user (cascades).
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
