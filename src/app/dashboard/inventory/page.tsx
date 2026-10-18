import type { Metadata } from "next";
import Link from "next/link";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { daysLeft, isLow, type StockItem } from "@/lib/trade";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("stock.title") };
}

export default async function InventoryPage({ searchParams }: PageProps<"/dashboard/inventory">) {
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f, o } = await getI18n();
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const { data, error } = await supabase
    .from("inventory_stock")
    .select("*")
    .eq("farm_id", farm.id)
    .eq("archived", showArchived)
    .order("kind")
    .order("name");
  if (error) throw new Error(error.message);
  const items = (data ?? []) as StockItem[];
  const money = (n: number) => f.money(n, farm.currency);
  const qty = (n: number, unit: StockItem["unit"]) => `${f.number(Number(n), 2)} ${t(`stock.unit.${unit}`)}`;
  const low = items.filter(isLow);
  const value = items.reduce((s, i) => s + (i.avg_cost ? Math.max(0, Number(i.on_hand)) * Number(i.avg_cost) : 0), 0);

  return (
    <>
      <PageHeader
        title={t("stock.title")}
        description={t("stock.desc")}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/inventory/move?type=purchase">+ {t("stock.addPurchase")}</ButtonLink>
            <ButtonLink href="/dashboard/inventory/move?type=use" variant="secondary">− {t("stock.addUse")}</ButtonLink>
            <ButtonLink href="/dashboard/inventory/new" variant="secondary">{t("stock.newItem")}</ButtonLink>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("stock.items")} value={f.number(items.length)} />
        <StatCard label={t("stock.lowCount")} value={f.number(low.length)} tone={low.length ? "bad" : "default"} />
        <StatCard label={t("stock.value")} value={money(value)} />
      </div>

      {low.length > 0 && (
        <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠ {t("stock.lowNotice", { names: low.map((i) => i.name).join(", ") })}
        </p>
      )}

      <Card className="mt-6">
        {items.length === 0 ? (
          <EmptyState title={showArchived ? t("stock.emptyArchived") : t("stock.empty")}>
            {!showArchived && t("stock.emptyBody")}
          </EmptyState>
        ) : (
          <Table head={[t("stock.colItem"), t("stock.colKind"), t("stock.colOnHand"), t("stock.colAvgCost"), t("stock.colDaysLeft"), ""]}>
            {items.map((i) => {
              const days = daysLeft(i);
              const negative = Number(i.on_hand) < 0;
              return (
                <ClickRow key={i.id} href={`/dashboard/inventory/${i.id}`}>
                  <Td>
                    <Link href={`/dashboard/inventory/${i.id}`} className="font-medium text-emerald-700 hover:underline">{i.name}</Link>
                    <span className="block text-xs text-stone-500">{o("txn_module", i.module)}</span>
                  </Td>
                  <Td>{t(`stock.kind.${i.kind}`)}</Td>
                  <Td className={`tabular-nums font-medium ${negative ? "text-red-600" : ""}`}>
                    {qty(i.on_hand, i.unit)}
                    {isLow(i) && <span className="ml-2"><Badge tone="amber">{t("stock.low")}</Badge></span>}
                    {negative && <span className="block text-xs font-normal text-red-600">{t("stock.negative")}</span>}
                  </Td>
                  <Td className="tabular-nums">{i.avg_cost !== null ? `${money(Number(i.avg_cost))} / ${t(`stock.unit.${i.unit}`)}` : "—"}</Td>
                  <Td className="tabular-nums">{days === null ? "—" : t("stock.days", { n: f.number(days) })}</Td>
                  <Td>
                    <span className="flex justify-end gap-3 text-sm">
                      <Link href={`/dashboard/inventory/move?type=purchase&item=${i.id}`} className="relative z-10 text-emerald-700 hover:underline">+ {t("stock.buy")}</Link>
                      <Link href={`/dashboard/inventory/move?type=use&item=${i.id}`} className="relative z-10 text-stone-700 hover:underline">− {t("stock.use")}</Link>
                    </span>
                  </Td>
                </ClickRow>
              );
            })}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-sm">
        <Link href={showArchived ? "/dashboard/inventory" : "/dashboard/inventory?archived=1"} className="text-stone-600 hover:underline">
          {showArchived ? t("stock.showActive") : t("stock.showArchived")}
        </Link>
      </p>
      <p className="mt-2 text-xs text-stone-500">{t("stock.financeNote")}</p>
    </>
  );
}
