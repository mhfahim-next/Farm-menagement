import { strict as assert } from "node:assert";
import { test } from "node:test";
import { FEED_DEFAULTS, FEED_PRESETS, feedPlan, feedRule, feedTotals, milkConcentrate, presetOf } from "../../src/lib/feed-plan.ts";

const rule = (x: object) => ({ ...FEED_DEFAULTS, ...x });

test("default rule: 0.5 kg per 100 kg body weight + 1 kg per 2.5 L", () => {
  const p = feedPlan({ category: "cow", weightKg: 400, milkL: 10 });
  assert.equal(p.kind, "milking");
  assert.equal(p.concentrateKg, 6); // 2 + 4
  assert.equal(p.strawKg, 4); // 1 kg per 100 kg
  assert.equal(p.greenKg, 12); // 3 kg per 100 kg
  assert.equal(p.waterL, 80); // 40 + 4 × 10
});

test("the farm's own rule: 1 kg per 100 kg + first 4 L → 1 kg, then 1 kg per 3 L", () => {
  const own = rule({ maintPer100: 1, firstLitres: 4, firstKg: 1, litresPerKg: 3 });
  assert.equal(feedPlan({ category: "cow", weightKg: 300, milkL: 10 }, own).concentrateKg, 6); // 3 + 1 + 2
  assert.equal(feedPlan({ category: "cow", weightKg: 300, milkL: 2 }, own).concentrateKg, 3.5); // 3 + half of 1
});

test("presets from the sources", () => {
  assert.equal(milkConcentrate(9, rule(FEED_PRESETS.bluegold)), 6); // 3 kg for 3 L + 6 L / 2
  assert.equal(feedPlan({ category: "cow", weightKg: 250, milkL: 5 }, rule(FEED_PRESETS.deshi)).concentrateKg, 3.3); // 1.25 + 2
  assert.equal(feedPlan({ category: "cow", weightKg: 450, milkL: 16 }, rule(FEED_PRESETS.cross)).concentrateKg, 10); // 2 + 8
  assert.equal(presetOf(FEED_DEFAULTS), "standard");
  assert.equal(presetOf(rule(FEED_PRESETS.cross)), "cross");
  assert.equal(presetOf(rule({ litresPerKg: 3 })), null);
});

test("daily limit, dry and close-up cows, young stock, fattening", () => {
  const big = feedPlan({ category: "cow", weightKg: 500, milkL: 30 });
  assert.equal(big.concentrateKg, 10);
  assert.equal(big.capped, true);
  const dry = feedPlan({ category: "cow", weightKg: 400, milkL: 0 });
  assert.equal(dry.kind, "dry");
  assert.equal(dry.concentrateKg, 2);
  assert.equal(feedPlan({ category: "cow", weightKg: 400, milkL: 0, daysToCalving: 30 }).concentrateKg, 3);
  assert.equal(feedPlan({ category: "cow", weightKg: 400, milkL: 0, daysToCalving: 90 }).concentrateKg, 2);
  assert.equal(feedPlan({ category: "heifer", weightKg: 200, milkL: 0 }).concentrateKg, 1);
  assert.equal(feedPlan({ category: "bull", weightKg: 300, milkL: 0, isFattening: true }).concentrateKg, 3);
});

test("no or little green grass: straw makes up for it", () => {
  const none = feedPlan({ category: "cow", weightKg: 300, milkL: 5 }, rule({ greenShare: 0 }));
  assert.equal(none.greenKg, 0);
  assert.equal(none.strawKg, 6); // 3 + 9 / 3
  const half = feedPlan({ category: "cow", weightKg: 300, milkL: 5 }, rule({ greenShare: 0.5 }));
  assert.equal(half.greenKg, 4.5);
  assert.equal(half.strawKg, 4.5);
});

test("unweighed animals use an estimate; saved rules are checked", () => {
  const p = feedPlan({ category: "heifer", weightKg: null, milkL: 0 });
  assert.equal(p.weightGuessed, true);
  assert.equal(p.weightKg, 220);
  const r = feedRule({ litresPerKg: "3", maxKg: 999, maintPer100: -1, bogus: 5, firstKg: "" });
  assert.equal(r.litresPerKg, 3);
  assert.equal(r.maxKg, FEED_DEFAULTS.maxKg);
  assert.equal(r.maintPer100, FEED_DEFAULTS.maintPer100);
  assert.equal("bogus" in r, false);
  assert.deepEqual(feedRule(null), FEED_DEFAULTS);
  const t = feedTotals([feedPlan({ category: "cow", weightKg: 400, milkL: 10 }), dryOne()]);
  assert.equal(t.concentrateKg, 8);
});
const dryOne = () => feedPlan({ category: "cow", weightKg: 400, milkL: 0 });
