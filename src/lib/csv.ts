// CSV building for exports. A UTF-8 BOM makes Excel read Bangla correctly.

export type Cell = string | number | boolean | null | undefined;

function escape(value: Cell) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Spreadsheet formula injection: a cell that starts with = + - @ would run as a formula.
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]) {
  return "﻿" + [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n") + "\r\n";
}
