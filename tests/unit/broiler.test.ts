import { strict as assert } from "node:assert";
import { test } from "node:test";
import { batchStats, CHICK_WEIGHT_KG } from "../../src/lib/broiler.ts";

const logs = Array.from({ length: 30 }, (_, i) => ({
  log_date: `2026-10-${String(i + 1).padStart(2, "0")}`,
  mortality: 2,
  culled: 0,
  feed_kg: 20 + (i + 1) * 4,
  avg_weight_g: i + 1 === 30 ? 1850 : null,
}));

test("broiler batch: live birds, mortality, FCR and cost per kg", () => {
  const s = batchStats({
    initialCount: 1000, placedDate: "2026-10-01", chickPrice: 50, logs,
    soldBirds: 0, soldKg: 0, salesAmount: 0, feedCost: 2460 * 60, medicineCost: 0, asOf: "2026-10-31",
  });
  assert.equal(s.live, 940);
  assert.equal(s.deaths, 60);
  assert.equal(s.mortalityPct, 6);
  assert.equal(s.feedKg, 2460);
  assert.equal(s.latestWeightG, 1850);
  assert.equal(s.ageDays, 30);
  const liveKg = 940 * 1.85;
  assert.ok(Math.abs(s.fcr! - 2460 / (liveKg - 1000 * CHICK_WEIGHT_KG)) < 1e-9);
  assert.equal(s.totalCost, 50000 + 147600);
  assert.ok(Math.abs(s.costPerKg! - 197600 / liveKg) < 1e-9);
  assert.equal(s.profit, -197600);
  assert.ok(s.epef! > 0);
});

test("broiler batch: sold birds count in produced kg and leave the live count", () => {
  const s = batchStats({
    initialCount: 1000, placedDate: "2026-10-01", chickPrice: 50, logs,
    soldBirds: 500, soldKg: 950, salesAmount: 152000, feedCost: 0, medicineCost: 0, asOf: "2026-10-31",
  });
  assert.equal(s.live, 440);
  assert.ok(Math.abs(s.producedKg! - (950 + 440 * 1.85)) < 1e-9);
  assert.equal(s.profit, 152000 - 50000);
});

test("broiler batch: no sample weight yet → no FCR, no cost per kg", () => {
  const s = batchStats({
    initialCount: 100, placedDate: "2026-10-01", chickPrice: null,
    logs: [{ log_date: "2026-10-02", mortality: 1, culled: 0, feed_kg: 3 }],
    soldBirds: 0, soldKg: 0, salesAmount: 0, feedCost: 0, medicineCost: 0, asOf: "2026-10-02",
  });
  assert.equal(s.fcr, null);
  assert.equal(s.costPerKg, null);
  assert.equal(s.chickCost, 0);
});
