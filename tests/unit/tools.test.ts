import { strict as assert } from "node:assert";
import { test } from "node:test";
import { convertUnit, dairyRation, doseFor, fatteningRation, fodderPlan, meatValue, milkPrice, mixFor, poultryFeed, pregnancyDates, tapeWeightKg } from "../../src/lib/tools.ts";

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
