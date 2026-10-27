import { payroll } from "@/lib/staff";
import { daysLeft, staffEntry, staffPayEntry, stockItemEntry, stockMoveEntry } from "@/lib/records";

const today = "2026-10-27";
const mv = (x: Partial<Parameters<typeof stockMoveEntry>[0]>) =>
  stockMoveEntry({ type: "purchase", date: today, qty: "10", price: "1200", amount: "", counted: "", onHand: 0, module: "dairy", flockId: null, supplier: " Rahim Feeds ", notes: "", ...x }, today);

test("stock items and moves", () => {
  const i = stockItemEntry({ name: " Wheat bran ", kind: "feed", unit: "bag", unitKg: "37", module: "dairy", lowStock: "5", notes: "" });
  expect(i.ok && i.entry).toEqual({ name: "Wheat bran", kind: "feed", unit: "bag", unit_kg: 37, module: "dairy", low_stock: 5, notes: null });
  expect(stockItemEntry({ name: "", kind: "feed", unit: "kg", unitKg: "", module: "", lowStock: "", notes: "" })).toEqual({ ok: false, error: "stock.err.name" });
  const buy = mv({});
  expect(buy.ok && buy.entry).toEqual({ move_date: today, move_type: "purchase", quantity: 10, unit_cost: 1200, total_cost: 12000, module: null, flock_id: null, supplier: "Rahim Feeds", notes: null });
  const use = mv({ type: "use", qty: "2", flockId: "f" });
  expect(use.ok && use.entry && [use.entry.quantity, use.entry.module, use.entry.flock_id, use.entry.total_cost]).toEqual([2, "dairy", "f", null]);
  const count = mv({ type: "adjust", counted: "7.5", onHand: 8 });
  expect(count.ok && count.entry?.quantity).toBe(-0.5);
  expect(mv({ type: "adjust", counted: "8", onHand: 8 })).toEqual({ ok: true, entry: null });
  expect(mv({ qty: "0" })).toEqual({ ok: false, error: "sale.err.qty" });
  expect(daysLeft(10, 30)).toBe(10);
  expect(daysLeft(10, 0)).toBeNull();
});

test("staff and pay", () => {
  const s = staffEntry({ name: " Karim ", phone: "", position: "Milker", module: "dairy", salary: "১২০০০", joinDate: "", notes: "" }, today);
  expect(s.ok && s.entry).toEqual({ name: "Karim", phone: null, position: "Milker", module: "dairy", monthly_salary: 12000, join_date: today, notes: null });
  expect(staffEntry({ name: "", phone: "", position: "", module: "", salary: "", joinDate: "", notes: "" }, today)).toEqual({ ok: false, error: "staff.err.name" });
  expect(staffPayEntry({ month: "2026-10", type: "advance", amount: "2000", paidOn: today, note: "" }, today)).toEqual({
    ok: true, entry: { pay_month: "2026-10-01", pay_type: "advance", amount: 2000, paid_on: today, note: null },
  });
  expect(staffPayEntry({ month: "2026-13", type: "salary", amount: "1", paidOn: today, note: "" }, today)).toEqual({ ok: false, error: "staff.err.month" });
  const p = payroll(12000, "2026-11", [{ status: "absent" }, { status: "half_day" }, { status: "leave" }], [{ pay_type: "advance", amount: 5000 }]);
  expect([p.deduction, p.payable, p.paid, p.balance]).toEqual([600, 11400, 5000, 6400]);
});
