import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  convertUnit,
  dairyRation,
  defaultFeedChoices,
  doseFor,
  fatteningRation,
  FEEDS,
  fodderPlan,
  leastCostRation,
  meatValue,
  milkPrice,
  mixFor,
  poultryFeed,
  pregnancyDates,
  RATION_FEEDS,
  rationNeeds,
  tapeWeightKg,
  TOOL_DEFAULTS as DEFAULTS,
} from "../../src/lib/tools.ts";

test("tape weight in kg, from cm or inches", () => {
  assert.deepEqual(tapeWeightKg(170, 150), { kg: 400, low: 360, high: 440 });
  assert.equal(tapeWeightKg(66.93, 59.06, "in")?.kg, 400);
  assert.equal(tapeWeightKg(0, 150), null);
});

test("dairy ration: concentrate for the body plus milk; richer milk needs more", () => {
  const r = dairyRation(300, 10, 4)!;
  assert.equal(r.concentrateKg, 5.5); // 1.5 + 10/2.5
  assert.equal(r.greenGrassKg, 24);
  assert.equal(r.waterL, 70);
  assert.equal(dairyRation(300, 10, 4.8)!.concentrateKg, 6.5); // 1.5 + 10/2
  assert.ok(r.strawKg >= 1);
  assert.equal(dairyRation(300, -1), null);
});

test("fattening ration grows with the gain wanted", () => {
  assert.equal(fatteningRation(250, 0.8)!.concentrateKg, 3.7);
  assert.ok(fatteningRation(250, 1)!.concentrateKg > fatteningRation(250, 0.5)!.concentrateKg);
});

test("concentrate mix: amounts and cost per kg", () => {
  const m = mixFor("dairy", 100, { wheat_bran: 50, maize: 35, oil_cake: 60, pulse_husk: 40, salt: 40, minerals: 120 });
  assert.equal(m.rows.find((r) => r.ingredient === "wheat_bran")!.kg, 40);
  assert.equal(m.costPerKg, 48.35); // 20 + 8.75 + 12 + 4.8 + 0.4 + 2.4
  assert.equal(m.cost, 4835);
  assert.equal(mixFor("dairy", 10).costPerKg, null);
  assert.equal(Object.values(mixFor("fattening", 1).rows).reduce((s, r) => s + r.pct, 0), 100);
});

test("poultry feed by age, water and cost", () => {
  const l = poultryFeed("layer", 1000, 200, { bagPrice: 3000 })!;
  assert.equal(l.gPerBird, 112);
  assert.equal(l.kgPerDay, 112);
  assert.equal(l.waterLPerDay, 224);
  assert.equal(l.costPerDay, 6720);
  assert.equal(poultryFeed("broiler", 500, 0)!.gPerBird, 22);
  assert.equal(poultryFeed("broiler", 500, 30)!.week, 5);
  assert.equal(poultryFeed("sonali", 100, 100)!.gPerBird, 68);
  assert.equal(poultryFeed("layer", 0, 10), null);
});

test("pregnancy dates per species", () => {
  const c = pregnancyDates("cattle", "2026-01-01", "2026-01-01")!;
  assert.deepEqual([c.nextHeat, c.check, c.due, c.dryOff, c.daysLeft], ["2026-01-22", "2026-03-02", "2026-10-11", "2026-08-12", 283]);
  assert.equal(pregnancyDates("goat", "2026-01-01", "2026-01-01")!.due, "2026-05-31");
  assert.equal(pregnancyDates("sheep", "2026-01-01", "2026-01-01")!.nextHeat, "2026-01-18");
  assert.equal(pregnancyDates("cattle", "2026-01-01", "2026-01-01", 280)!.due, "2026-10-08");
  assert.equal(pregnancyDates("cattle", "bad", "2026-01-01"), null);
});

test("Qurbani: carcass range, price per kg and profit", () => {
  const m = meatValue("cattle", 400, 120000, 95000)!;
  assert.deepEqual([m.carcassLow, m.carcassHigh, m.pricePerLiveKg, m.pricePerMeatKg, m.profit], [200, 220, 300, 571, 25000]);
  assert.equal(meatValue("goat", 30)!.pricePerLiveKg, null);
});

test("unit conversion", () => {
  assert.equal(convertUnit("weight", 2, "maund", "kg"), 80);
  assert.equal(convertUnit("count", 3, "tray", "hali"), 22.5);
  assert.equal(convertUnit("length", 10, "inch", "cm"), 25.4);
  assert.equal(convertUnit("land", 1, "acre", "decimal"), 100);
});

test("medicine dose as ml or tablets", () => {
  assert.deepEqual(doseFor(250, 7.5, { mgPerMl: 25 }), { mg: 1875, ml: 75, tablets: null });
  assert.equal(doseFor(30, 10, { mgPerTablet: 600 })!.tablets, 0.5);
  assert.equal(doseFor(0, 10, {}), null);
});

test("fodder land and silage", () => {
  assert.deepEqual(fodderPlan(5, 25, 70, 90), { tonnesPerYear: 45.6, decimals: 66, silageKg: 11250, silageM3: 18.8 });
});

test("milk price from fat and SNF", () => {
  assert.deepEqual(milkPrice(4, 8.5, 600, 400, 10), { perKg: 58, perLitre: 59.74, total: 597 });
});

