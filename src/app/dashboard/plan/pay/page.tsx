import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrencySwitch, PayCheckout, type CheckoutMethod, type CheckoutPeriod } from "@/components/pay-checkout";
import { EmptyState, PageHeader } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { readGeo } from "@/lib/geo";
import { getI18n } from "@/lib/i18n/server";
import { providerReady } from "@/lib/payment-providers";
import { methodInstructions, methodName, moneyText, pickCurrency, priceFor, type BillingPeriod, type PaymentMethod } from "@/lib/payments";
import { planName } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("pay.meta") };
}

export default async function PayPage({ searchParams }: PageProps<"/dashboard/plan/pay">) {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const plans = await getPlans();
  const plan = plans.find((p) => p.key === sp.plan && p.active && p.key !== "free" && p.price_monthly !== null);
  if (!plan) notFound();

  const currency = pickCurrency((await readGeo()).country, sp.cur);
  const other = currency === "BDT" ? "usd" : "bdt";
  const name = planName(plan, locale, plan.key);

  const [{ data: settings }, { data: periodRows }, { data: methodRows }, { data: pendingRow }] = await Promise.all([
    supabase.from("system_settings").select("payments_enabled").eq("id", 1).maybeSingle(),
    supabase.from("billing_periods").select("*").eq("active", true).order("months"),
    supabase.from("payment_methods").select("*").eq("active", true).order("sort_order"),
    supabase.from("payments").select("id").eq("farm_id", farm.id).eq("status", "pending").maybeSingle(),
  ]);

  const periods: CheckoutPeriod[] = ((periodRows ?? []) as BillingPeriod[]).flatMap((p) => {
    const amount = priceFor(plan, p.months, Number(p.discount_percent), currency);
    if (amount === null || amount <= 0) return [];
    return [
      {
        months: p.months,
        discount: Number(p.discount_percent),
        amount,
        amountText: moneyText(f, amount, currency),
        perMonthText: moneyText(f, currency === "USD" ? Math.round((amount / p.months) * 100) / 100 : Math.round(amount / p.months), currency),
      },
    ];
  });
  const methods: CheckoutMethod[] = ((methodRows ?? []) as PaymentMethod[])
    .filter((m) => m.currencies.includes(currency) && providerReady(m.kind))
    .map((m) => ({
      key: m.key,
      kind: m.kind,
      name: methodName(m, locale, m.key),
      accountNumber: m.account_number,
      accountName: m.account_name,
      accountType: m.account_type,
      instructions: methodInstructions(m, locale),
    }));

  const months = Number(sp.months) || 1;
  const blocked = !settings?.payments_enabled
    ? t("pay.offNote")
    : pendingRow
      ? t("pay.pendingNote")
      : periods.length === 0
        ? t("pay.noPrice", { currency })
        : methods.length === 0
          ? t("pay.noMethod", { currency })
          : null;

  return (
    <>
      <PageHeader
        title={t("pay.title", { plan: name })}
        description={t("pay.desc")}
        action={
          <Link href="/dashboard/plan" className="text-sm font-medium text-stone-600 underline">
            ← {t("pay.back")}
          </Link>
        }
      />
      <p className="mb-5 text-sm text-stone-600" data-testid="currency-note">
        {t(currency === "BDT" ? "pay.currencyBdt" : "pay.currencyUsd")}{" "}
        <CurrencySwitch currency={currency} href={`/dashboard/plan/pay?plan=${plan.key}&cur=${other}`} />
      </p>
      {blocked ? (
        <EmptyState title={blocked}>
          <Link href="/dashboard/plan" className="font-medium text-emerald-700 underline">
            {t("pay.back")}
          </Link>
        </EmptyState>
      ) : (
        <PayCheckout plan={plan.key} planName={name} currency={currency} periods={periods} methods={methods} initialMonths={months} />
      )}
    </>
  );
}
