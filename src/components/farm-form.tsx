import { ActionForm } from "@/components/action-form";
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
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium text-stone-700">{t("onboarding.farmTypeLegend")}</legend>
        <ModuleOption name="has_dairy" title={t("onboarding.dairyTitle")} body={t("onboarding.dairyBody")} />
        <ModuleOption name="has_layer" title={t("onboarding.layerTitle")} body={t("onboarding.layerBody")} />
      </fieldset>
    </ActionForm>
  );
}

function ModuleOption({ name, title, body }: { name: string; title: string; body: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
      <input type="checkbox" name={name} defaultChecked className="mt-1 accent-emerald-700" />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-stone-500">{body}</span>
      </span>
    </label>
  );
}
