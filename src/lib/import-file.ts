// Reads an uploaded .csv or .xlsx file into rows of text cells (browser only).

import { unzipSync, strFromU8 } from "fflate";

/** CSV with quoted fields; the separator (comma, semicolon or tab) is guessed from the first line. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.slice(0, src.search(/\r?\n|$/));
  const sep = [",", ";", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function colIndex(ref: string) {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** First worksheet of an .xlsx workbook. Dates come out as Excel day numbers (parseDate reads them). */
export function parseXlsx(data: ArrayBuffer): string[][] {
  const files = unzipSync(new Uint8Array(data), {
    filter: (f) => f.name === "xl/sharedStrings.xml" || f.name === "xl/workbook.xml" || f.name === "xl/_rels/workbook.xml.rels" || f.name.startsWith("xl/worksheets/sheet"),
  });
  const xml = (name: string) => (files[name] ? new DOMParser().parseFromString(strFromU8(files[name]), "application/xml") : null);

  const shared: string[] = [];
  const sst = xml("xl/sharedStrings.xml");
  if (sst) for (const si of Array.from(sst.getElementsByTagName("si"))) shared.push(Array.from(si.getElementsByTagName("t")).map((t) => t.textContent ?? "").join(""));

  // The first sheet in the workbook's order (not always sheet1.xml).
  let sheetPath = "xl/worksheets/sheet1.xml";
  const wb = xml("xl/workbook.xml");
  const rels = xml("xl/_rels/workbook.xml.rels");
  const firstSheet = wb?.getElementsByTagName("sheet")[0];
  const rid = firstSheet?.getAttribute("r:id") ?? firstSheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  if (rid && rels) {
    const target = Array.from(rels.getElementsByTagName("Relationship")).find((r) => r.getAttribute("Id") === rid)?.getAttribute("Target");
    if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  }
  const sheet = xml(sheetPath) ?? xml("xl/worksheets/sheet1.xml");
  if (!sheet) throw new Error("No worksheet found");

  const rows: string[][] = [];
  for (const r of Array.from(sheet.getElementsByTagName("row"))) {
    const rowNo = Number(r.getAttribute("r")) || rows.length + 1;
    const cells: string[] = [];
    let next = 0;
    for (const c of Array.from(r.getElementsByTagName("c"))) {
      const ref = c.getAttribute("r");
      const at = ref ? colIndex(ref) : next;
      next = at + 1;
      const type = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      let text: string;
      if (type === "s") text = shared[Number(v)] ?? "";
      else if (type === "inlineStr") text = Array.from(c.getElementsByTagName("t")).map((t) => t.textContent ?? "").join("");
      else if (type === "b") text = v === "1" ? "TRUE" : "FALSE";
      else text = v;
      cells[at] = text;
    }
    while (rows.length < rowNo - 1) rows.push([]);
    rows.push(Array.from(cells, (x) => x ?? ""));
  }
  return rows;
}

/** Rows of a .csv / .xlsx file, with empty rows kept so row numbers match the spreadsheet. */
export async function readSheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return parseXlsx(await file.arrayBuffer());
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(await file.text());
  throw new Error("unsupported");
}
