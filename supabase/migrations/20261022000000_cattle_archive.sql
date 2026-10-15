-- =====================================================================
-- Archive an animal: hidden from lists and pickers, kept with all its
-- records, does not count toward the plan limit, and can be restored.
-- =====================================================================
alter table public.cattle drop constraint cattle_status_check;
alter table public.cattle
  add constraint cattle_status_check
  check (status in ('active', 'sold', 'dead', 'archived'));

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order, can_hide, meta)
values ('cattle_status', 'archived', 'Archived', 'আর্কাইভ', 40, false, '{}')
on conflict do nothing;
