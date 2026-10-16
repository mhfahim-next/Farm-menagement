-- =====================================================================
-- Vets (doctors) no longer write health / breeding records directly.
-- They submit an entry; the farm owner or a manager approves it first.
-- =====================================================================
create table public.pending_entries (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  submitted_by  uuid default auth.uid() references auth.users (id) on delete set null,
  kind          text not null check (kind in (
                  'record_health', 'update_health', 'renew_health', 'log_breeding', 'update_breeding')),
  -- the submitted form fields as [[name, value], ...]
  payload       jsonb not null check (jsonb_typeof(payload) = 'array' and pg_column_size(payload) < 30000),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note          text check (note is null or char_length(note) <= 500),
  resolved_by   uuid references auth.users (id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index pending_entries_farm_idx on public.pending_entries (farm_id, status, created_at desc);

-- A vet can have at most 100 entries waiting on one farm.
create or replace function public.limit_pending_entries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.pending_entries
       where farm_id = new.farm_id and submitted_by = new.submitted_by and status = 'pending') >= 100 then
    raise exception 'Too many entries are waiting for approval. Wait for the farm owner to review them.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger pending_entries_limit before insert on public.pending_entries
  for each row execute function public.limit_pending_entries();

alter table public.pending_entries enable row level security;

create policy "pending: managers read, vets read own" on public.pending_entries
  for select to authenticated
  using (public.has_farm_role(farm_id, array['owner', 'manager']) or submitted_by = auth.uid());

create policy "pending: vets submit" on public.pending_entries
  for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending'
              and public.has_farm_role(farm_id, array['vet']));

create policy "pending: vets cancel own waiting" on public.pending_entries
  for delete to authenticated
  using (submitted_by = auth.uid() and status = 'pending');

revoke all on public.pending_entries from anon, authenticated;
grant select, delete on public.pending_entries to authenticated;
grant insert (farm_id, kind, payload) on public.pending_entries to authenticated;

-- Owner / manager decisions. Status changes only happen through these.
create or replace function public.claim_pending_entry(p_id uuid)
returns public.pending_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pending_entries;
begin
  select * into v from public.pending_entries where id = p_id;
  if not found or auth.uid() is null or not public.has_farm_role(v.farm_id, array['owner', 'manager']) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.pending_entries
     set status = 'approved', resolved_by = auth.uid(), resolved_at = now()
   where id = p_id and status = 'pending'
   returning * into v;
  if not found then raise exception 'ALREADY_HANDLED' using errcode = 'P0002'; end if;
  return v;
end;
$$;

-- Puts an entry back in the queue when saving it failed right after the claim.
create or replace function public.release_pending_entry(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pending_entries
     set status = 'pending', resolved_by = null, resolved_at = null
   where id = p_id and status = 'approved' and resolved_by = auth.uid()
     and resolved_at > now() - interval '5 minutes'
     and public.has_farm_role(farm_id, array['owner', 'manager']);
end;
$$;

create or replace function public.reject_pending_entry(p_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_farm uuid;
begin
  select farm_id into v_farm from public.pending_entries where id = p_id;
  if v_farm is null or auth.uid() is null or not public.has_farm_role(v_farm, array['owner', 'manager']) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.pending_entries
     set status = 'rejected', note = nullif(trim(p_note), ''), resolved_by = auth.uid(), resolved_at = now()
   where id = p_id and status = 'pending';
  if not found then raise exception 'ALREADY_HANDLED' using errcode = 'P0002'; end if;
end;
$$;

revoke execute on function
  public.claim_pending_entry(uuid), public.release_pending_entry(uuid), public.reject_pending_entry(uuid, text)
  from public, anon;
grant execute on function
  public.claim_pending_entry(uuid), public.release_pending_entry(uuid), public.reject_pending_entry(uuid, text)
  to authenticated;

-- Health and breeding records: only owner / manager / worker write directly.
do $$
declare
  t text;
  w text := 'public.has_farm_role(farm_id, array[''owner'', ''manager'', ''worker''])';
begin
  foreach t in array array['health_records', 'breeding_events'] loop
    execute format('drop policy %I on public.%I', t || ': writers insert', t);
    execute format('drop policy %I on public.%I', t || ': writers update', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', t || ': writers insert', t, w);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', t || ': writers update', t, w, w);
  end loop;
end;
$$;
