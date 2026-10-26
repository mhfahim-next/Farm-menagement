// Helpers for the unified money ledger (the finance_ledger view).
import type { Module } from "./modules";

export type LedgerSource = "manual" | "health" | "breeding" | "flock_health" | "salary" | "inventory" | "sale";
export type LedgerView = "all" | Module;

export type LedgerRow = {
  farm_id: string;
  txn_date: string;
  txn_type: "income" | "expense";
  module: Module;
  category: string;
  amount: number;
  description: string | null;
  source: LedgerSource;
  source_id: string;
  ref_id: string | null;
  quantity: number | null;
  unit_price: number | null;
};

/** Where a row came from, so the user can open and fix it there. Manual rows stay here. */
export function ledgerHref(row: Pick<LedgerRow, "source" | "source_id" | "ref_id">): string | null {
  switch (row.source) {
    case "health":
      return `/dashboard/health/${row.source_id}/edit`;
    case "breeding":
      return `/dashboard/breeding/${row.source_id}/edit`;
    case "flock_health":
      return `/dashboard/flock-health/${row.source_id}/edit`;
    case "salary":
      return row.ref_id ? `/dashboard/staff/${row.ref_id}` : null;
    case "inventory":
      return row.ref_id ? `/dashboard/inventory/${row.ref_id}` : null;
    case "sale":
      return row.ref_id ? `/dashboard/sales/buyers/${row.ref_id}` : "/dashboard/sales";
    default:
      return null;
  }
}

export function ledgerTotals(rows: Pick<LedgerRow, "txn_type" | "category" | "amount">[]) {
  let income = 0;
  let expense = 0;
  const cats = new Map<string, { txn_type: "income" | "expense"; category: string; total: number }>();
  for (const r of rows) {
    const amount = Number(r.amount);
    if (r.txn_type === "income") income += amount;
    else expense += amount;
    const key = `${r.txn_type}|${r.category}`;
    const cur = cats.get(key) ?? { txn_type: r.txn_type, category: r.category, total: 0 };
    cur.total += amount;
    cats.set(key, cur);
  }
  const byCategory = [...cats.values()].sort(
    (a, b) => (a.txn_type === b.txn_type ? 0 : a.txn_type === "income" ? -1 : 1) || b.total - a.total,
  );
  return { income, expense, byCategory };
}
