import type { I18n } from "./i18n/core";
import type { OptionMeta } from "./options";

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
export function typeSexHint(i18n: Pick<I18n, "t" | "options">, group: AnimalGroup = "cattle") {
  const { t } = i18n;
  const types = categoryOptions(i18n, group);
  const names = (sex: string) =>
    types.filter((x) => x.meta.sex === sex).map((x) => x.label).join(", ") || "—";
  return t("cattle.typeHint", { female: names("female"), male: names("male") });
}

/** "Breed" dropdown options: an empty first choice, then the managed list (for one species when given). */
export function breedOptions(
  { t, options }: Pick<I18n, "t" | "options">,
  list: "cattle_breed" | "flock_breed",
  current?: string | null,
  species?: Species,
) {
  const all = options(list, current).filter(
    (o) => !species || o.value === current || o.value === "Other" || (o.meta.species ?? "cattle") === species,
  );
  return [{ value: "", label: t("cattle.breedChoose"), meta: {} as OptionMeta }, ...all];
}

// ---------------------------------------------------------------------
// Species: cattle, goats and sheep share one animal register. The animal
// type (cattle_category) decides the species, like it decides the sex.
// ---------------------------------------------------------------------
export type Species = "cattle" | "goat" | "sheep";
/** Pages show cattle, or goats and sheep together ("small"). */
export type AnimalGroup = "cattle" | "small";

export const GROUP_SPECIES: Record<AnimalGroup, Species[]> = { cattle: ["cattle"], small: ["goat", "sheep"] };

export function groupOf(species: string | null | undefined): AnimalGroup {
  return species === "goat" || species === "sheep" ? "small" : "cattle";
}

/** Animal types for one group (a goat farm only sees doe, buck, khashi …). */
export function categoryOptions({ options }: Pick<I18n, "options">, group: AnimalGroup, current?: string | null) {
  const allowed = GROUP_SPECIES[group];
  return options("cattle_category", current).filter(
    (o) => o.value === current || allowed.includes((o.meta.species ?? "cattle") as Species),
  );
}

/** Where an animal's list lives. */
export function listHref(species: string | null | undefined) {
  return groupOf(species) === "small" ? "/dashboard/goats" : "/dashboard/cattle";
}
