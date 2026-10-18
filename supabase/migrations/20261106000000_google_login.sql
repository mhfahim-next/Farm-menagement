-- =====================================================================
-- Sign in with Google: new profiles take the name and photo Google sends
-- (Google uses "name"/"picture"; Supabase also copies them to
-- "full_name"/"avatar_url"). Email sign-ups behave exactly as before.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doctor boolean := (new.raw_user_meta_data ->> 'account_type') = 'doctor';
  v_avatar text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  insert into public.profiles (id, full_name, phone, avatar_url, account_type, doctor_reg_no, doctor_specialty)
  values (
    new.id,
    left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), ''), 120),
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', '')),
    -- Only https photo links (Google's) are kept.
    case when v_avatar ~ '^https://[^\s]+$' and char_length(v_avatar) <= 500 then v_avatar end,
    case when v_doctor then 'doctor' else 'farmer' end,
    case when v_doctor then nullif(left(trim(new.raw_user_meta_data ->> 'doctor_reg_no'), 60), '') end,
    case when v_doctor then nullif(left(trim(new.raw_user_meta_data ->> 'doctor_specialty'), 60), '') end
  );
  return new;
end;
$$;
