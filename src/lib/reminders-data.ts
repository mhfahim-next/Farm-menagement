import "server-only";
// Reads what the reminders need from a farm's records. Works with the signed-in
// person's client (the bell, RLS applies) and with the service-role client
// (the scheduled job, which always filters by farm).
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllBreedingRules } from "@/lib/breeding-data";
import { breedingAlerts, reproStatus, type BreedingEventLite } from "@/lib/breeding";
import { getFatteningSettings } from "@/lib/fattening-data";
import { dueItems } from "@/lib/health";
import { flockDueItems } from "@/lib/flock-health";
import { farmClock, today as todayFn } from "@/lib/format";
import { breedsAnimals, fattens, keepsAnimals, keepsPoultry } from "@/lib/modules";
import { buildReminders, FATTEN_WEIGH_EVERY_DAYS, forPerson, type Reminder, type ReminderInput } from "@/lib/reminders";
import type { Farm, FlockHealthRecord, HealthRecord, Role } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;
type FarmLike = Pick<Farm, "id" | "currency" | "has_dairy" | "has_layer" | "has_goat" | "has_fattening" | "has_broiler" | "plan" | "plan_expires_at">;

const label = (a: { tag_number: string; name: string | null }) => `${a.tag_number}${a.name ? ` · ${a.name}` : ""}`;
const daysFrom = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Every reminder for a farm today (before filtering by person). */
export async function loadFarmReminders(db: Db, farm: FarmLike, at = new Date()): Promise<Reminder[]> {
  const day = todayFn();
  const weekAgo = todayFn(-6);
  const { hour } = farmClock(at);
  const animals = keepsAnimals(farm);
  const poultry = keepsPoultry(farm);

  const [animalsRes, healthRes, flocksRes, flockHealthRes, eventsRes, stockRes, duesRes, milkRes, logsRes, rulesFor] = await Promise.all([
    animals
      ? db.from("cattle").select("id, tag_number, name, sex, species, is_fattening").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null)
      : null,
    animals ? db.from("health_records").select("*").eq("farm_id", farm.id).not("next_due_date", "is", null) : null,
    poultry ? db.from("flocks").select("id, name, kind, placed_date, age_at_placement_weeks").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null) : null,
    poultry ? db.from("flock_health_records").select("*").eq("farm_id", farm.id).not("next_due_date", "is", null) : null,
    breedsAnimals(farm)
      ? db.from("breeding_events").select("*").eq("farm_id", farm.id).order("event_date", { ascending: false }).order("created_at", { ascending: false })
      : null,
    db.from("inventory_stock").select("id, name, unit, on_hand, low_stock").eq("farm_id", farm.id).eq("archived", false).not("low_stock", "is", null),
    db.from("buyer_balances").select("due").eq("farm_id", farm.id).gt("due", 0),
    farm.has_dairy ? db.from("milk_records").select("record_date").eq("farm_id", farm.id).gte("record_date", weekAgo).limit(500) : null,
    farm.has_layer || farm.has_broiler
      ? db.from("flock_daily_logs").select("flock_id, log_date, eggs_collected, avg_weight_g").eq("farm_id", farm.id).gte("log_date", todayFn(-60)).limit(5000)
      : null,
    breedsAnimals(farm) ? getAllBreedingRules({ supabase: db as never }) : null,
  ]);

  const herd = (animalsRes?.data ?? []) as { id: string; tag_number: string; name: string | null; sex: string; species: string | null; is_fattening: boolean }[];
  const byId = new Map(herd.map((a) => [a.id, a]));

  const health = dueItems((healthRes?.data ?? []) as HealthRecord[], day, 14)
    .filter((d) => byId.has(d.record.cattle_id))
    .map((d) => ({
      id: d.record.id,
      animalId: d.record.cattle_id,
      animal: label(byId.get(d.record.cattle_id)!),
      product: d.record.product ?? d.record.description,
      days: d.daysUntilDue,
    }));

  const flocks = (flocksRes?.data ?? []) as { id: string; name: string; kind: string | null; placed_date: string; age_at_placement_weeks: number }[];
  const flockName = new Map(flocks.map((f) => [f.id, f.name]));
  const flockHealth = flockDueItems((flockHealthRes?.data ?? []) as FlockHealthRecord[], day, 14)
    .filter((d) => flockName.has(d.record.flock_id))
    .map((d) => ({ id: d.record.id, flockId: d.record.flock_id, flock: flockName.get(d.record.flock_id)!, product: d.record.product, days: d.daysUntilDue }));

  // Breeding: each active female's place in her cycle.
  const events = (eventsRes?.data ?? []) as (BreedingEventLite & { cattle_id: string })[];
  const byCow = new Map<string, BreedingEventLite[]>();
  for (const e of events) byCow.set(e.cattle_id, [...(byCow.get(e.cattle_id) ?? []), e]);
  const breeding = rulesFor
    ? herd
        .filter((a) => a.sex === "female")
        .flatMap((a) =>
          breedingAlerts(reproStatus(byCow.get(a.id) ?? [], day, rulesFor(a.species)), day).map((al) => ({
            animalId: a.id,
            animal: label(a),
            kind: al.kind,
            date: al.date,
            days: al.daysUntil,
          })),
        )
    : [];

  const lowStock = ((stockRes.data ?? []) as { id: string; name: string; unit: string; on_hand: number; low_stock: number }[])
    .filter((i) => Number(i.on_hand) <= Number(i.low_stock))
    .map((i) => ({ id: i.id, name: i.name, onHand: Number(i.on_hand), unit: i.unit }));

  const dueRows = (duesRes.data ?? []) as { due: number }[];

  // Only remind about today's entry on farms that have been entering it this week.
  const milkDays = new Set(((milkRes?.data ?? []) as { record_date: string }[]).map((m) => m.record_date));
  const logs = (logsRes?.data ?? []) as { flock_id: string; log_date: string; eggs_collected: number; avg_weight_g: number | null }[];
  const layerIds = new Set(flocks.filter((f) => (f.kind ?? "layer") === "layer").map((f) => f.id));
  const eggDays = new Set(logs.filter((l) => layerIds.has(l.flock_id) && l.log_date >= weekAgo && l.eggs_collected > 0).map((l) => l.log_date));

  // Meat batches: age, birds alive, last sample weight.
  const meat = flocks.filter((f) => f.kind === "broiler" || f.kind === "sonali");
  const { data: stats } = meat.length ? await db.from("flock_stats").select("flock_id, current_count").in("flock_id", meat.map((f) => f.id)) : { data: [] };
  const liveOf = new Map(((stats ?? []) as { flock_id: string; current_count: number }[]).map((s) => [s.flock_id, s.current_count]));
  const lastWeighed = new Map<string, string>();
  for (const l of logs) {
    if (l.avg_weight_g && Number(l.avg_weight_g) > 0 && (lastWeighed.get(l.flock_id) ?? "") < l.log_date) lastWeighed.set(l.flock_id, l.log_date);
  }
  const batches = meat.map((f) => ({
    id: f.id,
    name: f.name,
    kind: f.kind as string,
    ageDays: Math.max(0, daysFrom(f.placed_date, day)) + (f.age_at_placement_weeks ?? 0) * 7,
    live: liveOf.get(f.id) ?? 0,
    lastWeighed: lastWeighed.get(f.id) ?? null,
  }));

  // Fattening: countdown to the sale day and animals not weighed for a month.
  let fattening: ReminderInput["fattening"] = null;
  const onFeed = herd.filter((a) => a.is_fattening);
  if (fattens(farm) && onFeed.length > 0) {
    const [settings, { data: weights }] = await Promise.all([
      getFatteningSettings(db as never, farm.id),
      db.from("cattle_weights").select("cattle_id, weigh_date").eq("farm_id", farm.id).gte("weigh_date", todayFn(-FATTEN_WEIGH_EVERY_DAYS)).in("cattle_id", onFeed.map((a) => a.id)),
    ]);
    const weighed = new Set(((weights ?? []) as { cattle_id: string }[]).map((w) => w.cattle_id));
    fattening = {
      count: onFeed.length,
      targetDate: settings.targetDate,
      isQurbani: !settings.raw.target_date,
      unweighed: onFeed.filter((a) => !weighed.has(a.id)).length,
    };
  }

  return buildReminders({
    today: day,
    hour,
    currency: farm.currency,
    health,
    flockHealth,
    breeding,
    lowStock,
    dues: { buyers: dueRows.length, total: dueRows.reduce((s, r) => s + Number(r.due), 0) },
    milkEnteredToday: farm.has_dairy && milkDays.size > 0 ? milkDays.has(day) : null,
    eggsEnteredToday: layerIds.size > 0 && eggDays.size > 0 ? eggDays.has(day) : null,
    batches,
    fattening,
    plan: farm.plan !== "free" ? { name: farm.plan, expiresAt: farm.plan_expires_at ?? null } : null,
  });
}

/** The signed-in person's reminders for their current farm, minus muted kinds and ticked-off ones. */
export async function loadMyReminders(db: Db, farm: FarmLike, role: Role, userId: string) {
  const [all, { data: prefs }, { data: done }] = await Promise.all([
    loadFarmReminders(db, farm),
    db.from("notification_prefs").select("muted").eq("user_id", userId).maybeSingle(),
    db.from("reminder_dismissals").select("key").eq("user_id", userId).eq("farm_id", farm.id),
  ]);
  const doneKeys = new Set(((done ?? []) as { key: string }[]).map((d) => d.key));
  const mine = forPerson(all, { role, muted: (prefs?.muted as string[] | undefined) ?? [] });
  return { open: mine.filter((r) => !doneKeys.has(r.key)), done: mine.filter((r) => doneKeys.has(r.key)) };
}
