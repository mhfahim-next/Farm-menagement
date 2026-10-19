-- =====================================================================
-- Offline entry: stock use saved on a phone without internet is sent
-- later, maybe more than once (the reply can be lost on a weak network).
-- Each such entry carries an id made on the phone; a second copy with
-- the same id is refused, so stock is never deducted twice.
-- (Milk, flock logs and attendance already overwrite by date, so a
-- repeat of those changes nothing.)
-- =====================================================================
alter table public.inventory_moves add column if not exists client_id uuid;

create unique index if not exists inventory_moves_client_id_key
  on public.inventory_moves (farm_id, client_id)
  where client_id is not null;
