import "server-only";
import type { FarmContext } from "@/lib/auth";
import { daysBetween } from "@/lib/breeding";
import { loadBreedingBoard } from "@/lib/breeding-data";
import { feedPlan, feedRule, feedTotals, type FeedPlan, type FeedRule } from "@/lib/feed-plan";
import { today } from "@/lib/format";
import { getToolParams } from "@/lib/tool-params";
import { mixFor } from "@/lib/tools";

export type FeedRow = {
  id: string;
  tag_number: string;
  name: string | null;
  category: string | null;
  daysToCalving: number | null;
  plan: FeedPlan;
};

/** The farm's saved rule (or the default when it never saved one). */
export async function loadFeedRule({ supabase, farm }: Pick<FarmContext, "supabase" | "farm">): Promise<{ rule: FeedRule; saved: boolean }> {
  const { data } = await supabase.from("feed_settings").select("rule").eq("farm_id", farm.id).maybeSingle();
  return { rule: feedRule(data?.rule), saved: !!data };
}

/**
 * Today's feed suggestion for every active cattle animal of the farm: weight
 * from the last weighing, milk from the last 7 days, pregnancy from the
 * breeding records, and the farm's own feeding rule.
 */
export async function loadFeedPlans(ctx: Pick<FarmContext, "supabase" | "farm">) {
  const { supabase, farm } = ctx;
  const day = today();
  const since = today(-6);
  const [{ rule, saved }, cattleRes, weightRes, milkRes, board, tools] = await Promise.all([
    loadFeedRule(ctx),
    supabase
      .from("cattle")
      .select("id, tag_number, name, category, is_fattening")
      .eq("farm_id", farm.id)
      .eq("species", "cattle")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase.from("cattle_latest_weight").select("cattle_id, weight_kg").eq("farm_id", farm.id),
    supabase.from("milk_records").select("cattle_id, record_date, quantity_liters").eq("farm_id", farm.id).gte("record_date", since).lte("record_date", day),
    loadBreedingBoard(ctx),
    getToolParams(),
  ]);
  if (cattleRes.error) throw new Error(cattleRes.error.message);

  const weight = new Map((weightRes.data ?? []).map((w) => [w.cattle_id as string, Number(w.weight_kg)]));
  // Average litres a day over the days she was milked this week.
  const milk = new Map<string, { litres: number; days: Set<string> }>();
  for (const m of milkRes.data ?? []) {
    const x = milk.get(m.cattle_id) ?? { litres: 0, days: new Set<string>() };
    x.litres += Number(m.quantity_liters);
    x.days.add(m.record_date);
    milk.set(m.cattle_id, x);
  }
  const calving = new Map(board.cows.filter((c) => c.status.expectedCalving).map((c) => [c.id, daysBetween(day, c.status.expectedCalving as string)]));

  const rows: FeedRow[] = (cattleRes.data ?? []).map((c) => {
    const m = milk.get(c.id);
    const daysToCalving = calving.get(c.id) ?? null;
    return {
      id: c.id,
      tag_number: c.tag_number,
      name: c.name,
      category: c.category,
      daysToCalving,
      plan: feedPlan({ category: c.category, weightKg: weight.get(c.id) ?? null, milkL: m ? m.litres / m.days.size : 0, isFattening: c.is_fattening, daysToCalving }, rule),
    };
  });

  const totals = feedTotals(rows.map((r) => r.plan));
  // What the concentrate is made of, for 30 days (dairy mix for cows and young stock, fattening mix for fattening animals).
  const dairyKg = rows.filter((r) => r.plan.kind !== "fattening").reduce((s, r) => s + r.plan.concentrateKg, 0);
  const fatKg = rows.filter((r) => r.plan.kind === "fattening").reduce((s, r) => s + r.plan.concentrateKg, 0);
  const p = tools.params;
  const month = new Map<string, number>();
  for (const [kind, kg] of [["dairy", dairyKg], ["fattening", fatKg]] as const) {
    if (kg <= 0) continue;
    for (const r of mixFor(kind, kg * 30, {}, p).rows) month.set(r.ingredient, (month.get(r.ingredient) ?? 0) + r.kg);
  }
  const dairyMix = mixFor("dairy", 1, {}, p).rows.map((r) => ({ ingredient: r.ingredient, pct: r.pct }));

  return { rule, saved, rows, totals, month: [...month.entries()].map(([ingredient, kg]) => ({ ingredient, kg: Math.round(kg) })), dairyMix };
}
