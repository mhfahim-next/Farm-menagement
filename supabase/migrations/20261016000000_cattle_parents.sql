-- =====================================================================
-- Parents of an animal: mother (another animal on the farm) and father
-- (free text: bull name, tag or semen straw number)
-- =====================================================================

alter table public.cattle
  add column father text;

-- The mother link must stay inside the same farm. The old single-column
-- foreign key could point at an animal of any farm.
alter table public.cattle
  drop constraint cattle_mother_id_fkey;

alter table public.cattle
  add constraint cattle_mother_fkey
  foreign key (mother_id, farm_id) references public.cattle (id, farm_id)
  on delete set null (mother_id);

-- A mother must be a female animal and can't be the animal itself.
create or replace function public.check_cattle_mother()
returns trigger
language plpgsql
as $$
begin
  if new.mother_id is not null then
    if new.mother_id = new.id then
      raise exception 'An animal cannot be its own mother.' using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.cattle m
      where m.id = new.mother_id and m.farm_id = new.farm_id and m.sex = 'female'
    ) then
      raise exception 'The mother must be a female animal on this farm.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger cattle_check_mother
  before insert or update of mother_id on public.cattle
  for each row execute function public.check_cattle_mother();
