import type { Metadata } from "next";
import Link from "@/components/local-link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { requireRole, READERS } from "@/lib/auth";
import { memoNo } from "@/lib/bill";
import { getI18n } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import { whatsappNumber, type Buyer, type Sale } from "@/lib/trade";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("bill.memo"), robots: { index: false, follow: false } };
}

/** A cash memo for one sale, to print, save as PDF or send on WhatsApp. */
export default async function SaleMemoPage({ params }: PageProps<"/dashboard/sales/memo/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, farm } = await requireRole(READERS);
  const { t, f } = await getI18n();
  const { data } = await supabase.from("sales").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  const sale = data as Sale | null;
  if (!sale) notFound();
  const { data: buyerRow } = sale.buyer_id ? await supabase.from("buyer_balances").select("*").eq("id", sale.buyer_id).eq("farm_id", farm.id).maybeSingle() : { data: null };
  const buyer = buyerRow as Buyer | null;
  const money = (n: number) => f.money(n, farm.currency);
  const amount = Number(sale.amount);
  const paid = Number(sale.paid_amount);
  const no = memoNo(sale.id);
  const item = `${t(`sales.productName.${sale.product}`)}: ${f.number(Number(sale.quantity), 3)} ${t(`sales.unitName.${sale.unit}`)}${sale.unit_price !== null ? ` × ${money(Number(sale.unit_price))}` : ""}`;
  const quality = [sale.fat_percent !== null && `${t("sales.fatShort")} ${f.number(Number(sale.fat_percent), 2)}%`, sale.snf_percent !== null && `${t("sales.snfShort")} ${f.number(Number(sale.snf_percent), 2)}%`].filter(Boolean).join(" · ");

  const text = [
    t("bill.waMemo", { farm: farm.name, no, date: f.date(sale.sale_date) }),
    item,
    `${t("bill.total")}: ${money(amount)}`,
    `${t("bill.paidNow")}: ${money(paid)}`,
    ...(amount - paid > 0 ? [`${t("bill.dueThis")}: ${money(amount - paid)}`] : []),
    ...(buyer && Number(buyer.due) > 0 ? [t("bill.waTotalDue", { amount: money(Number(buyer.due)) })] : []),
  ].join("\n");
  const wa = whatsappNumber(buyer?.phone ?? null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={buyer ? `/dashboard/sales/buyers/${buyer.id}` : "/dashboard/sales"} className="text-sm font-medium text-stone-600 underline">
          ← {t("common.back")}
        </Link>
        <span className="flex flex-wrap gap-2">
          <a href={`https://wa.me/${wa ?? ""}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50" data-testid="memo-whatsapp">
            {t("sales.sendWhatsapp")}
          </a>
          <PrintButton label={t("print.button")} />
        </span>
      </div>
      <article className="mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-6 text-stone-900 sm:p-8 print:border-0 print:p-0" data-testid="memo">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xl font-bold">{farm.name}</p>
            {farm.location && <p className="text-sm text-stone-600">{farm.location}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{t("bill.memo")}</p>
            <p className="font-mono text-sm text-stone-600" data-testid="memo-no">
              {no}
            </p>
            <p className="text-sm text-stone-600">{f.date(sale.sale_date)}</p>
          </div>
        </header>
        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">{t("bill.to")}</dt>
            <dd className="text-right font-medium">{buyer ? `${buyer.name}${buyer.phone ? ` · ${buyer.phone}` : ""}` : t("bill.cashBuyer")}</dd>
          </div>
        </dl>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 font-medium">{t("bill.item")}</th>
              <th className="py-2 text-right font-medium">{t("bill.amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="py-2">
                {item}
                {quality && <span className="block text-xs text-stone-500">{quality}</span>}
                {sale.notes && <span className="block text-xs text-stone-500">{sale.notes}</span>}
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">{money(amount)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="mt-3 grid gap-1 text-sm">
          <div className="flex justify-between gap-4 text-base">
            <dt className="font-semibold">{t("bill.total")}</dt>
            <dd className="font-extrabold tabular-nums" data-testid="memo-total">
              {money(amount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">{t("bill.paidNow")}</dt>
            <dd className="tabular-nums">{money(paid)}</dd>
          </div>
          {amount - paid > 0 && (
            <div className="flex justify-between gap-4 text-amber-800">
              <dt>{t("bill.dueThis")}</dt>
              <dd className="font-semibold tabular-nums">{money(amount - paid)}</dd>
            </div>
          )}
          {buyer && (
            <div className="mt-2 flex justify-between gap-4 border-t border-stone-200 pt-2">
              <dt className="text-stone-500">{Number(buyer.due) >= 0 ? t("bill.totalDue") : t("sales.advance")}</dt>
              <dd className="font-semibold tabular-nums" data-testid="memo-buyer-due">
                {money(Math.abs(Number(buyer.due)))}
              </dd>
            </div>
          )}
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
