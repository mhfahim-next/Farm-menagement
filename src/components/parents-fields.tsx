import { motherOptions, type MotherCandidate } from "@/lib/cattle";
import type { I18n } from "@/lib/i18n/core";
import { Field, Input, Select } from "./ui";

/**
 * Mother (dropdown of the farm's female animals, with an "unknown" option) and
 * father (free text). Server component: render it inside the page's form.
 */
export function ParentsFields({
  candidates,
  i18n,
  excludeId,
  defaultMother,
  defaultFather,
}: {
  candidates: MotherCandidate[];
  i18n: Pick<I18n, "t" | "o">;
  excludeId?: string;
  defaultMother?: string | null;
  defaultFather?: string | null;
}) {
  const { t } = i18n;
  return (
    <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-3">
      <legend className="px-1 text-sm font-medium text-stone-700">{t("cattle.parentsLegend")}</legend>
      <Field label={t("cattle.mother")}>
        <Select
          name="mother_id"
          defaultValue={defaultMother ?? ""}
          options={motherOptions(candidates, i18n, excludeId)}
        />
      </Field>
      <Field label={t("cattle.father")} hint={t("cattle.fatherHint")}>
        <Input name="father" defaultValue={defaultFather ?? ""} placeholder={t("cattle.fatherPlaceholder")} />
      </Field>
    </fieldset>
  );
}
