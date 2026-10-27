// Pure helpers for the reports screen: daily totals for the charts, and CSV text for sharing.
import { addDays } from "./records";

/** One total per day from `from` to `to` (days with nothing are 0). */
export function dailySeries<T>(rows: T[], from: string, to: string, day: (r: T) => string, value: (r: T) => number) {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(day(r), (totals.get(day(r)) ?? 0) + Number(value(r) || 0));
  const out: { date: string; value: number }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, value: Math.round((totals.get(d) ?? 0) * 100) / 100 });
  return out;
}

/** Spreadsheet text: values with commas, quotes or new lines are quoted. Starts with a BOM so Excel reads Bangla. */
export function toCsv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    // A leading = + - @ would run as a formula in a spreadsheet.
    const safe = /^[=+\-@]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

/** Text for an HTML page (the PDF report). */
export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
