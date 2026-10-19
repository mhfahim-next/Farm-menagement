// Importing old records from Excel / CSV. Pure helpers shared by the browser
// (preview) and the server action (which checks everything again).

import type { MessageKey } from "@/lib/i18n/core";
import type { ListKey, OptionRow } from "@/lib/options";

export const IMPORT_KINDS = ["cattle", "milk", "flock", "finance"] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

/** Most rows one import may carry (keeps each save small and quick). */
export const MAX_IMPORT_ROWS = 2000;

type FieldType = "text" | "date" | "number" | "int" | "option";

export type ImportField = {
  key: string;
  label: MessageKey;
  type: FieldType;
  required?: boolean;
  list?: ListKey;
  min?: number;
  max?: number;
  /** Other column headings that mean this field (matched ignoring case, spaces and punctuation). */
  aliases: string[];
  example: string;
};

export const IMPORT_FIELDS: Record<ImportKind, ImportField[]> = {
  cattle: [
    { key: "tag_number", label: "import.f.tag", type: "text", required: true, aliases: ["tag", "tag no", "ear tag", "id", "ট্যাগ", "ট্যাগ নম্বর", "নম্বর"], example: "C-101" },
    { key: "name", label: "import.f.name", type: "text", aliases: ["name", "cow name", "নাম"], example: "Lali" },
    { key: "category", label: "import.f.animalType", type: "option", list: "cattle_category", required: true, aliases: ["type", "category", "animal type", "ধরন", "প্রকার"], example: "cow" },
    { key: "breed", label: "import.f.breed", type: "text", aliases: ["breed", "জাত"], example: "Holstein Friesian" },
    { key: "date_of_birth", label: "import.f.birth", type: "date", aliases: ["dob", "birth", "birth date", "date of birth", "জন্ম", "জন্ম তারিখ"], example: "2022-03-15" },
    { key: "purchase_date", label: "import.f.purchaseDate", type: "date", aliases: ["purchase date", "bought", "bought on", "কেনার তারিখ"], example: "2024-01-10" },
    { key: "purchase_price", label: "import.f.purchasePrice", type: "number", min: 0, aliases: ["price", "purchase price", "cost", "দাম", "ক্রয়মূল্য", "কেনা দাম"], example: "85000" },
    { key: "notes", label: "import.f.notes", type: "text", aliases: ["notes", "note", "remarks", "মন্তব্য", "নোট"], example: "" },
  ],
  milk: [
    { key: "record_date", label: "import.f.date", type: "date", required: true, aliases: ["date", "তারিখ"], example: "2026-10-01" },
    { key: "tag_number", label: "import.f.tag", type: "text", required: true, aliases: ["tag", "tag no", "cow", "ট্যাগ", "গাভী"], example: "C-101" },
    { key: "session", label: "import.f.session", type: "option", list: "milk_session", required: true, aliases: ["session", "time", "shift", "সময়", "বেলা"], example: "morning" },
    { key: "quantity_liters", label: "import.f.litres", type: "number", required: true, min: 0, max: 100, aliases: ["litres", "liters", "litre", "liter", "milk", "quantity", "লিটার", "দুধ"], example: "8.5" },
    { key: "fat_percent", label: "import.f.fat", type: "number", min: 0, max: 15, aliases: ["fat", "fat %", "ফ্যাট"], example: "4.2" },
  ],
  flock: [
    { key: "log_date", label: "import.f.date", type: "date", required: true, aliases: ["date", "তারিখ"], example: "2026-10-01" },
    { key: "flock_name", label: "import.f.flock", type: "text", required: true, aliases: ["flock", "shed", "batch", "ফ্লক", "শেড", "ব্যাচ"], example: "Shed A" },
    { key: "eggs_collected", label: "import.f.eggs", type: "int", required: true, min: 0, aliases: ["eggs", "egg", "eggs collected", "ডিম"], example: "430" },
    { key: "eggs_broken", label: "import.f.broken", type: "int", min: 0, aliases: ["broken", "broken eggs", "ভাঙা", "ভাঙা ডিম"], example: "3" },
    { key: "mortality", label: "import.f.deaths", type: "int", min: 0, aliases: ["deaths", "dead", "mortality", "মৃত", "মৃত্যু"], example: "1" },
    { key: "culled", label: "import.f.culled", type: "int", min: 0, aliases: ["culled", "cull", "বাছাই"], example: "0" },
    { key: "feed_kg", label: "import.f.feedKg", type: "number", min: 0, aliases: ["feed", "feed kg", "খাবার", "খাদ্য"], example: "55" },
    { key: "water_liters", label: "import.f.water", type: "number", min: 0, aliases: ["water", "পানি"], example: "" },
    { key: "notes", label: "import.f.notes", type: "text", aliases: ["notes", "note", "remarks", "মন্তব্য", "নোট"], example: "" },
  ],
  finance: [
    { key: "txn_date", label: "import.f.date", type: "date", required: true, aliases: ["date", "তারিখ"], example: "2026-10-01" },
    { key: "txn_type", label: "import.f.txnType", type: "option", list: "txn_type", required: true, aliases: ["type", "income/expense", "ধরন", "আয়/ব্যয়"], example: "expense" },
    { key: "module", label: "import.f.module", type: "option", list: "txn_module", aliases: ["farm", "section", "module", "খামার", "বিভাগ"], example: "dairy" },
    { key: "category", label: "import.f.category", type: "option", list: "finance_category", required: true, aliases: ["category", "head", "খাত", "বিষয়"], example: "feed" },
    { key: "amount", label: "import.f.amount", type: "number", required: true, min: 0.01, aliases: ["amount", "taka", "tk", "টাকা", "পরিমাণ"], example: "2400" },
    { key: "description", label: "import.f.description", type: "text", aliases: ["description", "details", "notes", "বিবরণ", "মন্তব্য"], example: "2 bags layer feed" },
  ],
};

