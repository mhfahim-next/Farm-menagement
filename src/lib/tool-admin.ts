// Labels and parsing for the super admin's Tools page (/admin/tools).
import type { I18n, MessageKey } from "@/lib/i18n/core";
import type { ToolSlug } from "@/lib/tool-list";
import { TOOL_PARAM_SPEC, type ParamSpec, type ToolParamGroup } from "@/lib/tools";

/** The public tool each group of numbers belongs to (for the "Try it" link). */
export const GROUP_TOOL: Record<ToolParamGroup, ToolSlug> = {
  weight: "cattle-weight",
  ration: "feed-ration",
  mixDairy: "feed-ration",
  mixFattening: "feed-ration",
  poultry: "poultry-feed",
  pregCattle: "calving-date",
  pregBuffalo: "calving-date",
  pregGoat: "calving-date",
  pregSheep: "calving-date",
  meat: "qurbani-price",
  units: "unit-converter",
  dose: "medicine-dose",
  fodder: "fodder-land",
  milk: "milk-price",
};

const UNIT_BASE: Record<string, "kg" | "cm" | "m2"> = { maund: "kg", seer: "kg", hand: "cm", decimal: "m2", katha: "m2", bigha: "m2" };

export function fieldLabel(t: I18n["t"], group: ToolParamGroup, key: string) {
  if (group === "mixDairy" || group === "mixFattening") return t(`tools.ing.${key}` as MessageKey);
  if (group.startsWith("preg")) return t(`tadm.f.preg.${key}` as MessageKey);
  if (group === "units") return t("tadm.f.units", { unit: t(`tools.unit.${key}` as MessageKey), base: t(`tadm.base.${UNIT_BASE[key]}` as MessageKey) });
  return t(`tadm.f.${group}.${key}` as MessageKey);
}

export const specFor = (group: ToolParamGroup) => TOOL_PARAM_SPEC[group] as Record<string, ParamSpec>;

/** A typed number: Bangla digits and a decimal comma work too. */
const toNumber = (v: string) => {
  const s = v.trim().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  return s === "" ? NaN : Number(s);
};

/** What was typed in one box: null when empty (use the default), else a number or a list of numbers (NaN when unreadable). */
export function parseField(spec: ParamSpec, raw: string): number | number[] | null {
  if (raw.trim() === "") return null;
  if (typeof spec.def !== "number") return raw.split(/[,;\s]+/).filter(Boolean).map(toNumber);
  return toNumber(raw.replace(",", "."));
}

export const showValue = (v: number | readonly number[]) => (typeof v === "number" ? String(v) : v.join(", "));
