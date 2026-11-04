-- The "founder" label on reviews is not used after all: drop the column that
-- 20261125000000_seo_reaudit.sql added (safe whether or not that ran).
alter table public.reviews drop column if exists is_founder;
