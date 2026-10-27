import { dailySeries, escapeHtml, toCsv } from "../src/lib/report";

test("daily totals fill every day of the range", () => {
  const rows = [
    { d: "2026-10-01", q: 5 },
    { d: "2026-10-01", q: 4.5 },
    { d: "2026-10-03", q: 2 },
    { d: "2026-09-30", q: 99 },
  ];
  expect(dailySeries(rows, "2026-10-01", "2026-10-03", (r) => r.d, (r) => r.q)).toEqual([
    { date: "2026-10-01", value: 9.5 },
    { date: "2026-10-02", value: 0 },
    { date: "2026-10-03", value: 2 },
  ]);
});

test("CSV quotes what needs quoting and blocks formulas", () => {
  const csv = toCsv([
    ["Name", "Amount"],
    ['Karim "big"', 1200],
    ["a,b", -5],
    ["=SUM(A1)", null],
  ]);
  expect(csv).toBe('﻿Name,Amount\r\n"Karim ""big""",1200\r\n"a,b",-5\r\n\'=SUM(A1),');
});

test("HTML text is escaped", () => {
  expect(escapeHtml('<b>"x" & y</b>')).toBe("&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;");
});
