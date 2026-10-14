import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatDate, formatMoney, label, today } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { addTransaction } from "./actions";

export const metadata: Metadata = { title: "Finance" };

const categories = [
  "Milk sales", "Egg sales", "Animal sales", "Manure sales", "Other income",
  "Feed", "Medicine & vet", "Labour", "Electricity & water", "Animal purchase",
  "Chicks / pullets", "Equipment", "Transport", "Rent", "Other expense",
];

export default async function FinancePage({ searchParams }: PageProps<"/dashboard/finance">) {
  const { supabase, farm } = await requireFarm();
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

  const sum = (pred: (t: Transaction) => boolean) =>
    txns.filter(pred).reduce((s, t) => s + Number(t.amount), 0);
  const income = sum((t) => t.txn_type === "income");
  const expense = sum((t) => t.txn_type === "expense");

  const modules = [
    ...(farm.has_dairy ? ["dairy"] : []),
    ...(farm.has_layer ? ["layer"] : []),
    "general",
  ] as const;

  return (
    <>
      <PageHeader
        title="Finance"
        description="Income and expenses by month."
        action={
          <form className="flex items-end gap-2">
            <Input name="month" type="month" defaultValue={month} className="w-auto" />
            <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">Show</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Income" value={formatMoney(income, farm.currency)} tone="good" />
        <StatCard label="Expenses" value={formatMoney(expense, farm.currency)} tone="bad" />
        <StatCard label="Profit" value={formatMoney(income - expense, farm.currency)} tone={income >= expense ? "good" : "bad"} />
      </div>

      {modules.length > 2 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {modules.map((mod) => {
            const p = sum((t) => t.module === mod && t.txn_type === "income") - sum((t) => t.module === mod && t.txn_type === "expense");
            return (
              <StatCard
                key={mod}
                label={`${label(mod)} profit`}
                value={formatMoney(p, farm.currency)}
                tone={p >= 0 ? "good" : "bad"}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title="Transactions">
          {txns.length === 0 ? (
            <EmptyState title="No transactions this month" />
          ) : (
            <Table head={["Date", "Category", "Module", "Description", "Amount"]}>
              {txns.map((t) => (
                <tr key={t.id}>
                  <Td>{formatDate(t.txn_date)}</Td>
                  <Td>{t.category}</Td>
                  <Td>
                    <Badge>{label(t.module)}</Badge>
                  </Td>
                  <Td>{t.description ?? "—"}</Td>
                  <Td className={`text-right font-medium tabular-nums ${t.txn_type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                    {t.txn_type === "income" ? "+" : "−"}
                    {formatMoney(Number(t.amount), farm.currency)}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Add transaction">
          <ActionForm action={addTransaction} submitLabel="Save">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select
                  name="txn_type"
                  options={[
                    { value: "expense", label: "Expense" },
                    { value: "income", label: "Income" },
                  ]}
                />
              </Field>
              <Field label="Date">
                <Input name="txn_date" type="date" defaultValue={today()} required />
              </Field>
            </div>
            <Field label="Category">
              <Select name="category" options={categories.map((c) => ({ value: c, label: c }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Module">
                <Select name="module" options={modules.map((m) => ({ value: m, label: label(m) }))} />
              </Field>
              <Field label={`Amount (${farm.currency})`}>
                <Input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required />
              </Field>
            </div>
            <Field label="Description">
              <Input name="description" />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
