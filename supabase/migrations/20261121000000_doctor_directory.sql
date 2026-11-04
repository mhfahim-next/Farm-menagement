-- Find a vet: a list of verified doctors that farm owners and managers can
-- search by district, and invite to their farm in one tap.
--
-- * Doctors add their district and area. They choose whether they appear in
--   the list (on by default) and whether their phone number is shown (off by
--   default). Their email is never shown: "Invite" sends the usual farm
--   invitation to it on the server.
-- * Only signed-in farm members can search the list, through find_doctors().

alter table public.profiles
  add column doctor_district   text check (doctor_district is null or doctor_district ~ '^[a-z_]{3,30}$'),
  add column doctor_area       text check (doctor_area is null or char_length(doctor_area) <= 80),
  add column doctor_listed     boolean not null default true,
  add column doctor_show_phone boolean not null default false;

grant update (doctor_district, doctor_area, doctor_listed, doctor_show_phone) on public.profiles to authenticated;

-- Verified, listed doctors, the given district first (or only it), then by name.
-- The phone number only when the doctor chose to show it.
create or replace function public.find_doctors(p_district text default null, p_search text default null, p_only_district boolean default false, p_limit integer default 50)
returns table (id uuid, full_name text, avatar_url text, specialty text, district text, area text, phone text, farms_served bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated' using errcode = '42501'; end if;
  -- Farm members only (not other doctors browsing each other).
  if not exists (select 1 from public.farm_members m where m.user_id = auth.uid() and m.role <> 'vet') then
    raise exception 'Only farm members can search for doctors.' using errcode = '42501';
  end if;
  return query
    select p.id, p.full_name, p.avatar_url, p.doctor_specialty, p.doctor_district, p.doctor_area,
           case when p.doctor_show_phone then p.phone end,
           (select count(*) from public.farm_members m where m.user_id = p.id and m.role = 'vet')
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.account_type = 'doctor'
       and p.doctor_verified
       and p.doctor_listed
       and (u.banned_until is null or u.banned_until <= now())
       and (not p_only_district or p_district is null or p.doctor_district = p_district)
       and (v_search is null
            or p.full_name ilike '%' || v_search || '%'
            or p.doctor_area ilike '%' || v_search || '%'
            or p.doctor_specialty ilike '%' || v_search || '%')
     order by (p.doctor_district is not distinct from p_district) desc, p.full_name nulls last
     limit greatest(least(coalesce(p_limit, 50), 100), 1);
end;
$$;
revoke execute on function public.find_doctors(text, text, boolean, integer) from public, anon;
grant execute on function public.find_doctors(text, text, boolean, integer) to authenticated;

-- Invite a listed doctor to the farm as its vet, without the inviter seeing the
-- doctor's email. Owners and managers only; at most 20 open vet invitations a
-- farm, so the list can't be used to spam doctors.
create or replace function public.invite_listed_doctor(p_farm uuid, p_doctor uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if not public.has_farm_role(p_farm, array['owner', 'manager']) then
    raise exception 'Only the owner or a manager can invite.' using errcode = '42501';
  end if;
  select lower(u.email) into v_email
    from public.profiles p join auth.users u on u.id = p.id
   where p.id = p_doctor and p.account_type = 'doctor' and p.doctor_verified and p.doctor_listed
     and (u.banned_until is null or u.banned_until <= now());
  if v_email is null then raise exception 'DOCTOR_NOT_FOUND' using errcode = 'P0002'; end if;
  if exists (select 1 from public.farm_members m where m.farm_id = p_farm and m.user_id = p_doctor) then
    return 'member';
  end if;
  if exists (select 1 from public.farm_invites i where i.farm_id = p_farm and i.email = v_email and i.status = 'pending') then
    return 'pending';
  end if;
  if (select count(*) from public.farm_invites i where i.farm_id = p_farm and i.status = 'pending' and i.role = 'vet') >= 20 then
    raise exception 'TOO_MANY_INVITES' using errcode = '23514';
  end if;
  insert into public.farm_invites (farm_id, email, role) values (p_farm, v_email, 'vet');
  return 'invited';
end;
$$;
revoke execute on function public.invite_listed_doctor(uuid, uuid) from public, anon;
grant execute on function public.invite_listed_doctor(uuid, uuid) to authenticated;

-- Privacy policy: say what the doctor list shows (only the wording shipped with
-- 20261118000000_privacy_app.sql is replaced; an edited policy is left alone).
update public.site_pages set
  body_en = replace(body_en,
    '- People you add to your farm, according to their role. Doctors cannot see finances.',
    '- People you add to your farm, according to their role. Doctors cannot see finances.
- Verified doctors who choose to appear in "Find a vet": their name, photo, specialty, district and area are shown to signed-in farmers, and their phone number only if they turn that on. Their email is never shown. Doctors can leave the list at any time in their profile.'),
  body_bn = replace(body_bn,
    '- আপনি খামারে যাদের যোগ করেন, তাদের ভূমিকা অনুযায়ী। ডাক্তাররা আয়-ব্যয় দেখতে পান না।',
    '- আপনি খামারে যাদের যোগ করেন, তাদের ভূমিকা অনুযায়ী। ডাক্তাররা আয়-ব্যয় দেখতে পান না।
- যাচাই করা যেসব ডাক্তার "ডাক্তার খুঁজুন" তালিকায় থাকতে চান: তাঁদের নাম, ছবি, বিশেষজ্ঞতা, জেলা ও এলাকা লগইন করা খামারিরা দেখতে পান, আর ফোন নম্বর শুধু তাঁরা চালু করলে। ইমেইল কখনো দেখানো হয় না। ডাক্তার প্রোফাইল থেকে যেকোনো সময় তালিকা থেকে সরে যেতে পারেন।')
where slug = 'privacy';
