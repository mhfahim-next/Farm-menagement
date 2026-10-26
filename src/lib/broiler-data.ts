import "server-only";
import { batchStats, type BatchLog, type BatchStats } from "@/lib/broiler";
import { today } from "@/lib/format";
import type { createClient } from "@/lib/supabase/server";
import type { Flock } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Everything the batch numbers need, for several meat batches at once:
 * daily logs, bird sales, feed taken from stock (at average cost) and medicine.
 */
export async function loadBatchStats(supabase: Supabase, farmId: string, flocks: Flock[]) {
  const ids = flocks.map((f) => f.id);
  const out = new Map<string, { stats: BatchStats; logs: (BatchLog & { id: string; notes: string | null })[] }>();
  if (ids.length === 0) return out;

  const [logsRes, statsRes, movesRes, healthRes] = await Promise.all([
    supabase.from("flock_daily_logs").select("id, flock_id, log_date, mortality, culled, feed_kg, avg_weight_g, notes").in("flock_id", ids),
    supabase.from("flock_stats").select("flock_id, total_sold, total_sold_kg, total_sales").in("flock_id", ids),
    supabase.from("inventory_moves").select("flock_id, item_id, quantity").eq("farm_id", farmId).eq("move_type", "use").in("flock_id", ids),
    supabase.from("flock_health_records").select("flock_id, cost").in("flock_id", ids),
  ]);
  const itemIds = [...new Set((movesRes.data ?? []).map((m) => m.item_id as string))];
  const { data: items } = itemIds.length
    ? await supabase.from("inventory_stock").select("id, avg_cost").in("id", itemIds)
    : { data: [] };
  const avgCost = new Map((items ?? []).map((i) => [i.id as string, Number(i.avg_cost ?? 0)]));

  const by = <T extends { flock_id: string }>(rows: T[] | null) => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) m.set(r.flock_id, [...(m.get(r.flock_id) ?? []), r]);
    return m;
  };
  const logs = by((logsRes.data ?? []) as (BatchLog & { id: string; flock_id: string; notes: string | null })[]);
  const sold = new Map((statsRes.data ?? []).map((s) => [s.flock_id as string, s]));
  const moves = by((movesRes.data ?? []) as { flock_id: string; item_id: string; quantity: number }[]);
  const health = by((healthRes.data ?? []) as { flock_id: string; cost: number | null }[]);

  for (const f of flocks) {
    const flockLogs = logs.get(f.id) ?? [];
    const s = sold.get(f.id);
    const lastLog = flockLogs.map((l) => l.log_date).sort().at(-1);
    out.set(f.id, {
      logs: flockLogs,
      stats: batchStats({
        initialCount: f.initial_count,
        placedDate: f.placed_date,
        chickPrice: f.chick_price == null ? null : Number(f.chick_price),
        logs: flockLogs,
        soldBirds: Number(s?.total_sold ?? 0),
        soldKg: Number(s?.total_sold_kg ?? 0),
        salesAmount: Number(s?.total_sales ?? 0),
        feedCost: (moves.get(f.id) ?? []).reduce((sum, m) => sum + Number(m.quantity) * (avgCost.get(m.item_id) ?? 0), 0),
        medicineCost: (health.get(f.id) ?? []).reduce((sum, h) => sum + Number(h.cost ?? 0), 0),
        // A closed batch stops ageing on its last record.
        asOf: f.status === "active" ? today() : (lastLog ?? today()),
      }),
    });
  }
  return out;
}
