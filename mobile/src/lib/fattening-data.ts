// The fattening (Qurbani) page's data: animals being fattened, their weights and costs, and the farm's numbers.
import { fattenStats, type FattenStats } from "./fattening";
import { supabase } from "./supabase";

export type Settings = { target_date: string | null; daily_cost_cattle: number | null; daily_cost_goat: number | null; price_kg_cattle: number | null; price_kg_goat: number | null };
export type FattenRow = { id: string; tag_number: string; name: string | null; species: string | null; stats: FattenStats };

export async function fetchFattening(farmId: string, today: string) {
  const [animalsRes, own, sys] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name, species, purchase_price, purchase_date, fattening_start, created_at")
      .eq("farm_id", farmId)
      .eq("is_fattening", true)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase.from("fattening_settings").select("target_date, daily_cost_cattle, daily_cost_goat, price_kg_cattle, price_kg_goat").eq("farm_id", farmId).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  if (animalsRes.error) throw new Error(animalsRes.error.message);
  const animals = (animalsRes.data ?? []) as { id: string; tag_number: string; name: string | null; species: string | null; purchase_price: number | null; purchase_date: string | null; fattening_start: string | null; created_at: string }[];
  const settings = (own.data ?? { target_date: null, daily_cost_cattle: null, daily_cost_goat: null, price_kg_cattle: null, price_kg_goat: null }) as Settings;
  const qurbani = (sys.data as { qurbani_date: string | null } | null)?.qurbani_date ?? null;
  const ids = animals.map((a) => a.id);
  const [weights, health, breeding] = ids.length
    ? await Promise.all([
        supabase.from("cattle_weights").select("cattle_id, weigh_date, weight_kg").in("cattle_id", ids),
        supabase.from("health_records").select("cattle_id, cost").in("cattle_id", ids),
        supabase.from("breeding_events").select("cattle_id, cost").in("cattle_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const target = settings.target_date ?? qurbani;
  const cost = (rows: { cattle_id: string; cost: number | null }[] | null, id: string) => (rows ?? []).filter((r) => r.cattle_id === id).reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const rows: FattenRow[] = animals.map((a) => {
    const small = a.species === "goat" || a.species === "sheep";
    return {
      id: a.id,
      tag_number: a.tag_number,
      name: a.name,
      species: a.species,
      stats: fattenStats({
        startDate: a.fattening_start ?? a.purchase_date ?? a.created_at.slice(0, 10),
        purchasePrice: Number(a.purchase_price ?? 0),
        weights: ((weights.data ?? []) as { cattle_id: string; weigh_date: string; weight_kg: number }[]).filter((w) => w.cattle_id === a.id).map((w) => ({ date: w.weigh_date, kg: Number(w.weight_kg) })),
        directCosts: cost(health.data as { cattle_id: string; cost: number | null }[], a.id) + cost(breeding.data as { cattle_id: string; cost: number | null }[], a.id),
        dailyCost: Number((small ? settings.daily_cost_goat : settings.daily_cost_cattle) ?? 0),
        pricePerKg: Number((small ? settings.price_kg_goat : settings.price_kg_cattle) ?? 0),
        targetDate: target,
        today,
        sale: null,
      }),
    };
  });
  return { rows, settings, target, qurbani };
}

