// Copied from the website (src/lib/bill.ts) so both give the same bill; change both together.
// A buyer's monthly bill and a sale memo. Pure functions with no imports, so
// the app keeps an exact copy (mobile/src/lib/bill.ts).

export type BillSale = {
  id: string;
  sale_date: string;
  product: string;
  quantity: number;
  unit: string;
  unit_price?: number | null;
  amount: number;
  paid_amount: number;
  fat_percent?: number | null;
  snf_percent?: number | null;
};
export type BillPayment = { id: string; pay_date: string; amount: number; method: string };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** First and last day of a "YYYY-MM" month, or null when it isn't one. */
export function monthBounds(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12 || y < 2000 || y > 2100) return null;
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** The month before or after ("2026-01" − 1 = "2025-12"). */
export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * One month's bill: what was owed when the month began, every sale and payment
 * in the month with the running balance, totals per product, and what is owed
 * at the end. Money paid at the time of a sale counts as paid in that sale.
 */
export function monthBill(sales: BillSale[], payments: BillPayment[], month: string) {
  const b = monthBounds(month);
  if (!b) return null;
  const owedBy = (s: BillSale) => Number(s.amount) - Number(s.paid_amount);
  let opening = 0;
  for (const s of sales) if (s.sale_date < b.from) opening += owedBy(s);
  for (const p of payments) if (p.pay_date < b.from) opening -= Number(p.amount);
  opening = r2(opening);

  type Line = { kind: "sale"; date: string; sale: BillSale; balance: number } | { kind: "payment"; date: string; payment: BillPayment; balance: number };
  const inMonth = (d: string) => d >= b.from && d <= b.to;
  const entries = [
    ...sales.filter((s) => inMonth(s.sale_date)).map((s) => ({ kind: "sale" as const, date: s.sale_date, sale: s, delta: owedBy(s) })),
    ...payments.filter((p) => inMonth(p.pay_date)).map((p) => ({ kind: "payment" as const, date: p.pay_date, payment: p, delta: -Number(p.amount) })),
  ].sort((x, y) => x.date.localeCompare(y.date) || (x.kind === y.kind ? 0 : x.kind === "sale" ? -1 : 1));
  let balance = opening;
  const lines: Line[] = entries.map(({ delta, ...e }) => {
    balance = r2(balance + delta);
    return { ...e, balance } as Line;
  });

  const monthSales = sales.filter((s) => inMonth(s.sale_date));
  const totalSales = r2(monthSales.reduce((t, s) => t + Number(s.amount), 0));
  const paidAtSale = r2(monthSales.reduce((t, s) => t + Number(s.paid_amount), 0));
  const paidLater = r2(payments.filter((p) => inMonth(p.pay_date)).reduce((t, p) => t + Number(p.amount), 0));
  const byProduct = new Map<string, { product: string; unit: string; quantity: number; amount: number }>();
  for (const s of monthSales) {
    const key = `${s.product}|${s.unit}`;
    const row = byProduct.get(key) ?? { product: s.product, unit: s.unit, quantity: 0, amount: 0 };
    row.quantity = Math.round((row.quantity + Number(s.quantity)) * 1000) / 1000;
    row.amount = r2(row.amount + Number(s.amount));
    byProduct.set(key, row);
  }
  return {
    ...b,
    opening,
    lines,
    totalSales,
    paid: r2(paidAtSale + paidLater),
    closing: r2(opening + totalSales - paidAtSale - paidLater),
    products: [...byProduct.values()],
  };
}

/** A short memo number from a sale's id (the same every time). */
export const memoNo = (id: string) => `M-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
