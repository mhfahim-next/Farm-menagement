import "server-only";
import { fattenStats, type FattenStats } from "@/lib/fattening";
import { today } from "@/lib/format";
import type { createClient } from "@/lib/supabase/server";
import type { Cattle } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type FatteningSettings = {
  target_date: string | null;
  daily_cost_cattle: number | null;
  daily_cost_goat: number | null;
  price_kg_cattle: number | null;
  price_kg_goat: number | null;
};

/** The farm's numbers, with the Qurbani date (set by a super admin) as the default sale day. */
export async function getFatteningSettings(supabase: Supabase, farmId: string) {
  const [{ data: own }, { data: sys }] = await Promise.all([
    supabase.from("fattening_settings").select("*").eq("farm_id", farmId).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  const s = (own ?? {}) as Partial<FatteningSettings>;
  return {
    saved: Boolean(own),
    qurbaniDate: (sys?.qurbani_date as string | null) ?? null,
    targetDate: s.target_date ?? (sys?.qurbani_date as string | null) ?? null,
    dailyCost: { cattle: Number(s.daily_cost_cattle ?? 0), small: Number(s.daily_cost_goat ?? 0) },
    pricePerKg: { cattle: Number(s.price_kg_cattle ?? 0), small: Number(s.price_kg_goat ?? 0) },
    raw: s,
  };
}

export type FatteningRow = { animal: Cattle; stats: FattenStats };

/** Every animal being fattened (and the ones sold from fattening), with its numbers. */
export async function loadFattening(supabase: Supabase, farmId: string, only?: string) {
  const settings = await getFatteningSettings(supabase, farmId);
  let q = supabase.from("cattle").select("*").eq("farm_id", farmId).eq("is_fattening", true).is("deleted_at", null).order("tag_number");
  if (only) q = q.eq("id", only);
  const { data } = await q;
  const animals = (data ?? []) as Cattle[];
  const ids = animals.map((a) => a.id);
  if (ids.length === 0) return { settings, rows: [] as FatteningRow[] };

  const [weights, health, breeding, sales] = await Promise.all([
    supabase.from("cattle_weights").select("cattle_id, weigh_date, weight_kg").in("cattle_id", ids),
    supabase.from("health_records").select("cattle_id, cost").in("cattle_id", ids),
    supabase.from("breeding_events").select("cattle_id, cost").in("cattle_id", ids),
    supabase.from("sales").select("cattle_id, sale_date, amount").eq("product", "animal").in("cattle_id", ids),
  ]);
  const sum = (rows: { cattle_id: string; cost: number | null }[] | null, id: string) =>
    (rows ?? []).filter((r) => r.cattle_id === id).reduce((s, r) => s + Number(r.cost ?? 0), 0);

  const day = today();
  const rows = animals.map((a) => {
    const small = a.species === "goat" || a.species === "sheep";
    const sale = (sales.data ?? []).filter((s) => s.cattle_id === a.id).sort((x, y) => String(y.sale_date).localeCompare(String(x.sale_date)))[0];
    return {
      animal: a,
      stats: fattenStats({
        startDate: a.fattening_start ?? a.purchase_date ?? a.created_at.slice(0, 10),
        purchasePrice: Number(a.purchase_price ?? 0),
        weights: (weights.data ?? []).filter((w) => w.cattle_id === a.id).map((w) => ({ date: w.weigh_date as string, kg: Number(w.weight_kg) })),
        directCosts: sum(health.data as { cattle_id: string; cost: number | null }[], a.id) + sum(breeding.data as { cattle_id: string; cost: number | null }[], a.id),
        dailyCost: small ? settings.dailyCost.small : settings.dailyCost.cattle,
        pricePerKg: small ? settings.pricePerKg.small : settings.pricePerKg.cattle,
        targetDate: settings.targetDate,
        today: day,
        sale: sale ? { date: sale.sale_date as string, amount: Number(sale.amount) } : null,
      }),
    };
  });
  return { settings, rows };
}
