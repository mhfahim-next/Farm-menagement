-- =====================================================================
-- Health schedules (vaccines, parasite control) and heat / AI tracking
-- =====================================================================

-- ---------------------------------------------------------------------
-- health_records: what was given, and when it is due again
-- ---------------------------------------------------------------------
alter table public.health_records
  drop constraint health_records_record_type_check;

alter table public.health_records
  add constraint health_records_record_type_check
  check (record_type in (
    'vaccination', 'deworming', 'parasite_control', 'treatment', 'checkup'
  ));

alter table public.health_records
  add column product       text,   -- vaccine / drug / pesticide name, e.g. "FMD", "Ivermectin"
  add column dose          text,
  add column batch_number  text,
  add column interval_days integer check (interval_days > 0),
  add column next_due_date date;

-- Fast lookup of what is overdue or coming up for a farm.
create index health_records_due_idx
  on public.health_records (farm_id, next_due_date)
  where next_due_date is not null;

-- ---------------------------------------------------------------------
-- breeding_events: heat signs, technician and cost
-- ---------------------------------------------------------------------
alter table public.breeding_events
  add column heat_signs text,
  add column technician text,
  add column cost       numeric(12, 2) check (cost >= 0);

-- Pregnancy checks must say what was found. NOT VALID: applies to new rows
-- only, so rows saved before this migration can't block it.
alter table public.breeding_events
  add constraint breeding_pregnancy_result_check
  check (
    event_type <> 'pregnancy_check'
    or result in ('positive', 'negative', 'uncertain')
  ) not valid;

create index breeding_events_farm_date_idx
  on public.breeding_events (farm_id, event_date desc);
