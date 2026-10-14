import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Transaction } from "@/lib/types";
import { addTransaction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("finance.meta") };
}

export default async function FinancePage({ searchParams }: PageProps<"/dashboard/finance">) {
  const { supabase, farm } = await requireFarm();
  const { t, f, o, options } = await getI18n();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("farm_id", farm.id)
    .gte("txn_date", from)
    .lt("txn_date", to)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const txns = (data ?? []) as Transaction[];

  const sum = (pred: (x: Transaction) => boolean) =>
    txns.filter(pred).reduce((s, x) => s + Number(x.amount), 0);
  const income = sum((x) => x.txn_type === "income");
  const expense = sum((x) => x.txn_type === "expense");

  // Only the modules this farm uses; labels come from the admin-managed list.
  const moduleOptions = options("txn_module").filter(
    (m) => (m.value !== "dairy" || farm.has_dairy) && (m.value !== "layer" || farm.has_layer),
  );
  const modules = moduleOptions.map((m) => m.value);

  return (
    <>
      <PageHeader
        title={t("finance.title")}
        description={t("finance.desc")}
        action={
          <form className="flex items-end gap-2">
            <Input name="month" type="month" defaultValue={month} className="w-auto" />
            <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.show")}</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("finance.income")} value={f.money(income, farm.currency)} tone="good" />
        <StatCard label={t("finance.expenses")} value={f.money(expense, farm.currency)} tone="bad" />
        <StatCard label={t("finance.profit")} value={f.money(income - expense, farm.currency)} tone={income >= expense ? "good" : "bad"} />
      </div>

      {modules.length > 2 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {modules.map((mod) => {
            const p = sum((x) => x.module === mod && x.txn_type === "income") - sum((x) => x.module === mod && x.txn_type === "expense");
            return (
              <StatCard
                key={mod}
                label={t("finance.moduleProfit", { module: o("txn_module", mod) })}
                value={f.money(p, farm.currency)}
                tone={p >= 0 ? "good" : "bad"}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={t("finance.txnTitle")}>
          {txns.length === 0 ? (
            <EmptyState title={t("finance.txnEmpty")} />
          ) : (
            <Table
              head={[
                t("finance.colDate"),
                t("finance.colCategory"),
                t("finance.colModule"),
                t("finance.colDescription"),
                t("finance.colAmount"),
              ]}
            >
              {txns.map((x) => (
                <tr key={x.id}>
                  <Td>{f.date(x.txn_date)}</Td>
                  <Td>{o("finance_category", x.category)}</Td>
                  <Td>
                    <Badge>{o("txn_module", x.module)}</Badge>
                  </Td>
                  <Td>{x.description ?? "—"}</Td>
                  <Td className={`text-right font-medium tabular-nums ${x.txn_type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                    {x.txn_type === "income" ? "+" : "−"}
                    {f.money(Number(x.amount), farm.currency)}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={t("finance.addTitle")}>
          <ActionForm action={addTransaction} submitLabel={t("common.save")}>
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
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("finance.module")}>
                <Select name="module" options={moduleOptions} />
              </Field>
              <Field label={t("finance.amountWith", { cur: farm.currency })}>
                <Input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required />
              </Field>
            </div>
            <Field label={t("finance.description")}>
              <Input name="description" />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
