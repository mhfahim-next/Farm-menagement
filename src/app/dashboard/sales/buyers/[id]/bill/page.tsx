import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { requireRole, STAFF } from "@/lib/auth";
import { addMonths, monthBill, monthBounds } from "@/lib/bill";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import { whatsappNumber, type Buyer, type Payment, type Sale } from "@/lib/trade";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("bill.title"), robots: { index: false, follow: false } };
}

/** A buyer's bill for one month: owed at the start, each sale and payment, owed at the end. */
export default async function BuyerBillPage({ params, searchParams }: PageProps<"/dashboard/sales/buyers/[id]/bill">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sp = await searchParams;
  const month = typeof sp.month === "string" && monthBounds(sp.month) ? sp.month : today().slice(0, 7);
  const { to } = monthBounds(month)!;
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f } = await getI18n();
  // Everything up to the month's end: earlier entries give the opening balance.
  const [{ data: buyerRow }, { data: saleRows }, { data: payRows }] = await Promise.all([
    supabase.from("buyer_balances").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("sales").select("*").eq("buyer_id", id).eq("farm_id", farm.id).lte("sale_date", to).order("sale_date").limit(10000),
    supabase.from("buyer_payments").select("*").eq("buyer_id", id).eq("farm_id", farm.id).lte("pay_date", to).order("pay_date").limit(10000),
  ]);
  const buyer = buyerRow as Buyer | null;
  if (!buyer) notFound();
  const bill = monthBill((saleRows ?? []) as Sale[], (payRows ?? []) as Payment[], month)!;
  const money = (n: number) => f.money(n, farm.currency);
  const monthName = f.month(`${month}-01`);
  const productLine = (p: (typeof bill.products)[number]) => `${t(`sales.productName.${p.product}` as "sales.productName.milk")}: ${f.number(p.quantity, 2)} ${t(`sales.unitName.${p.unit}` as "sales.unitName.litre")} = ${money(p.amount)}`;
  const due = (n: number) => (n >= 0 ? money(n) : `${money(-n)} (${t("sales.advance")})`);

  const text = [
    t("bill.waBill", { name: buyer.name, farm: farm.name, month: monthName }),
    ...bill.products.map(productLine),
    `${t("bill.opening")}: ${due(bill.opening)}`,
    `${t("bill.monthSales")}: ${money(bill.totalSales)}`,
    `${t("bill.monthPaid")}: ${money(bill.paid)}`,
    `${t("bill.closing")}: ${due(bill.closing)}`,
  ].join("\n");
  const wa = whatsappNumber(buyer.phone);
  const nav = (m: string) => `/dashboard/sales/buyers/${buyer.id}/bill?month=${m}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/sales/buyers/${buyer.id}`} className="text-sm font-medium text-stone-600 underline">
          ← {buyer.name}
        </Link>
        <span className="flex flex-wrap items-center gap-2">
          <Link href={nav(addMonths(month, -1))} className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50" data-testid="bill-prev">
            ← {t("bill.prev")}
          </Link>
          <Link href={nav(addMonths(month, 1))} className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50" data-testid="bill-next">
            {t("bill.next")} →
          </Link>
          <a href={`https://wa.me/${wa ?? ""}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50" data-testid="bill-whatsapp">
            {t("sales.sendWhatsapp")}
          </a>
          <PrintButton label={t("print.button")} />
        </span>
      </div>
      <article className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-6 text-stone-900 sm:p-8 print:border-0 print:p-0" data-testid="bill">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xl font-bold">{farm.name}</p>
            {farm.location && <p className="text-sm text-stone-600">{farm.location}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{t("bill.title")}</p>
            <p className="text-sm text-stone-600" data-testid="bill-month">
              {monthName}
            </p>
          </div>
        </header>
        <p className="mt-4 text-sm">
          <span className="text-stone-500">{t("bill.to")}: </span>
          <span className="font-medium">
            {buyer.name}
            {buyer.phone ? ` · ${buyer.phone}` : ""}
          </span>
        </p>

        {bill.products.length > 0 && (
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm">
            {bill.products.map((p) => (
              <p key={`${p.product}-${p.unit}`}>{productLine(p)}</p>
            ))}
          </div>
        )}

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 font-medium">{t("common.date")}</th>
              <th className="py-2 font-medium">{t("bill.item")}</th>
              <th className="py-2 text-right font-medium">{t("bill.amount")}</th>
              <th className="py-2 text-right font-medium">{t("sales.colBalance")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100 text-stone-600">
              <td className="py-1.5">{f.date(bill.from)}</td>
              <td className="py-1.5">{t("bill.opening")}</td>
              <td />
              <td className="py-1.5 text-right tabular-nums">{money(bill.opening)}</td>
            </tr>
            {bill.lines.map((l, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-1.5 whitespace-nowrap">{f.date(l.date)}</td>
                <td className="py-1.5">
                  {l.kind === "sale" ? (
                    <>
                      {t(`sales.productName.${l.sale.product}` as "sales.productName.milk")} {f.number(Number(l.sale.quantity), 3)} {t(`sales.unitName.${l.sale.unit}` as "sales.unitName.litre")}
                      {l.sale.unit_price !== null && l.sale.unit_price !== undefined && ` × ${money(Number(l.sale.unit_price))}`}
                      {Number(l.sale.paid_amount) > 0 && <span className="block text-xs text-emerald-700">{t("sales.paidThen", { amount: money(Number(l.sale.paid_amount)) })}</span>}
                    </>
                  ) : (
                    <span className="text-emerald-700">
                      {t("sales.paymentWord")} · {t(`sales.methodName.${l.payment.method}` as "sales.methodName.cash")}
                    </span>
                  )}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${l.kind === "payment" ? "text-emerald-700" : ""}`}>{l.kind === "sale" ? money(Number(l.sale.amount)) : `−${money(Number(l.payment.amount))}`}</td>
                <td className="py-1.5 text-right tabular-nums">{money(l.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bill.lines.length === 0 && <p className="py-3 text-sm text-stone-500">{t("bill.nothing")}</p>}

        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">{t("bill.opening")}</dt>
            <dd className="tabular-nums">{due(bill.opening)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">{t("bill.monthSales")}</dt>
            <dd className="tabular-nums" data-testid="bill-sales">
              {money(bill.totalSales)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">{t("bill.monthPaid")}</dt>
            <dd className="tabular-nums text-emerald-700" data-testid="bill-paid">
              {money(bill.paid)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between gap-4 border-t border-stone-200 pt-2 text-base">
            <dt className="font-semibold">{t("bill.closing")}</dt>
            <dd className="font-extrabold tabular-nums" data-testid="bill-closing">
              {due(bill.closing)}
            </dd>
          </div>
        </dl>
        <footer className="mt-8 flex items-end justify-between gap-4 text-xs text-stone-500">
          <span>{t("bill.thanks")}</span>
          <span className="flex flex-col items-end gap-1">
            <Logo />
            {SITE_URL.replace(/^https?:\/\//, "")}
          </span>
        </footer>
      </article>
    </>
  );
}
