import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { PAY_METHODS } from "@/lib/trade";
import { addPayment } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.receivePayment") };
}

export default async function PaymentPage({ searchParams }: PageProps<"/dashboard/sales/payment">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f } = await getI18n();
  const { buyer } = await searchParams;
  const { data } = await supabase.from("buyer_balances").select("id, name, due").eq("farm_id", farm.id).eq("archived", false).order("due", { ascending: false });
  const buyers = (data ?? []) as { id: string; name: string; due: number }[];
  const preset = typeof buyer === "string" ? buyer : "";
  const back = preset ? `/dashboard/sales/buyers/${preset}` : "/dashboard/sales";

  return (
    <>
      <PageHeader
        title={t("sales.receivePayment")}
        description={t("sales.receivePaymentDesc")}
        action={<ButtonLink href={back} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-xl">
        {buyers.length === 0 ? (
          <EmptyState title={t("sales.noBuyers")} />
        ) : (
          <ActionForm action={addPayment} submitLabel={t("common.save")} successHref={back}>
            <Field label={t("sales.buyer")}>
              <Select
                name="buyer_id"
                defaultValue={preset}
                required
                options={[
                  { value: "", label: t("sales.pickBuyer") },
                  ...buyers.map((b) => ({
                    value: b.id,
                    label: Number(b.due) > 0 ? `${b.name} · ${t("sales.owes", { amount: f.money(Number(b.due), farm.currency) })}` : b.name,
                  })),
                ]}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("finance.amountWith", { cur: farm.currency })}>
                <Input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required />
              </Field>
              <Field label={t("common.date")}>
                <Input name="pay_date" type="date" defaultValue={today()} max={today()} required />
              </Field>
            </div>
            <Field label={t("sales.method")}>
              <Select name="method" options={PAY_METHODS.map((m) => ({ value: m, label: t(`sales.methodName.${m}`) }))} />
            </Field>
            <Field label={t("common.notes")}>
              <Input name="notes" maxLength={500} />
            </Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
