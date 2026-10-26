import { strict as assert } from "node:assert";
import { test } from "node:test";
import { fattenStats } from "../../src/lib/fattening.ts";

const base = {
  startDate: "2026-09-26",
  purchasePrice: 80000,
  weights: [{ date: "2026-09-26", kg: 250 }, { date: "2026-10-26", kg: 280 }],
  directCosts: 0,
  dailyCost: 300,
  pricePerKg: 550,
  targetDate: "2027-02-03",
  today: "2026-10-26",
  sale: null,
};

test("fattening: daily gain, weight and cost on the sale day, break-even, profit", () => {
  const s = fattenStats(base);
  assert.equal(s.daysOnFeed, 30);
  assert.equal(s.adg, 1);
  assert.equal(s.daysLeft, 100);
  assert.equal(s.projectedKg, 380);
  assert.equal(s.costSoFar, 80000 + 300 * 30);
  assert.equal(s.costAtTarget, 119000);
  assert.ok(Math.abs(s.breakEvenPerKg! - 119000 / 380) < 1e-9);
  assert.equal(s.estValue, 380 * 550);
  assert.equal(s.estProfit, 209000 - 119000);
});

test("fattening: after the sale the real profit uses the days actually fed", () => {
  const s = fattenStats({ ...base, sale: { date: "2026-10-26", amount: 200000 } });
  assert.equal(s.realProfit, 200000 - 89000);
  assert.equal(s.daysLeft, null);
});

test("fattening: one weight only → no daily gain, projected weight stays the same", () => {
  const s = fattenStats({ ...base, weights: [{ date: "2026-09-26", kg: 250 }] });
  assert.equal(s.adg, null);
  assert.equal(s.projectedKg, 250);
});

test("fattening: medicine and vet costs are added", () => {
  assert.equal(fattenStats({ ...base, directCosts: 1500 }).costSoFar, 80000 + 1500 + 9000);
});
