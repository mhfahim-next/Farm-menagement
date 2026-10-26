import type { Metadata } from "next";
import Link from "next/link";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { ledgerHref, ledgerTotals, type LedgerRow, type LedgerView } from "@/lib/finance";
import { today } from "@/lib/format";
import { farmModules } from "@/lib/modules";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("finance.meta") };
}

export default async function FinancePage({ searchParams }: PageProps<"/dashboard/finance">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f, o } = await getI18n();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  // The section switch only exists on farms that run more than one part.
  const sections = farmModules(farm).filter((m) => m !== "general");
  const both = sections.length > 1;
  const view: LedgerView = both && sections.some((m) => m === sp.view) ? (sp.view as LedgerView) : "all";

  let query = supabase
    .from("finance_ledger")
    .select("*")
    .eq("farm_id", farm.id)
    .gte("txn_date", from)
    .lt("txn_date", to)
    .order("txn_date", { ascending: false });
  if (view !== "all") query = query.eq("module", view);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as LedgerRow[];

  const { income, expense, byCategory } = ledgerTotals(rows);
  const money = (n: number) => f.money(n, farm.currency);
  const qs = (v: LedgerView) => `?month=${month}${v === "all" ? "" : `&view=${v}`}`;
  const tabs: { v: LedgerView; label: string }[] = [
    { v: "all", label: t("finance.viewAll") },
    ...sections.map((m) => ({ v: m, label: m === "dairy" ? t("finance.viewCow") : m === "layer" ? t("finance.viewLayer") : o("txn_module", m) })),
  ];

  return (
    <>
      <PageHeader
        title={t("finance.title")}
        description={t("finance.desc")}
        action={<ButtonLink href="/dashboard/finance/new">+ {t("finance.addTitle")}</ButtonLink>}
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        {both ? (
          <div role="tablist" aria-label={t("finance.viewLabel")} className="inline-flex flex-wrap rounded-lg border border-stone-300 p-0.5 text-sm">
            {tabs.map((x) => (
              <Link
                key={x.v}
                href={qs(x.v)}
                role="tab"
                aria-selected={view === x.v}
                className={`rounded-md px-3 py-1.5 font-medium ${view === x.v ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                {x.label}
              </Link>
            ))}
          </div>
        ) : (
          <span />
        )}
        <form className="flex items-end gap-2">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <Input name="month" type="month" defaultValue={month} className="w-auto" />
          <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.show")}</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("finance.income")} value={money(income)} tone="good" />
        <StatCard label={t("finance.expenses")} value={money(expense)} tone="bad" />
        <StatCard label={t("finance.profit")} value={money(income - expense)} tone={income >= expense ? "good" : "bad"} />
      </div>

      {view !== "all" && <p className="mt-3 text-xs text-stone-500">{t("finance.viewNote")}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title={t("finance.txnTitle")} description={t("finance.txnDesc")}>
          {rows.length === 0 ? (
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
              {rows.map((x) => {
                const href = ledgerHref(x);
                const cells = (
                  <>
                    <Td>{f.date(x.txn_date)}</Td>
                    <Td>{o("finance_category", x.category)}</Td>
                    <Td>
                      <Badge>{o("txn_module", x.module)}</Badge>
                    </Td>
                    <Td>
                      {x.description ?? "—"}
                      {x.quantity != null && x.unit_price != null && (
                        <span className="block text-xs text-stone-500">
                          {f.number(Number(x.quantity), 3)} × {money(Number(x.unit_price))}
                        </span>
                      )}
                      {x.source !== "manual" && (
                        <span className="mt-0.5 block">
                          <Badge tone="blue">{t(`finance.source.${x.source}`)}</Badge>
                        </span>
                      )}
                    </Td>
                    <Td className={`text-right font-medium tabular-nums ${x.txn_type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                      {x.txn_type === "income" ? "+" : "−"}
                      {money(Number(x.amount))}
                    </Td>
                  </>
                );
                return href ? (
                  <ClickRow key={`${x.source}-${x.source_id}`} href={href}>
                    {cells}
                  </ClickRow>
                ) : (
                  <tr key={`${x.source}-${x.source_id}`}>{cells}</tr>
                );
              })}
            </Table>
          )}
        </Card>

        <Card title={t("finance.breakdownTitle")} description={t("finance.breakdownDesc")}>
          {byCategory.length === 0 ? (
            <EmptyState title={t("finance.txnEmpty")} />
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {byCategory.map((c) => (
                <li key={`${c.txn_type}-${c.category}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-stone-700">{o("finance_category", c.category)}</span>
                  <span className={`shrink-0 font-medium tabular-nums ${c.txn_type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                    {c.txn_type === "income" ? "+" : "−"}
                    {money(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
