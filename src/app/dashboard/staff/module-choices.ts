import type { I18n } from "@/lib/i18n/core";

/** Which part of the farm a worker belongs to; only the sections the farm uses. */
export function moduleChoices(t: I18n["t"], farm: { has_dairy: boolean; has_layer: boolean }) {
  const list: { value: string; label: string }[] = [];
  if (farm.has_dairy) list.push({ value: "dairy", label: t("staff.module.dairy") });
  if (farm.has_layer) list.push({ value: "layer", label: t("staff.module.layer") });
  if (farm.has_dairy && farm.has_layer) list.push({ value: "both", label: t("staff.module.both") });
  return list.length ? list : [{ value: "both", label: t("staff.module.both") }];
}
