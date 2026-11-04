import { strict as assert } from "node:assert";
import { test } from "node:test";
import { addMonths, memoNo, monthBill, monthBounds } from "../../src/lib/bill.ts";

const sale = (id: string, sale_date: string, amount: number, paid_amount = 0, product = "milk", quantity = amount / 60, unit = "litre") => ({ id, sale_date, product, quantity, unit, amount, paid_amount });
const pay = (id: string, pay_date: string, amount: number) => ({ id, pay_date, amount, method: "cash" });

test("month bounds and stepping months", () => {
  assert.deepEqual(monthBounds("2026-02"), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepEqual(monthBounds("2028-02"), { from: "2028-02-01", to: "2028-02-29" });
  assert.equal(monthBounds("2026-13"), null);
  assert.equal(monthBounds("2026-1"), null);
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2026-12", 1), "2027-01");
});

test("bill: opening due, the month's lines with a running balance, totals and closing due", () => {
  const sales = [sale("a", "2026-09-28", 600, 100), sale("b", "2026-10-02", 1200, 200), sale("c", "2026-10-15", 600), sale("d", "2026-10-20", 240, 240, "eggs", 20, "hali"), sale("e", "2026-11-01", 999)];
  const payments = [pay("p0", "2026-09-30", 300), pay("p1", "2026-10-15", 1000), pay("p2", "2026-11-02", 50)];
  const bill = monthBill(sales, payments, "2026-10")!;
  assert.equal(bill.opening, 200); // 600 − 100 − 300
  assert.deepEqual(
    bill.lines.map((l) => [l.kind, l.date, l.balance]),
    [
      ["sale", "2026-10-02", 1200],
      ["sale", "2026-10-15", 1800],
      ["payment", "2026-10-15", 800],
      ["sale", "2026-10-20", 800],
    ],
  );
  assert.equal(bill.totalSales, 2040);
  assert.equal(bill.paid, 1440); // 200 + 240 at the sale, 1000 later
  assert.equal(bill.closing, 800);
  assert.deepEqual(bill.products, [
    { product: "milk", unit: "litre", quantity: 30, amount: 1800 },
    { product: "eggs", unit: "hali", quantity: 20, amount: 240 },
  ]);
  assert.equal(monthBill(sales, payments, "bad"), null);
  const empty = monthBill([], [], "2026-10")!;
  assert.equal(empty.closing, 0);
  assert.equal(empty.lines.length, 0);
});

test("memo number is short and stable", () => {
  assert.equal(memoNo("3f2a9c1e-0000-4000-8000-000000000000"), "M-3F2A9C1E");
});
