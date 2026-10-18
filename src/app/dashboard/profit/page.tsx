import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, Input, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { monthResults, type MonthSummary, type SectionResult } from "@/lib/profit";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("profit.title") };
}

export default async function ProfitPage({ searchParams }: PageProps<"/dashboard/profit">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  // This month and the five before it, for the trend table.
  const from = new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("farm_monthly_summary", { p_farm: farm.id, p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  const months = (data ?? []) as MonthSummary[];
  const current = months.find((r) => r.month.startsWith(month));
  const res = current ? monthResults(current, farm.has_dairy, farm.has_layer) : null;

  const money = (n: number) => f.money(n, farm.currency);
  // Per-litre / per-egg figures need paisa; the money formatter rounds to whole taka.
  const money2 = (n: number | null) => (n === null ? "—" : f.moneyExact(n, farm.currency));
  const pct = (n: number | null) => (n === null ? "—" : `${f.number(n * 100, 0)}%`);

  const section = (kind: "dairy" | "layer", r: SectionResult) => {
    const unit = kind === "dairy" ? t("profit.perLitre") : t("profit.perEgg");
    const good = r.profitPerUnit !== null && r.profitPerUnit >= 0;
    return (
      <Card
        title={kind === "dairy" ? t("profit.dairyTitle") : t("profit.layerTitle")}
        description={kind === "dairy" ? t("profit.dairyDesc", { n: f.number(r.produced, 1) }) : t("profit.layerDesc", { n: f.number(r.produced) })}
      >
        {r.produced <= 0 ? (
          <EmptyState title={kind === "dairy" ? t("profit.noMilk") : t("profit.noEggs")} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-red-50 p-3">
                <p className="text-xs font-medium text-red-800">{t("profit.cost")} {unit}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-red-700">{money2(r.costPerUnit)}</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <p className="text-xs font-medium text-sky-800">{t("profit.income")} {unit}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-sky-700">{money2(r.incomePerUnit)}</p>
              </div>
              <div className={`rounded-xl p-3 ${good ? "bg-emerald-50" : "bg-amber-50"}`}>
                <p className={`text-xs font-medium ${good ? "text-emerald-800" : "text-amber-800"}`}>{t("profit.profit")} {unit}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${good ? "text-emerald-700" : "text-amber-700"}`}>{money2(r.profitPerUnit)}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-stone-500">{t("profit.totalCost")}</dt>
              <dd className="text-right tabular-nums">{money(r.cost)}</dd>
              <dt className="text-stone-500">{t("profit.totalIncome")}</dt>
              <dd className="text-right tabular-nums">{money(r.income)}</dd>
              <dt className="font-medium text-stone-800">{t("profit.totalProfit")}</dt>
              <dd className={`text-right font-semibold tabular-nums ${r.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(r.profit)}</dd>
              <dt className="text-stone-500">{t("profit.avgPrice")}</dt>
              <dd className="text-right tabular-nums">{r.avgSalePrice === null ? t("profit.noSales") : `${money2(r.avgSalePrice)} ${unit}`}</dd>
              <dt className="text-stone-500">{t("profit.feedShare")}</dt>
              <dd className="text-right tabular-nums">{pct(r.feedShare)}</dd>
              {r.sharedCost > 0 && (
                <>
                  <dt className="text-stone-500">{t("profit.sharedIncluded")}</dt>
                  <dd className="text-right tabular-nums">{money(r.sharedCost)}</dd>
                </>
              )}
              {kind === "layer" && res?.feedPerEgg != null && (
                <>
                  <dt className="text-stone-500">{t("profit.feedPerEgg")}</dt>
                  <dd className="text-right tabular-nums">{t("profit.grams", { n: f.number(res.feedPerEgg * 1000, 0) })}</dd>
                </>
              )}
            </dl>
            {kind === "layer" && r.costPerUnit !== null && (
              <p className="mt-3 text-xs text-stone-500">
                {t("profit.perHali", { cost: money2(r.costPerUnit * 4), income: money2(r.incomePerUnit === null ? null : r.incomePerUnit * 4) })}
              </p>
            )}
          </>
        )}
      </Card>
    );
  };

  return (
    <>
      <PageHeader title={t("profit.title")} description={t("profit.desc")} />
      <form className="mb-4 flex items-end justify-end gap-2">
        <Input name="month" type="month" defaultValue={month} className="w-auto" aria-label={t("sales.month")} />
        <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.show")}</button>
      </form>

      {res && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={t("finance.income")} value={money((farm.has_dairy ? res.dairy.income : 0) + (farm.has_layer ? res.layer.income : 0))} tone="good" />
          <StatCard label={t("finance.expenses")} value={money((farm.has_dairy ? res.dairy.cost : 0) + (farm.has_layer ? res.layer.cost : 0))} tone="bad" />
          <StatCard
            label={t("finance.profit")}
            value={money((farm.has_dairy ? res.dairy.profit : 0) + (farm.has_layer ? res.layer.profit : 0))}
            tone={(farm.has_dairy ? res.dairy.profit : 0) + (farm.has_layer ? res.layer.profit : 0) >= 0 ? "good" : "bad"}
          />
        </div>
      )}

      {res && (
        <div className="grid gap-6 lg:grid-cols-2">
          {farm.has_dairy && section("dairy", res.dairy)}
          {farm.has_layer && section("layer", res.layer)}
        </div>
      )}

      <Card className="mt-6" title={t("profit.trendTitle")} description={t("profit.trendDesc")}>
        <Table
          head={[
            t("profit.month"),
            ...(farm.has_dairy ? [t("profit.costLitre"), t("profit.profitDairy")] : []),
            ...(farm.has_layer ? [t("profit.costEgg"), t("profit.profitLayer")] : []),
          ]}
        >
          {[...months].reverse().map((row) => {
            const r = monthResults(row, farm.has_dairy, farm.has_layer);
            const label = f.month(row.month);
            return (
              <tr key={row.month}>
                <Td>
                  <Link href={`/dashboard/profit?month=${row.month.slice(0, 7)}`} className="text-emerald-700 hover:underline">{label}</Link>
                </Td>
                {farm.has_dairy && (
                  <>
                    <Td className="text-right tabular-nums">{money2(r.dairy.costPerUnit)}</Td>
                    <Td className={`text-right tabular-nums ${r.dairy.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(r.dairy.profit)}</Td>
                  </>
                )}
                {farm.has_layer && (
                  <>
                    <Td className="text-right tabular-nums">{money2(r.layer.costPerUnit)}</Td>
                    <Td className={`text-right tabular-nums ${r.layer.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(r.layer.profit)}</Td>
                  </>
                )}
              </tr>
            );
          })}
        </Table>
      </Card>

      <details className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
        <summary className="cursor-pointer font-medium text-stone-900">{t("profit.howTitle")}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t("profit.how1")}</li>
          <li>{t("profit.how2")}</li>
          <li>{t("profit.how3")}</li>
          <li>{t("profit.how4")}</li>
        </ul>
      </details>
    </>
  );
}
