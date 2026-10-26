import { ActionForm } from "@/components/action-form";
import { FarmKindFields } from "@/components/farm-kind-fields";
import { Field, Input, Select } from "@/components/ui";
import type { I18n } from "@/lib/i18n/core";
import type { ActionState } from "@/lib/types";

/** Create-a-farm form, used on onboarding and when adding another farm. */
export function FarmForm({
  action,
  i18n,
  plan,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  i18n: Pick<I18n, "t" | "options">;
  /** Plan chosen on the home page; the plan page opens on it after the farm is created. */
  plan?: string | null;
}) {
  const { t, options } = i18n;
  const currencies = options("currency");
  const defaultCurrency = currencies.find((c) => c.value === "BDT")?.value ?? currencies[0]?.value;

  return (
    <ActionForm action={action} submitLabel={t("onboarding.submit")} fullWidthSubmit>
      {plan && <input type="hidden" name="plan" value={plan} />}
      <Field label={t("onboarding.farmName")}>
        <Input name="name" placeholder={t("onboarding.farmNamePlaceholder")} required minLength={2} />
      </Field>
      <Field label={t("common.location")}>
        <Input name="location" placeholder={t("onboarding.locationPlaceholder")} />
      </Field>
      <Field label={t("common.currency")}>
        <Select name="currency" defaultValue={defaultCurrency} options={currencies} />
      </Field>
      <FarmKindFields t={t} />
    </ActionForm>
  );
}