// ---------------------------------------------------------------- least-cost ration


const ofDm = (r: NonNullable<ReturnType<typeof leastCostRation>>) => {
  assert.ok(r && r.error === null);
  return r;
};

test("needs: maintenance from kg^0.75, plus milk by fat %, gain and late pregnancy", () => {
  const dry = rationNeeds({ kind: "dry", weightKg: 400 })!;
  assert.ok(Math.abs(dry.tdn - 0.0353 * Math.pow(400, 0.75)) < 1e-9);
  const milking = rationNeeds({ kind: "milking", weightKg: 400, milkL: 10, fatPct: 4 })!;
  assert.ok(Math.abs(milking.tdn - dry.tdn - 10.3 * 0.322) < 1e-9);
  assert.ok(Math.abs(milking.cp - dry.cp - 10.3 * 0.09) < 1e-9);
  assert.ok(rationNeeds({ kind: "milking", weightKg: 400, milkL: 10, fatPct: 6 })!.tdn > milking.tdn);
  assert.ok(rationNeeds({ kind: "dry", weightKg: 400, pregnant: true })!.tdn > dry.tdn);
  assert.ok(rationNeeds({ kind: "growing", weightKg: 400, gainKg: 1 })!.cp > dry.cp);
  assert.equal(rationNeeds({ kind: "dry", weightKg: 0 }), null);
});

test("least cost: meets energy and protein inside what the cow can eat, enough roughage, safe shares", () => {
  const animal = { kind: "milking" as const, weightKg: 400, milkL: 10, fatPct: 4 };
  const r = ofDm(leastCostRation(animal, defaultFeedChoices())!);
  assert.deepEqual(r.short, { tdn: 0, cp: 0, dm: 0 });
  assert.ok(r.supply.tdn >= r.need.tdn - 0.01 && r.supply.cp >= r.need.cp - 0.01);
  assert.ok(r.supply.dm >= r.need.dmMin - 0.1 && r.supply.dm <= r.need.dmMax + 0.1);
  assert.ok(r.supply.roughPct >= 40);
  for (const it of r.items) assert.ok((it.dmKg / r.supply.dm) * 100 <= FEEDS[it.id].maxPct + 0.5, `${it.id} share`);
  const byItems = r.items.reduce((s, it) => s + it.kg * defaultFeedChoices().find((c) => c.id === it.id)!.price, 0) / 10;
  assert.ok(Math.abs((r.costPerLitre ?? 0) - byItems) < 0.5, "cost per litre");
});

test("least cost picks the cheaper feed when two give the same, and follows the prices", () => {
  const animal = { kind: "growing" as const, weightKg: 300, gainKg: 0.8 };
  const base = [{ id: "rice_straw" as const, price: 8 }, { id: "napier" as const, price: 4 }, { id: "mustard_cake" as const, price: 62 }];
  const cheapMaize = ofDm(leastCostRation(animal, [...base, { id: "maize", price: 30 }, { id: "broken_rice", price: 60 }])!);
  const cheapRice = ofDm(leastCostRation(animal, [...base, { id: "maize", price: 60 }, { id: "broken_rice", price: 30 }])!);
  assert.ok(cheapMaize.items.some((i) => i.id === "maize") && !cheapMaize.items.some((i) => i.id === "broken_rice"));
  assert.ok(cheapRice.items.some((i) => i.id === "broken_rice"));
  // A cheaper solution is never more expensive than a forced one.
  const forced = ofDm(leastCostRation(animal, [...base, { id: "maize", price: 60 }])!);
  assert.ok(cheapRice.costDay <= forced.costDay);
});

test("a limit on how much of a feed the farm has is kept", () => {
  const r = ofDm(leastCostRation({ kind: "milking", weightKg: 400, milkL: 10 }, [{ id: "napier", price: 4, maxKg: 10 }, { id: "rice_straw", price: 8 }, { id: "wheat_bran", price: 52 }, { id: "mustard_cake", price: 62 }])!);
  assert.ok((r.items.find((i) => i.id === "napier")?.kg ?? 0) <= 10.05);
});

test("feeds that can't meet a need: the closest ration and what is short", () => {
  const r = ofDm(leastCostRation({ kind: "milking", weightKg: 450, milkL: 18, fatPct: 4 }, [{ id: "rice_straw", price: 8 }, { id: "maize", price: 38 }])!);
  assert.ok(r.short.cp > 0, "protein short without a protein feed");
  assert.deepEqual(leastCostRation({ kind: "dry", weightKg: 300 }, []), { error: "noFeeds" });
  assert.deepEqual(leastCostRation({ kind: "dry", weightKg: 300 }, [{ id: "wheat_bran", price: 50 }]), { error: "noRoughage" });
  assert.equal(leastCostRation({ kind: "dry", weightKg: -1 }, defaultFeedChoices()), null);
});

test("the concentrate mix adds up to 100 % and every feed has a starting price", () => {
  const r = ofDm(leastCostRation({ kind: "milking", weightKg: 400, milkL: 15 }, defaultFeedChoices())!);
  if (r.mix.length) assert.ok(Math.abs(r.mix.reduce((s, m) => s + m.pct, 0) - 100) < 0.5);
  for (const id of RATION_FEEDS) assert.ok(typeof DEFAULTS.feedPrice[id] === "number");
});
