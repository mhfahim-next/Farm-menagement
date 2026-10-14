# FarmFlow — Cattle, Dairy & Layer Farm Management (SaaS)

A multi-tenant farm management web app built with **Next.js 16 (App Router)** and **Supabase**.

| Overview (Bangla, dark) | Avatar menu, language & theme | Super admin: farms |
| --- | --- | --- |
| ![Overview in Bangla, dark mode](docs/screenshots/overview-bn-dark.png) | ![Menu](docs/screenshots/menu.png) | ![Admin farms](docs/screenshots/admin-farms.png) |

| Health & reminders | Breeding & heat |
| --- | --- |
| ![Health](docs/screenshots/health.png) | ![Breeding](docs/screenshots/breeding.png) |

## Features

- **Accounts & farms**: email sign-up/login, farm onboarding, one owner per farm, and a team roles model (owner / manager / worker / vet).
- **Cattle register**: tag, name, breed, category, age, status, purchase info, search and filter. Record each animal's **mother** (dropdown of the farm's females, shown with their type, or "Unknown") and **father** (free text); the animal page shows a *Family* card with parents and calves.
- **Milk**: a milking sheet that records every cow for one session at once (morning/evening), with fat %, daily totals, and per-cow history.
- **Health** (`/dashboard/health`): vaccines, pest/parasite control (tick & fly spray, pour-on), deworming and treatments.
  - Record for **one animal or the whole herd at once**, with quick-pick presets (FMD, HS, BQ, Anthrax, LSD, Rabies, Brucellosis, deworming, tick spray) that fill in the usual repeat interval.
  - Every product gets a **next due date**. The *Due & overdue* board lists what is late or due in 30 days, and **Done today** repeats it and schedules the next one.
  - Dose, batch number, who gave it, cost, and **milk withdrawal period** warnings.
- **Breeding** (`/dashboard/breeding`): heat tracking, artificial insemination, pregnancy checks, calving, dry-off.
  - Heat is recorded with the signs seen; the **next heat is predicted** (21-day cycle) and flagged ±3 days around it.
  - AI records bull/semen, technician and cost; expected calving is set at **283 days**; a **pregnancy check is due ~45 days** after AI, and **return-to-heat** is watched at day 21.
  - Each cow shows as **Open / Inseminated / Pregnant**, with dry-off date (60 days before calving) and cows **not yet served 60+ days after calving** flagged.
  - Recording a calving can **register the calf** in the herd (linked to its mother) and promotes a heifer to cow.
- **Reminders**: the Overview page shows everything overdue or coming up in one *Needs attention* list.
- **Bangla & English**: every page, form, message, date and number (Bangla digits and month names) is translated. Switch language from the top bar; the choice is remembered, and first-time visitors get Bangla if their browser prefers it.
- **Dark & light mode**: toggle in the top bar, remembered per device, no flash on load.
- **Top bar & avatar menu**: language and theme toggles beside the profile picture; the avatar opens *Dashboard / Profile / Admin panel (super admins) / Log out*.
- **Profile** (`/dashboard/profile`): upload a profile photo (cropped to a square, stored in Supabase Storage), edit name and phone, change password.
- **Super admin panel** (`/admin`, see below).
- **Layer flocks**: batches with breed, shed and age. Daily logs cover eggs, broken eggs, deaths, culls, feed and water.
  KPIs: live birds, **hen-day production %**, mortality %, feed per dozen eggs, grams of feed per bird.
- **Finance**: income and expenses by category and module (dairy / layer / general), with monthly profit.
- **Overview dashboard**: today's milk and eggs, herd and flock size, this month's P&L, and 7-day charts.

## Super admin

A super admin controls the whole system from `/admin` (only they can open it; everyone else gets a 404):

| Page | What you can do |
| --- | --- |
| Overview | Users, farms, active cattle/flocks, 30-day milk and eggs, farms per plan |
| Users | Search; **suspend / restore** (signs them out immediately), **make / remove super admin**, delete |
| Farms | Search; change **plan**, **suspend / restore** a farm (its members are locked out), delete a farm and all its data; open a farm's summary |
| Audit log | Every admin action: who, what, when |
| Announcement | A banner shown at the top of every user's dashboard, with separate English and Bangla text |

**Create your first super admin** (a normal user must sign up first), in the Supabase SQL editor:

```sql
select public.grant_super_admin('you@example.com');
```

After that, make more admins from *Admin → Users*. Safety rules enforced in the database, not just the UI:

- Users can never promote themselves or change their own plan / suspension — those columns are not writable by normal users.
- Every `admin_*` function re-checks `is_super_admin()`; an admin cannot suspend, delete or demote their own account.
- A user who owns farms can't be deleted until the farms are removed; every admin action is written to the audit log.

## Architecture

```
Next.js (web)  ─┐
                ├──►  Supabase  (Postgres + RLS, Auth, Storage)
Mobile app     ─┘     (later: same database, same rules)
```

- **Security lives in the database.** Every table has a `farm_id`, and Postgres
  **Row Level Security** only lets users touch rows of farms they are a
  member of. A future mobile app (React Native / Expo or Flutter) can use
  the Supabase client directly and gets the same protection, with no extra backend.
- Composite foreign keys (`(cattle_id, farm_id)`, `(flock_id, farm_id)`) make it
  impossible to attach a record to another farm's animal.
- `create_farm()` RPC creates a farm and its owner membership atomically.
- `flock_stats` view (security-invoker) computes live bird counts.
- All tables use UUIDs plus `created_at` / `updated_at` (and `deleted_at` where relevant),
  ready for offline sync in the mobile app.

```
supabase/migrations/   SQL schema, RLS policies, functions, admin_* functions, storage bucket
src/proxy.ts           refreshes the Supabase session, protects /dashboard
src/lib/supabase/      browser / server / proxy clients
src/lib/auth.ts        requireUser() / requireFarm() data access layer
src/app/(auth)/        login & signup
src/app/onboarding/    create the first farm
src/app/dashboard/     overview, cattle, milk, health, breeding, flocks, finance, settings, profile
src/app/admin/         super admin panel
src/lib/i18n/          English + Bangla dictionaries (typed: a missing Bangla key fails the build)
```

## Getting started

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2a. Use a hosted Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration: either paste `supabase/migrations/*.sql` into the SQL editor, or
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. Put the project URL and publishable (anon) key into `.env.local`.
4. In **Authentication → URL Configuration**, set the Site URL and add
   `https://your-domain/auth/confirm` to the redirect URLs.

### 2b. Or run Supabase locally (requires Docker)

```bash
npm run db:start      # prints the API URL and publishable key for .env.local
```

Profile photos use Supabase Storage, which `db:start` includes. If you start Supabase with
services excluded (`-x`), keep `storage-api` running.

### 3. Run

```bash
npm run dev           # http://localhost:3000
```

Sign up, create your farm, then add cattle and flocks.

### Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run db:start` / `db:stop` | Local Supabase |
| `npm run db:reset` | Recreate the local database from migrations |
| `npm run db:types` | Generate TypeScript types from the database |

## Deploy

- **Web:** Vercel (set the three `NEXT_PUBLIC_*` env vars).
- **Database:** Supabase cloud (`npx supabase db push`).

## Roadmap

- More languages (the dictionaries make this a one-file addition)
- Team invitations (email invite → `farm_members`)
- Subscription billing (Stripe / SSLCommerz / bKash) and plan limits
- Feed & medicine inventory, egg/milk sales to customers with invoices
- Reports & CSV/PDF export; SMS / WhatsApp / push reminders for vaccines, heats and calvings
- Mobile app (Expo + Supabase, offline-first) in a monorepo
