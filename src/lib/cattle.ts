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
  { t, e }: Pick<I18n, "t" | "e">,
  excludeId?: string,
) {
  return [
    { value: "", label: t("cattle.motherUnknown") },
    ...candidates
      .filter((a) => a.id !== excludeId)
      .map((a) => ({
        value: a.id,
        label: `${animalLabel(a)} — ${e(a.category)}${a.status === "active" ? "" : ` (${e(a.status)})`}`,
      })),
  ];
}
