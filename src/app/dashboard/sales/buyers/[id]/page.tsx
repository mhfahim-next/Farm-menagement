import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { BuyerFields } from "@/components/buyer-fields";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { statement, whatsappNumber, type Buyer, type Payment, type Sale } from "@/lib/trade";
import { deletePayment, deleteSale, updateBuyer } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("sales.buyer") };
}

export default async function BuyerPage({ params }: PageProps<"/dashboard/sales/buyers/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, farm, role } = await requireRole(STAFF);
  const i18n = await getI18n();
  const { t, f } = i18n;

  const [{ data: buyerRow }, { data: saleRows }, { data: payRows }] = await Promise.all([
    supabase.from("buyer_balances").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("sales").select("*").eq("buyer_id", id).eq("farm_id", farm.id).order("sale_date"),
    supabase.from("buyer_payments").select("*").eq("buyer_id", id).eq("farm_id", farm.id).order("pay_date"),
  ]);
  const buyer = buyerRow as Buyer | null;
  if (!buyer) notFound();
  const lines = statement((saleRows ?? []) as Sale[], (payRows ?? []) as Payment[]).reverse();
  const canDelete = MANAGERS.includes(role);
  const money = (n: number) => f.money(n, farm.currency);
  const due = Number(buyer.due);

  // A short statement to send on WhatsApp: balance plus the latest entries.
  const recent = lines.slice(0, 8).map((l) =>
    l.kind === "sale"
      ? `${f.date(l.date)}: ${t(`sales.productName.${l.sale.product}`)} ${f.number(Number(l.sale.quantity), 2)} ${t(`sales.unitName.${l.sale.unit}`)} = ${money(Number(l.sale.amount))}`
      : `${f.date(l.date)}: ${t("sales.paymentWord")} ${money(Number(l.payment.amount))}`,
  );
  const message = [
    t("sales.waHello", { name: buyer.name, farm: farm.name }),
    due > 0 ? t("sales.waDue", { amount: money(due) }) : due < 0 ? t("sales.waAdvance", { amount: money(-due) }) : t("sales.waClear"),
    "",
    ...recent,
  ].join("\n");
  const wa = whatsappNumber(buyer.phone);
  const waHref = `https://wa.me/${wa ?? ""}?text=${encodeURIComponent(message)}`;

  return (
    <>
      <PageHeader
        title={buyer.name}
        description={buyer.phone ?? undefined}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href={`/dashboard/sales/new?buyer=${buyer.id}`}>+ {t("sales.newSale")}</ButtonLink>
            <ButtonLink href={`/dashboard/sales/payment?buyer=${buyer.id}`} variant="secondary">{t("sales.receivePayment")}</ButtonLink>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 sm:py-2">
              {t("sales.sendWhatsapp")}
            </a>
            <ButtonLink href="/dashboard/sales" variant="secondary">{t("common.back")}</ButtonLink>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("sales.totalSales")} value={money(Number(buyer.total_sales))} />
        <StatCard label={t("sales.totalPaid")} value={money(Number(buyer.total_paid))} tone="good" />
        <StatCard
          label={due >= 0 ? t("sales.due") : t("sales.advance")}
          value={money(Math.abs(due))}
          tone={due > 0 ? "bad" : "good"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={t("sales.statement")} description={t("sales.statementDesc")}>
          {lines.length === 0 ? (
            <EmptyState title={t("sales.noSalesYet")} />
          ) : (
            <Table head={[t("common.date"), t("sales.entry"), t("sales.colAmount"), t("sales.colBalance"), ""]}>
              {lines.map((l) => (
                <tr key={`${l.kind}-${l.id}`}>
                  <Td>{f.date(l.date)}</Td>
                  <Td>
                    {l.kind === "sale" ? (
                      <>
                        <Badge tone="blue">{t(`sales.productName.${l.sale.product}`)}</Badge>{" "}
                        <span className="tabular-nums">
                          {f.number(Number(l.sale.quantity), 3)} {t(`sales.unitName.${l.sale.unit}`)}
                          {l.sale.unit_price !== null && ` × ${money(Number(l.sale.unit_price))}`}
                        </span>
                        {(l.sale.fat_percent !== null || l.sale.snf_percent !== null) && (
                          <span className="block text-xs text-stone-500">
                            {l.sale.fat_percent !== null && `${t("sales.fatShort")} ${f.number(Number(l.sale.fat_percent), 2)}%`}
                            {l.sale.snf_percent !== null && ` · ${t("sales.snfShort")} ${f.number(Number(l.sale.snf_percent), 2)}%`}
                          </span>
                        )}
                        {Number(l.sale.paid_amount) > 0 && (
                          <span className="block text-xs text-emerald-700">{t("sales.paidThen", { amount: money(Number(l.sale.paid_amount)) })}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge tone="green">{t("sales.paymentWord")}</Badge> {t(`sales.methodName.${l.payment.method}`)}
                      </>
                    )}
                    {(l.kind === "sale" ? l.sale.notes : l.payment.notes) && (
                      <span className="block text-xs text-stone-500">{l.kind === "sale" ? l.sale.notes : l.payment.notes}</span>
                    )}
                  </Td>
                  <Td className={`text-right tabular-nums ${l.kind === "sale" ? "" : "text-emerald-700"}`}>
                    {l.kind === "sale" ? money(Number(l.sale.amount)) : `−${money(Number(l.payment.amount))}`}
                  </Td>
                  <Td className={`text-right font-medium tabular-nums ${l.balance > 0 ? "text-amber-800" : "text-stone-700"}`}>{money(l.balance)}</Td>
                  <Td>
                    {canDelete && (
                      <ConfirmForm
                        action={l.kind === "sale" ? deleteSale : deletePayment}
                        fields={{ id: l.id }}
                        confirm={t(l.kind === "sale" ? "sales.confirmDeleteSale" : "sales.confirmDeletePayment")}
                        label={t("common.delete")}
                        variant="ghost"
                      />
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={t("sales.editBuyer")}>
          <ActionForm action={updateBuyer} submitLabel={t("common.save")}>
            <input type="hidden" name="id" value={buyer.id} />
            <BuyerFields i18n={i18n} buyer={buyer} currency={farm.currency} dairy={farm.has_dairy} layer={farm.has_layer} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="archived" defaultChecked={buyer.archived} className="accent-emerald-700" />
              {t("sales.archiveBuyer")}
            </label>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
