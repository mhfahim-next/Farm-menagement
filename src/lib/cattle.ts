import type { I18n } from "./i18n/core";

export type MotherCandidate = {
  id: string;
  tag_number: string;
  name: string | null;
  category: string;
  status: string;
};

/** "C-001 · Lali" */
export function animalLabel(a: Pick<MotherCandidate, "tag_number" | "name">) {
  return `${a.tag_number}${a.name ? ` · ${a.name}` : ""}`;
}

/**
 * Options for the "Mother" dropdown. The first option means "unknown / not on
 * this farm" (empty value → no mother). Each animal shows its type, e.g.
 * "C-001 · Lali — Cow", and its status when it isn't active anymore.
 */
export function motherOptions(
  candidates: MotherCandidate[],
  { t, o }: Pick<I18n, "t" | "o">,
  excludeId?: string,
) {
  return [
    { value: "", label: t("cattle.motherUnknown") },
    ...candidates
      .filter((a) => a.id !== excludeId)
      .map((a) => ({
        value: a.id,
        label: `${animalLabel(a)} — ${o("cattle_category", a.category)}${a.status === "active" ? "" : ` (${o("cattle_status", a.status)})`}`,
      })),
  ];
}

/** Animal types that count as milking (shown on the milking sheet). */
export function milkingCategories(rows: I18n["rows"]) {
  return rows("cattle_category")
    .filter((r) => r.meta.milking)
    .map((r) => r.value);
}

/** "Female: Cow, Heifer · Male: Bull" — explains that the type sets the sex. */
export function typeSexHint({ t, options }: Pick<I18n, "t" | "options">) {
  const types = options("cattle_category");
  const names = (sex: string) =>
    types.filter((x) => x.meta.sex === sex).map((x) => x.label).join(", ") || "—";
  return t("cattle.typeHint", { female: names("female"), male: names("male") });
}
