import { Field, Input } from "@/components/ui";
import type { I18n } from "@/lib/i18n/core";
import type { Plan } from "@/lib/plan-utils";

/** Price, limits and feature toggles of a plan. Blank limits mean unlimited. */
export function PlanFields({ t, plan }: { t: I18n["t"]; plan?: Plan }) {
  const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : v);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
        <Field label={t("admin.plans.nameEn")}>
          <Input name="name_en" defaultValue={plan?.name_en ?? ""} required maxLength={40} />
        </Field>
        <Field label={t("admin.plans.nameBn")}>
          <Input name="name_bn" defaultValue={plan?.name_bn ?? ""} maxLength={40} />
        </Field>
        <Field label={t("admin.plans.order")}>
          <Input name="sort_order" type="number" defaultValue={plan?.sort_order ?? ""} />
        </Field>
      </div>
      <Field label={t("admin.plans.price")} hint={t("admin.plans.priceHint")}>
        <Input name="price_monthly" type="number" min="0" step="1" defaultValue={num(plan?.price_monthly)} className="max-w-48" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("admin.plans.maxCattle")}>
          <Input name="max_cattle" type="number" min="0" defaultValue={num(plan?.max_cattle)} />
        </Field>
        <Field label={t("admin.plans.maxFlocks")}>
          <Input name="max_flocks" type="number" min="0" defaultValue={num(plan?.max_flocks)} />
        </Field>
        <Field label={t("admin.plans.maxMembers")}>
          <Input name="max_members" type="number" min="1" defaultValue={num(plan?.max_members)} />
        </Field>
        <Field label={t("admin.plans.maxFarms")}>
          <Input name="max_farms" type="number" min="1" defaultValue={num(plan?.max_farms)} />
        </Field>
      </div>
      <p className="-mt-1 text-xs text-stone-500">{t("admin.plans.unlimitedHint")}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="can_export" defaultChecked={plan?.can_export ?? false} className="accent-emerald-700" />
          {t("admin.plans.canExport")}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="priority_support" defaultChecked={plan?.priority_support ?? false} className="accent-emerald-700" />
          {t("admin.plans.priority")}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} className="accent-emerald-700" />
          {t("admin.plans.active")}
        </label>
      </div>
    </>
  );
}