/** "Ear-Tag No." → "eartagno": for matching column headings. */
export function headingKey(s: string) {
  return s.toLowerCase().normalize("NFC").replace(/[\s\-_.:/()%#]+/g, "");
}

/** Picks a file column for each field by its heading. */
export function guessMapping(kind: ImportKind, headings: string[], labelOf: (k: MessageKey) => string) {
  const keys = headings.map(headingKey);
  const used = new Set<number>();
  const mapping: Record<string, number> = {};
  for (const field of IMPORT_FIELDS[kind]) {
    const names = [field.key, labelOf(field.label), ...field.aliases].map(headingKey);
    const at = keys.findIndex((k, i) => !used.has(i) && k !== "" && names.includes(k));
    if (at >= 0) {
      mapping[field.key] = at;
      used.add(at);
    }
  }
  return mapping;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Bangla digits to Latin, thousands separators and currency signs removed ("6,5" is read as 6.5). */
export function plainNumber(s: string) {
  return s
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .trim()
    .replace(/^(\d+),(\d{1,2})$/, "$1.$2")
    .replace(/[,\s৳]|tk\.?|bdt/gi, "");
}

function isoDate(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (y < 1990 || y > 2100) return null;
  return dt.toISOString().slice(0, 10);
}

/**
 * Reads a date as typed in Bangladesh spreadsheets: 2026-10-05, 05/10/2026,
 * 5-10-2026, 05.10.26, or an Excel day number (45935). Day comes before month.
 */
export function parseDate(raw: string): string | null {
  const s = plainNumber(raw);
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    // Excel stores dates as days since 1899-12-30.
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86_400_000);
    return isoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/.exec(s);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s);
  if (m) return isoDate(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
}

/** Everyday words that mean an option but are not its label. */
const EXTRA_WORDS: Partial<Record<ListKey, Record<string, string>>> = {
  milk_session: { am: "morning", pm: "evening", বিকাল: "evening", বিকেল: "evening", রাত: "evening", ভোর: "morning" },
  txn_type: { খরচ: "expense", cost: "expense", sale: "income", বিক্রি: "income" },
};

/** Finds a dropdown option by its stored value or its English / Bangla label. */
export function matchOption(rows: OptionRow[], list: ListKey, raw: string) {
  const want = EXTRA_WORDS[list]?.[raw.trim().toLowerCase()] ?? headingKey(raw);
  const hit = rows.find(
    (r) => r.list_key === list && r.active && [r.value, r.label_en, r.label_bn].some((x) => x && headingKey(x) === want),
  );
  return hit?.value ?? null;
}

export type CellError = { field: string; code: "required" | "number" | "date" | "option" | "range" | "length" };
export type CleanRow = { row: number; values: Record<string, string | number | null>; errors: CellError[] };

/** Checks and converts one row of text cells (keyed by field). */
export function cleanRow(kind: ImportKind, row: number, cells: Record<string, string>, options: OptionRow[]): CleanRow {
  const values: CleanRow["values"] = {};
  const errors: CellError[] = [];
  for (const field of IMPORT_FIELDS[kind]) {
    const raw = (cells[field.key] ?? "").trim();
    if (raw === "") {
      values[field.key] = null;
      if (field.required) errors.push({ field: field.key, code: "required" });
      continue;
    }
    if (field.type === "text") {
      if (raw.length > (field.key === "notes" || field.key === "description" ? 500 : 120)) errors.push({ field: field.key, code: "length" });
      values[field.key] = raw;
    } else if (field.type === "date") {
      const d = parseDate(raw);
      if (!d) errors.push({ field: field.key, code: "date" });
      values[field.key] = d;
    } else if (field.type === "option") {
      const v = matchOption(options, field.list!, raw);
      if (!v) errors.push({ field: field.key, code: "option" });
      values[field.key] = v;
    } else {
      const n = Number(plainNumber(raw));
      if (!Number.isFinite(n) || (field.type === "int" && !Number.isInteger(n))) {
        errors.push({ field: field.key, code: "number" });
        values[field.key] = null;
      } else {
        if ((field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)) errors.push({ field: field.key, code: "range" });
        values[field.key] = n;
      }
    }
  }
  // An income heading cannot be used for an expense (and the other way round).
  if (kind === "finance" && values.category && values.txn_type) {
    const cat = options.find((r) => r.list_key === "finance_category" && r.value === values.category);
    if (cat?.meta?.txn_type && cat.meta.txn_type !== values.txn_type) errors.push({ field: "category", code: "option" });
  }
  return { row, values, errors };
}

/** A template file: the headings in the user's language and one example row. */
export function templateRows(kind: ImportKind, labelOf: (k: MessageKey) => string) {
  const fields = IMPORT_FIELDS[kind];
  return { header: fields.map((f) => labelOf(f.label)), example: fields.map((f) => f.example) };
}
