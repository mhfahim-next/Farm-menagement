import type { I18n } from "@/lib/i18n/core";
import type { Buyer } from "@/lib/trade";
import { Field, Input } from "./ui";

/** Buyer name, phone and usual rates (used by the add and edit forms). */
export function BuyerFields({ i18n, buyer, currency, dairy, layer }: { i18n: I18n; buyer?: Partial<Buyer>; currency: string; dairy: boolean; layer: boolean }) {
  const { t } = i18n;
  return (
    <>
      <Field label={t("sales.buyerName")} hint={t("sales.buyerNameHint")}>
        <Input name="name" defaultValue={buyer?.name ?? ""} required maxLength={80} />
      </Field>
      <Field label={t("sales.phone")}>
        <Input name="phone" type="tel" inputMode="tel" defaultValue={buyer?.phone ?? ""} maxLength={20} placeholder="01XXXXXXXXX" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {dairy && (
          <Field label={t("sales.milkRate", { cur: currency })}>
            <Input name="milk_rate" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={buyer?.milk_rate ?? ""} />
          </Field>
        )}
        {layer && (
          <Field label={t("sales.eggRate", { cur: currency })}>
            <Input name="egg_rate" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={buyer?.egg_rate ?? ""} />
          </Field>
        )}
      </div>
      <Field label={t("common.notes")}>
        <Input name="notes" defaultValue={buyer?.notes ?? ""} maxLength={500} />
      </Field>
    </>
  );
}
