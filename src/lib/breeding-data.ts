import "server-only";
import { breedingAlerts, reproStatus, type BreedingAlert, type BreedingEventLite, type ReproStatus } from "@/lib/breeding";
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

/** Loads every breeding-age female and works out where she is in her cycle. */
export async function loadBreedingBoard({ supabase, farm }: Pick<FarmContext, "supabase" | "farm">) {
  const [cowsRes, eventsRes] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name, category")
      .eq("farm_id", farm.id)
      .eq("status", "active")
      .eq("sex", "female")
      .in("category", ["cow", "heifer"])
      .is("deleted_at", null)
      .order("tag_number"),
    supabase
      .from("breeding_events")
      .select("*")
      .eq("farm_id", farm.id)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (cowsRes.error) throw new Error(cowsRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const events = (eventsRes.data ?? []) as BreedingEvent[];
  const byCow = new Map<string, BreedingEvent[]>();
  for (const e of events) byCow.set(e.cattle_id, [...(byCow.get(e.cattle_id) ?? []), e]);

  const day = today();
  const cows: CowRepro[] = (cowsRes.data ?? []).map((c) => {
    const status = reproStatus((byCow.get(c.id) ?? []) as BreedingEventLite[], day);
    return { ...c, status, alerts: breedingAlerts(status, day) };
  });

  return { cows, events };
}
