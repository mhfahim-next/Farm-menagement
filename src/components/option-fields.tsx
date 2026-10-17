import type { I18n } from "@/lib/i18n/core";
import type { ListKey, OptionMeta } from "@/lib/options";
import { Field, Input, Select } from "./ui";

/**
 * Name/order fields plus the extra settings some lists have
 * (animal type → sex & milking, finance category → income/expense,
 * vaccine quick pick → type, product, interval). Server component.
 */
export function OptionFields({
  list,
  i18n,
  defaults,
}: {
  list: ListKey;
  i18n: Pick<I18n, "t" | "e" | "options">;
  defaults?: { label_en?: string; label_bn?: string | null; sort_order?: number; meta?: OptionMeta };
}) {
  const { t, e, options } = i18n;
  const meta = defaults?.meta ?? {};

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
        <Field label={t("options.labelEn")}>
          <Input name="label_en" defaultValue={defaults?.label_en ?? ""} required maxLength={80} />
        </Field>
        <Field label={t("options.labelBn")}>
          <Input name="label_bn" defaultValue={defaults?.label_bn ?? ""} maxLength={80} />
        </Field>
        <Field label={t("options.order")}>
          <Input name="sort_order" type="number" defaultValue={defaults?.sort_order ?? ""} />
        </Field>
      </div>

      {list === "cattle_category" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("options.sex")}>
            <Select
              name="meta_sex"
              defaultValue={meta.sex ?? "female"}
              options={[
                { value: "female", label: e("female") },
                { value: "male", label: e("male") },
              ]}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" name="meta_milking" defaultChecked={meta.milking ?? false} className="accent-emerald-700" />
            {t("options.milking")}
          </label>
        </div>
      )}

      {list === "finance_category" && (
        <Field label={t("options.txnType")}>
          <Select name="meta_txn_type" defaultValue={meta.txn_type ?? "expense"} options={options("txn_type")} />
        </Field>
      )}

      {(list === "health_preset" || list === "flock_health_preset") && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("options.recordType")}>
            <Select name="meta_record_type" defaultValue={meta.record_type ?? "vaccination"} options={options("health_type", meta.record_type)} />
          </Field>
          <Field label={t("options.product")}>
            <Input name="meta_product" defaultValue={meta.product ?? ""} required />
          </Field>
          <Field label={t("options.intervalDays")}>
            <Input name="meta_interval_days" type="number" min="0" max="9999" defaultValue={meta.interval_days ?? 0} />
          </Field>
        </div>
      )}
    </>
  );
}
