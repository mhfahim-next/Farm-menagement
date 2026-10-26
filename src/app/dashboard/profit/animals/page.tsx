import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { isProfitPeriod, loadAnimalProfits, PROFIT_PERIODS } from "@/lib/animal-profit-data";
import { getI18n } from "@/lib/i18n/server";
import { keepsAnimals } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("aprofit.title") };
}

export default async function AnimalProfitPage({ searchParams }: PageProps<"/dashboard/profit/animals">) {
  const { supabase, farm, role } = await requireRole(STAFF);
  if (!keepsAnimals(farm)) notFound();
  const { t, f, o } = await getI18n();
  const money = (n: number) => f.money(n, farm.currency);

  if (farm.show_animal_profit === false) {
    return (
      <>
        <PageHeader title={t("aprofit.title")} />
        <Card>
          <EmptyState title={t("aprofit.offTitle")}>
            {t("aprofit.offBody")}{" "}
            {MANAGERS.includes(role) && (
              <Link href="/dashboard/settings" className="font-medium text-emerald-700 underline">
                {t("aprofit.offLink")}
              </Link>
            )}
          </EmptyState>
        </Card>
      </>
    );
  }

  const sp = await searchParams;
  const period = isProfitPeriod(sp.period) ? sp.period : "12m";
  const { rows, totals, milkPrice, milkPriceMissing, range } = await loadAnimalProfits({ supabase, farm }, period);
  const best = rows.find((r) => r.profit > 0);
  const losing = rows.filter((r) => r.profit < 0).length;
  const tone = (n: number) => (n >= 0 ? "text-emerald-700" : "text-red-600");

  return (
    <>
      <PageHeader
        title={t("aprofit.title")}
        description={t("aprofit.desc")}
        action={
          <ButtonLink href="/dashboard/profit" variant="secondary">
            ← {t("nav.profit")}
          </ButtonLink>
        }
      />

      <nav className="mb-5 flex flex-wrap gap-2" aria-label={t("aprofit.period")} data-testid="periods">
        {PROFIT_PERIODS.map((p) => (
          <Link
            key={p}
            href={`/dashboard/profit/animals?period=${p}`}
            aria-current={p === period ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${p === period ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
          >
            {t(`aprofit.period.${p}`)}
          </Link>
        ))}
        <span className="self-center text-xs text-stone-500">
          {period === "all" ? t("aprofit.allTime") : `${f.date(range.from)} – ${f.date(range.to)}`}
        </span>
      </nav>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("aprofit.totalProfit")} value={money(totals.profit)} tone={totals.profit >= 0 ? "good" : "bad"} />
        <StatCard label={t("aprofit.totalIncome")} value={money(totals.income)} />
        <StatCard label={t("aprofit.totalCost")} value={money(totals.cost)} />
        <StatCard
          label={t("aprofit.losing")}
          value={f.number(losing)}
          tone={losing > 0 ? "bad" : "default"}
          hint={best ? t("aprofit.best", { animal: animalLabel(best) }) : undefined}
        />
      </div>

      {milkPriceMissing && (
        <p role="status" className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {t("aprofit.noMilkPrice")}{" "}
          <Link href="/dashboard/sales" className="font-medium underline">
            {t("aprofit.noMilkPriceLink")}
          </Link>
        </p>
      )}

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("aprofit.emptyTitle")}>{t("aprofit.emptyBody")}</EmptyState>
        ) : (
          <Table
            head={[t("cattle.colTag"), t("aprofit.colProfit"), t("aprofit.colIncome"), t("aprofit.colCost"), t("aprofit.colPerDay"), t("aprofit.colMilk"), t("aprofit.colDays")]}
          >
            {rows.map((r) => (
              <ClickRow key={r.id} href={`/dashboard/cattle/${r.id}`}>
                <Td>
                  <Link href={`/dashboard/cattle/${r.id}`} className="font-medium text-emerald-700 hover:underline">
                    {animalLabel(r)}
                  </Link>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-stone-500">
                    {o("cattle_category", r.category)}
                    <Badge tone={r.section === "dairy" ? "blue" : r.section === "goat" ? "green" : "amber"}>{t(`aprofit.section.${r.section}`)}</Badge>
                    {r.status !== "active" && <Badge>{o("cattle_status", r.status)}</Badge>}
                  </span>
                </Td>
                <Td className={`tabular-nums font-semibold ${tone(r.profit)}`}>{money(r.profit)}</Td>
                <Td className="tabular-nums">{money(r.income)}</Td>
                <Td className="tabular-nums">
                  <span title={t("aprofit.costTitle", { purchase: money(r.purchase), own: money(r.directCost), shared: money(r.sharedCost) })}>{money(r.cost)}</span>
                </Td>
                <Td className={`tabular-nums ${tone(r.perDay)}`}>{f.moneyExact(r.perDay, farm.currency)}</Td>
                <Td className="tabular-nums">{r.milkLitres > 0 ? t("common.litersShort", { n: f.number(r.milkLitres, 0) }) : "—"}</Td>
                <Td className="tabular-nums">{f.number(r.days)}</Td>
              </ClickRow>
            ))}
          </Table>
        )}
        <div className="mt-4 grid gap-1 text-xs text-stone-500">
          <p>{t("aprofit.howIncome", { price: milkPrice !== null ? f.moneyExact(milkPrice, farm.currency) : "—" })}</p>
          <p>{t("aprofit.howCost")}</p>
          <p>{t("aprofit.howNote")}</p>
        </div>
      </Card>
    </>
  );
}
