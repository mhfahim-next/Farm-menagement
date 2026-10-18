import type { I18n } from "@/lib/i18n/core";
import { ITEM_KINDS, ITEM_UNITS, type StockItem } from "@/lib/trade";
import { Field, Input, Select } from "./ui";

/** Fields of a stock item (feed, medicine…), used by the add and edit forms. */
export function StockItemFields({
  i18n,
  item,
  modules,
}: {
  i18n: I18n;
  item?: Partial<StockItem>;
  modules: { value: string; label: string }[];
}) {
  const { t } = i18n;
  return (
    <>
      <Field label={t("stock.fieldName")} hint={t("stock.fieldNameHint")}>
        <Input name="name" defaultValue={item?.name ?? ""} required maxLength={80} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("stock.colKind")}>
          <Select name="kind" defaultValue={item?.kind ?? "feed"} options={ITEM_KINDS.map((k) => ({ value: k, label: t(`stock.kind.${k}`) }))} />
        </Field>
        <Field label={t("stock.fieldUnit")}>
          <Select name="unit" defaultValue={item?.unit ?? "kg"} options={ITEM_UNITS.map((u) => ({ value: u, label: t(`stock.unit.${u}`) }))} />
        </Field>
        <Field label={t("stock.fieldUnitKg")} hint={t("stock.fieldUnitKgHint")}>
          <Input name="unit_kg" type="number" min="0.001" step="0.001" inputMode="decimal" defaultValue={item?.unit_kg ?? ""} />
        </Field>
        <Field label={t("stock.fieldLow")} hint={t("stock.fieldLowHint")}>
          <Input name="low_stock" type="number" min="0" step="0.001" inputMode="decimal" defaultValue={item?.low_stock ?? ""} />
        </Field>
      </div>
      <Field label={t("finance.module")} hint={t("stock.fieldModuleHint")}>
        <Select name="module" defaultValue={item?.module ?? "general"} options={modules} />
      </Field>
      <Field label={t("common.notes")}>
        <Input name="notes" defaultValue={item?.notes ?? ""} maxLength={500} />
      </Field>
    </>
  );
}
