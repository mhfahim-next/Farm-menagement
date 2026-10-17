import "server-only";
import { DEFAULT_BREEDING_RULES, breedingAlerts, reproStatus, type BreedingAlert, type BreedingEventLite, type BreedingRules, type ReproStatus } from "@/lib/breeding";
import type { FarmContext } from "@/lib/auth";
import { today } from "@/lib/format";
import type { BreedingEvent } from "@/lib/types";

export type CowRepro = {
  id: string;
  tag_number: string;
  name: string | null;
  category: string;
  status: ReproStatus;
  alerts: BreedingAlert[];
};

/** Breeding calendar numbers (admin-editable, global). */
export async function getBreedingRules({ supabase }: Pick<FarmContext, "supabase">): Promise<BreedingRules> {
  const { data } = await supabase
    .from("system_settings")
    .select("pregnancy_check_days, gestation_days, heat_cycle_days, dry_off_days, voluntary_wait_days")
    .eq("id", 1)
    .maybeSingle();
  return {
    pregnancyCheckDays: data?.pregnancy_check_days ?? DEFAULT_BREEDING_RULES.pregnancyCheckDays,
    gestationDays: data?.gestation_days ?? DEFAULT_BREEDING_RULES.gestationDays,
    heatCycleDays: data?.heat_cycle_days ?? DEFAULT_BREEDING_RULES.heatCycleDays,
    dryOffDays: data?.dry_off_days ?? DEFAULT_BREEDING_RULES.dryOffDays,
    voluntaryWaitDays: data?.voluntary_wait_days ?? DEFAULT_BREEDING_RULES.voluntaryWaitDays,
  };
}

/** Loads every breeding-age female and works out where she is in her cycle. */
export async function loadBreedingBoard({ supabase, farm }: Pick<FarmContext, "supabase" | "farm">) {
  const [rules, cowsRes, eventsRes] = await Promise.all([
    getBreedingRules({ supabase }),
    supabase
      .from("cattle")
      .select("id, tag_number, name, category")
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
    const status = reproStatus((byCow.get(c.id) ?? []) as BreedingEventLite[], day, rules);
    return { ...c, status, alerts: breedingAlerts(status, day) };
  });

  return { cows, events, rules, checkDays: rules.pregnancyCheckDays };
}
