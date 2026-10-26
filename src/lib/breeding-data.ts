import "server-only";
import { DEFAULT_BREEDING_RULES, GOAT_GESTATION_DAYS, rulesForSpecies, SHEEP_GESTATION_DAYS, breedingAlerts, reproStatus, type BreedingAlert, type BreedingEventLite, type BreedingRules, type ReproStatus } from "@/lib/breeding";
import type { FarmContext } from "@/lib/auth";
import { today } from "@/lib/format";
import type { BreedingEvent } from "@/lib/types";

export type CowRepro = {
  id: string;
  species?: string;
  tag_number: string;
  name: string | null;
  category: string;
  status: ReproStatus;
  alerts: BreedingAlert[];
};

/**
 * Breeding calendar numbers (admin-editable, global). Pass a species to get
 * that species' gestation and heat cycle (goats 150 / 21 days, sheep 147 / 17).
 */
export async function getBreedingRules({ supabase }: Pick<FarmContext, "supabase">, species?: string | null): Promise<BreedingRules> {
  return (await getAllBreedingRules({ supabase }))(species);
}

/** One read of the settings; returns a lookup by species. */
export async function getAllBreedingRules({ supabase }: Pick<FarmContext, "supabase">) {
  const { data } = await supabase
    .from("system_settings")
    .select("pregnancy_check_days, gestation_days, heat_cycle_days, dry_off_days, voluntary_wait_days, goat_gestation_days, sheep_gestation_days")
    .eq("id", 1)
    .maybeSingle();
  const cattle: BreedingRules = {
    pregnancyCheckDays: data?.pregnancy_check_days ?? DEFAULT_BREEDING_RULES.pregnancyCheckDays,
    gestationDays: data?.gestation_days ?? DEFAULT_BREEDING_RULES.gestationDays,
    heatCycleDays: data?.heat_cycle_days ?? DEFAULT_BREEDING_RULES.heatCycleDays,
    dryOffDays: data?.dry_off_days ?? DEFAULT_BREEDING_RULES.dryOffDays,
    voluntaryWaitDays: data?.voluntary_wait_days ?? DEFAULT_BREEDING_RULES.voluntaryWaitDays,
  };
  const small = {
    goatGestationDays: data?.goat_gestation_days ?? GOAT_GESTATION_DAYS,
    sheepGestationDays: data?.sheep_gestation_days ?? SHEEP_GESTATION_DAYS,
  };
  return (species?: string | null) => rulesForSpecies(cattle, species, small);
}

/** Loads every breeding-age female and works out where she is in her cycle. */
export async function loadBreedingBoard({ supabase, farm }: Pick<FarmContext, "supabase" | "farm">) {
  const [rulesFor, cowsRes, eventsRes] = await Promise.all([
    getAllBreedingRules({ supabase }),
    supabase
      .from("cattle")
      .select("id, tag_number, name, category, species")
      .eq("farm_id", farm.id)
      .eq("status", "active")
      .eq("sex", "female")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase
      .from("breeding_events")
      .select("*")
      .eq("farm_id", farm.id)
      .order("event_date", { ascending: false })
      .order("event_time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);
  if (cowsRes.error) throw new Error(cowsRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const events = (eventsRes.data ?? []) as BreedingEvent[];
  const byCow = new Map<string, BreedingEvent[]>();
  for (const e of events) byCow.set(e.cattle_id, [...(byCow.get(e.cattle_id) ?? []), e]);

  const day = today();
  const cows: CowRepro[] = (cowsRes.data ?? []).map((c) => {
    const status = reproStatus((byCow.get(c.id) ?? []) as BreedingEventLite[], day, rulesFor(c.species));
    return { ...c, status, alerts: breedingAlerts(status, day) };
  });

  const rules = rulesFor("cattle");
  return { cows, events, rules, rulesFor, checkDays: rules.pregnancyCheckDays };
}
