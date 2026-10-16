-- Optional time of day for breeding events (heat seen, AI done, check made).
alter table public.breeding_events
  add column event_time time;
