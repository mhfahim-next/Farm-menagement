import type { Metadata } from "next";
import Link from "next/link";
import { ClickRow } from "@/components/click-row";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { eggCount, type Buyer, type Sale } from "@/lib/trade";
import { deleteSale } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.title") };
}

export default async function SalesPage({ searchParams }: PageProps<"/dashboard/sales">) {
  const { supabase, farm, role } = await requireRole(STAFF);
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  const [{ data: buyerRows }, { data: saleRows }] = await Promise.all([
    supabase.from("buyer_balances").select("*").eq("farm_id", farm.id).eq("archived", false).order("due", { ascending: false }).order("name"),
    supabase.from("sales").select("*").eq("farm_id", farm.id).gte("sale_date", from).lt("sale_date", to).order("sale_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const buyers = (buyerRows ?? []) as Buyer[];
  const sales = (saleRows ?? []) as Sale[];
  const buyerName = new Map(buyers.map((b) => [b.id, b.name]));
  const canDelete = MANAGERS.includes(role);
  const money = (n: number) => f.money(n, farm.currency);

  const total = sales.reduce((s, x) => s + Number(x.amount), 0);
  const milkLitres = sales.filter((x) => x.product === "milk" && x.unit === "litre").reduce((s, x) => s + Number(x.quantity), 0);
  const eggs = sales.filter((x) => x.product === "eggs").reduce((s, x) => s + (eggCount(Number(x.quantity), x.unit) ?? 0), 0);
  const dues = buyers.reduce((s, b) => s + Math.max(0, Number(b.due)), 0);
  const owing = buyers.filter((b) => Number(b.due) > 0);

  return (
    <>
      <PageHeader
        title={t("sales.title")}
        description={t("sales.desc")}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/sales/new">+ {t("sales.newSale")}</ButtonLink>
            <ButtonLink href="/dashboard/sales/payment" variant="secondary">{t("sales.receivePayment")}</ButtonLink>
            <ButtonLink href="/dashboard/sales/buyers/new" variant="secondary">{t("sales.newBuyer")}</ButtonLink>
          </span>
        }
      />

      <form className="mb-4 flex items-end justify-end gap-2">
        <Input name="month" type="month" defaultValue={month} className="w-auto" aria-label={t("sales.month")} />
        <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.show")}</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("sales.salesMonth")} value={money(total)} tone="good" />
        {farm.has_dairy && <StatCard label={t("sales.milkSold")} value={t("common.litersShort", { n: f.number(milkLitres, 1) })} />}
        {farm.has_layer && <StatCard label={t("sales.eggsSold")} value={f.number(eggs)} />}
        <StatCard label={t("sales.duesTotal")} value={money(dues)} tone={dues > 0 ? "bad" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={t("sales.buyers")} description={owing.length ? t("sales.buyersOwe", { n: f.number(owing.length) }) : t("sales.buyersDesc")}>
          {buyers.length === 0 ? (
            <EmptyState title={t("sales.noBuyers")}>{t("sales.noBuyersBody")}</EmptyState>
          ) : (
            <Table head={[t("sales.buyer"), t("sales.lastSale"), t("sales.due")]}>
              {buyers.map((b) => (
                <ClickRow key={b.id} href={`/dashboard/sales/buyers/${b.id}`}>
                  <Td>
                    <Link href={`/dashboard/sales/buyers/${b.id}`} className="font-medium text-emerald-700 hover:underline">{b.name}</Link>
                    {b.phone && <span className="block text-xs text-stone-500">{b.phone}</span>}
                  </Td>
                  <Td>{b.last_sale ? f.date(b.last_sale) : "—"}</Td>
                  <Td className={`text-right font-medium tabular-nums ${Number(b.due) > 0 ? "text-amber-800" : "text-stone-500"}`}>
                    {Number(b.due) < 0 ? `${t("sales.advance")} ${money(-Number(b.due))}` : money(Number(b.due))}
                  </Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>

        <Card title={t("sales.recent")} description={t("sales.recentDesc")}>
          {sales.length === 0 ? (
            <EmptyState title={t("sales.noSalesMonth")} />
          ) : (
            <Table head={[t("common.date"), t("sales.entry"), t("sales.colAmount"), ""]}>
              {sales.map((s) => {
                const owed = Number(s.amount) - Number(s.paid_amount);
                return (
                  <tr key={s.id}>
                    <Td>{f.date(s.sale_date)}</Td>
                    <Td>
                      <Badge tone="blue">{t(`sales.productName.${s.product}`)}</Badge>{" "}
                      <span className="tabular-nums">{f.number(Number(s.quantity), 3)} {t(`sales.unitName.${s.unit}`)}</span>
                      <span className="block text-xs text-stone-500">
                        {s.buyer_id ? (
                          <Link href={`/dashboard/sales/buyers/${s.buyer_id}`} className="hover:underline">{buyerName.get(s.buyer_id) ?? "—"}</Link>
                        ) : (
                          t("sales.cash")
                        )}
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {money(Number(s.amount))}
                      {owed > 0 && <span className="block text-xs text-amber-800">{t("sales.owedShort", { amount: money(owed) })}</span>}
                    </Td>
                    <Td>
                      {canDelete && (
                        <ConfirmForm action={deleteSale} fields={{ id: s.id }} confirm={t("sales.confirmDeleteSale")} label={t("common.delete")} variant="ghost" />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      </div>
      <p className="mt-3 text-xs text-stone-500">{t("sales.financeNote")}</p>
    </>
  );
}
