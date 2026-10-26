import { strict as assert } from "node:assert";
import { test } from "node:test";
import { animalProfits, daysInPeriod, milkPrice, sectionPools, type AnimalProfitData } from "../../src/lib/animal-profit.ts";

const period = { from: "2026-01-01", to: "2026-01-10" };
const cow = (id: string, x: Partial<AnimalProfitData["animals"][number]> = {}) => ({
  id, tag_number: id, name: null, category: "cow", status: "active", species: "cattle", is_fattening: false,
  purchase_price: null, joined: "2025-01-01", left: null, milk_litres: 0, direct_cost: 0, sale_amount: 0, ...x,
});

test("animal profit: days on the farm inside the period", () => {
  assert.equal(daysInPeriod("2025-05-01", null, "2026-01-01", "2026-01-10"), 10);
  assert.equal(daysInPeriod("2026-01-06", null, "2026-01-01", "2026-01-10"), 5);
  assert.equal(daysInPeriod("2025-05-01", "2026-01-03", "2026-01-01", "2026-01-10"), 3);
  assert.equal(daysInPeriod("2026-02-01", null, "2026-01-01", "2026-01-10"), 0);
});

test("animal profit: milk price from sales, else the buyers' rate", () => {
  assert.equal(milkPrice({ milk_sold_litres: 100, milk_sales_amount: 6000, milk_rate: 50 }), 60);
  assert.equal(milkPrice({ milk_sold_litres: 0, milk_sales_amount: 0, milk_rate: 55 }), 55);
  assert.equal(milkPrice({ milk_sold_litres: 0, milk_sales_amount: 0, milk_rate: null }), null);
});

test("animal profit: shared costs split between the sections the farm keeps", () => {
  const p = sectionPools({ dairy: 3000, goat: 1000, general: 800 }, { has_dairy: true, has_layer: false, has_goat: true });
  assert.equal(p.dairy, 3600);
  assert.equal(p.goat, 1200);
  assert.equal(p.fattening, 0);
  // nothing spent by sections: general split equally
  const q = sectionPools({ general: 900 }, { has_dairy: true, has_layer: true, has_fattening: true });
  assert.equal(q.dairy, 300);
  assert.equal(q.fattening, 300);
});

test("animal profit: milk, sale, purchase, own costs and a share by days", () => {
  const d: AnimalProfitData = {
    animals: [
      cow("A", { milk_litres: 100, direct_cost: 500 }),
      cow("B", { milk_litres: 20, joined: "2026-01-06" }),
      cow("F", { category: "bull", is_fattening: true, purchase_price: 80000, joined: "2026-01-01", left: "2026-01-10", sale_amount: 95000 }),
      cow("G", { species: "goat", category: "doe" }),
    ],
    spend: { dairy: 6000, fattening: 2000 },
    milk_sold_litres: 100,
    milk_sales_amount: 6000,
    milk_rate: null,
  };
  const r = animalProfits(d, { has_dairy: true, has_layer: false, has_fattening: true, has_goat: true }, period);
  const by = Object.fromEntries(r.rows.map((x) => [x.id, x]));
  // dairy pool 6000 over 15 animal-days: A 10 days → 4000, B 5 days → 2000
  assert.equal(by.A.sharedCost, 4000);
  assert.equal(by.B.sharedCost, 2000);
  assert.equal(by.A.income, 6000);
  assert.equal(by.A.profit, 6000 - 4000 - 500);
  assert.equal(by.B.profit, 1200 - 2000);
  // fattening bull: bought and sold in the period, carries the whole fattening pool
  assert.equal(by.F.profit, 95000 - 80000 - 2000);
  // goat section had no spending
  assert.equal(by.G.profit, 0);
  assert.deepEqual(r.rows.map((x) => x.id), ["F", "A", "G", "B"]);
  assert.equal(r.totals.profit, 13000 + 1500 + 0 - 800);
  assert.equal(r.milkPriceMissing, false);
});

test("animal profit: milk recorded but no price is flagged", () => {
  const r = animalProfits(
    { animals: [cow("A", { milk_litres: 50 })], spend: {}, milk_sold_litres: 0, milk_sales_amount: 0, milk_rate: null },
    { has_dairy: true, has_layer: false },
    period,
  );
  assert.equal(r.milkPriceMissing, true);
  assert.equal(r.rows[0].income, 0);
});
