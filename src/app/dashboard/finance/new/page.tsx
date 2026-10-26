import type { Metadata } from "next";
import { AmountCalculator } from "@/components/amount-calculator";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { addTransaction } from "../actions";
import { moduleAllowed } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("finance.addTitle") };
}

export default async function NewTransactionPage() {
  const { farm } = await requireRole(STAFF);
  const { t, options } = await getI18n();
  // Only the modules this farm uses; labels come from the admin-managed list.
  const moduleOptions = options("txn_module").filter(
    (m) => moduleAllowed(farm, m.value),
  );

  return (
    <>
      <PageHeader
        title={t("finance.addTitle")}
        description={t("finance.addDesc")}
        action={<ButtonLink href="/dashboard/finance" variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-xl">
          <ActionForm action={addTransaction} submitLabel={t("common.save")} successHref="/dashboard/finance">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("finance.type")}>
                <Select
                  name="txn_type"
                  options={[...options("txn_type")].reverse()}
                />
              </Field>
              <Field label={t("common.date")}>
                <Input name="txn_date" type="date" defaultValue={today()} required />
              </Field>
            </div>
            <Field label={t("common.category")}>
              <Select name="category" options={options("finance_category")} />
            </Field>
            <Field label={t("finance.module")}>
              <Select name="module" options={moduleOptions} />
            </Field>
            <AmountCalculator currency={farm.currency} />
            <Field label={t("finance.description")}>
              <Input name="description" />
            </Field>
          </ActionForm>
      </Card>
    </>
  );
}
