// Admin-managed dropdown values (types, breeds, sessions…), the same table the website uses.
import type { Locale } from "./i18n/core";

export type OptionRow = {
  list_key: string;
  value: string;
  label_en: string;
  label_bn: string | null;
  meta: Record<string, unknown> | null;
  active: boolean;
  sort_order: number;
};

/** The label in the reader's language; unknown values show as they are. */
export function optionLabel(rows: OptionRow[] | null, list: string, value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const r = rows?.find((o) => o.list_key === list && o.value === value);
  if (!r) return value;
  return locale === "bn" ? r.label_bn || r.label_en : r.label_en;
}

export const optionsOf = (rows: OptionRow[] | null, list: string) => (rows ?? []).filter((o) => o.list_key === list && o.active);

/** Animal types milked (shown on the milking sheet); cows when the list isn't loaded yet. */
export function milkingCategories(rows: OptionRow[] | null) {
  const v = optionsOf(rows, "cattle_category").filter((o) => o.meta?.milking === true).map((o) => o.value);
  return v.length ? v : ["cow"];
}

/** Age from the date of birth: "3 y 2 m", "5 m", "12 d" style parts. */
export function ageParts(dob: string | null, today: string): { y: number; m: number; d: number } | null {
  if (!dob) return null;
  const [y1, m1, d1] = dob.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months < 0) return null;
  const days = months === 0 ? Math.round((Date.parse(today) - Date.parse(dob)) / 86_400_000) : 0;
  const y = Math.floor(months / 12);
  months -= y * 12;
  return { y, m: months, d: days };
}
