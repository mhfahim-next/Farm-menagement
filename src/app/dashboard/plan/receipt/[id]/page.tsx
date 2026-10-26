import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PaymentMark } from "@/components/payment-mark";
import { PrintButton } from "@/components/print-button";
import { MANAGERS, requireRole } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { methodName, moneyText, receiptCode, type Payment } from "@/lib/payments";
import { planName } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("pay.receipt"), robots: { index: false, follow: false } };
}

export default async function ReceiptPage({ params }: PageProps<"/dashboard/plan/receipt/[id]">) {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t, f, locale } = await getI18n();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("payments").select("*").eq("id", id).eq("farm_id", farm.id).eq("status", "paid").maybeSingle();
  if (!data) notFound();
  const p = data as Payment;
  const [{ data: method }, plans] = await Promise.all([
    supabase.from("payment_methods").select("name_en, name_bn").eq("key", p.method).maybeSingle(),
    getPlans(),
  ]);

  const rows: [string, React.ReactNode][] = [
    [t("pay.r.farm"), farm.name],
    [t("pay.r.plan"), planName(plans.find((x) => x.key === p.plan), locale, p.plan)],
    [t("pay.r.period"), `${t(p.months === 1 ? "pay.months_one" : "pay.months", { n: p.months })} · ${f.date(p.period_start)} → ${f.date(p.period_end)}`],
    [t("pay.r.method"), methodName(method ?? undefined, locale, p.method)],
    ...(p.trx_id ? ([[t("pay.r.trx"), <span key="t" className="font-mono">{p.trx_id}</span>]] as [string, React.ReactNode][]) : []),
    ...(p.provider_payment_id ? ([[t("pay.r.ref"), <span key="r" className="break-all font-mono text-xs">{p.provider_payment_id}</span>]] as [string, React.ReactNode][]) : []),
    [t("pay.r.paidOn"), f.dateTime(p.paid_at)],
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/plan" className="text-sm font-medium text-stone-600 underline">
          ← {t("pay.back")}
        </Link>
        <PrintButton label={t("print.button")} />
      </div>
      <article className="mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-6 sm:p-8 print:border-0 print:p-0" data-testid="receipt">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <Logo />
            <p className="mt-1 text-xs text-stone-500">{SITE_URL.replace(/^https?:\/\//, "")}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-stone-900">{t("pay.receipt")}</p>
            <p className="font-mono text-sm text-stone-600">{receiptCode(p.receipt_no)}</p>
          </div>
        </header>
        <div className="my-5 flex items-center justify-between gap-3">
          <PaymentMark method={p.method} locale={locale} />
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">✓ {t("pay.status.paid")}</span>
        </div>
        <dl className="divide-y divide-stone-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-stone-500">{k}</dt>
              <dd className="text-right font-medium text-stone-900">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-3 text-base">
            <dt className="font-semibold text-stone-700">{t("pay.r.total")}</dt>
            <dd className="font-extrabold text-stone-900">{moneyText(f, Number(p.amount), p.currency)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-center text-xs text-stone-500">{t("pay.r.thanks", { site: SITE_NAME })}</p>
      </article>
    </>
  );
}
