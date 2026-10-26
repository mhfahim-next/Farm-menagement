"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { payManual, payOnline } from "@/app/dashboard/plan/pay/actions";
import type { Currency, MethodKind } from "@/lib/payments";
import { styleOf } from "@/lib/payments";
import type { ActionState } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { PaymentMark } from "./payment-mark";
import { useToast } from "./toast";
import { Spinner } from "./ui";

export type CheckoutPeriod = { months: number; discount: number; amount: number; amountText: string; perMonthText: string };
export type CheckoutMethod = {
  key: string;
  kind: MethodKind;
  name: string;
  accountNumber: string | null;
  accountName: string | null;
  accountType: string | null;
  instructions: string | null;
};

export function PayCheckout({
  plan,
  planName,
  currency,
  periods,
  methods,
  initialMonths,
}: {
  plan: string;
  planName: string;
  currency: Currency;
  periods: CheckoutPeriod[];
  methods: CheckoutMethod[];
  initialMonths: number;
}) {
  const { t, locale } = useI18n();
  const [months, setMonths] = useState(periods.some((p) => p.months === initialMonths) ? initialMonths : periods[0].months);
  const [methodKey, setMethodKey] = useState<string | null>(methods.length === 1 ? methods[0].key : null);
  const period = periods.find((p) => p.months === months) ?? periods[0];
  const method = methods.find((m) => m.key === methodKey) ?? null;

  return (
    <div className="grid max-w-3xl gap-6">
      <section>
        <h2 className="mb-3 font-semibold text-stone-900">1. {t("pay.choosePeriod")}</h2>
        <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {periods.map((p) => (
            <button
              key={p.months}
              type="button"
              role="radio"
              aria-checked={p.months === months}
              onClick={() => setMonths(p.months)}
              data-testid={`period-${p.months}`}
              className={`relative rounded-xl border bg-white p-3 text-left transition ${p.months === months ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-stone-200 hover:border-stone-300"}`}
            >
              {p.discount > 0 && (
                <span className="absolute -top-2 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                  {t("pay.save", { n: p.discount })}
                </span>
              )}
              <span className="block text-sm font-medium text-stone-600">{t(p.months === 1 ? "pay.months_one" : "pay.months", { n: p.months })}</span>
              <span className="mt-1 block text-lg font-bold text-stone-900">{p.amountText}</span>
              {p.months > 1 && <span className="block text-xs text-stone-500">{t("pay.perMonthEq", { amount: p.perMonthText })}</span>}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-stone-900">2. {t("pay.chooseMethod")}</h2>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {methods.map((m) => {
            const s = styleOf(m.key);
            const on = m.key === methodKey;
            return (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMethodKey(m.key)}
                data-testid={`method-${m.key}`}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-stone-300"
                style={on ? { borderColor: s.ring, boxShadow: `0 0 0 3px ${s.ring}33`, background: s.soft } : undefined}
              >
                <PaymentMark method={m.key} locale={locale} />
                <span className="min-w-0">
                  <span className="block font-semibold text-stone-900">{m.name}</span>
                  <span className="block text-xs text-stone-500">{m.kind === "manual" ? t("pay.kind.manual") : t("pay.kind.online")}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {method && (
        <section>
          <h2 className="mb-3 font-semibold text-stone-900">3. {t("pay.payTitle")}</h2>
          {method.kind === "manual" ? (
            <ManualPanel key={method.key} method={method} plan={plan} planName={planName} currency={currency} period={period} />
          ) : (
            <OnlinePanel key={method.key} method={method} plan={plan} currency={currency} period={period} />
          )}
        </section>
      )}
    </div>
  );
}

function Hidden({ plan, months, currency, method }: { plan: string; months: number; currency: Currency; method: string }) {
  return (
    <>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="months" value={months} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="method" value={method} />
    </>
  );
}

function BrandHeader({ method, children }: { method: CheckoutMethod; children: React.ReactNode }) {
  const { locale } = useI18n();
  const s = styleOf(method.key);
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: s.bg, color: s.fg }}>
      <span className="text-2xl font-extrabold tracking-tight">{locale === "bn" && s.wordBn ? s.wordBn : s.word}</span>
      <span className="text-right text-sm font-semibold opacity-95">{children}</span>
    </div>
  );
}

function useFormAction(action: (s: ActionState, fd: FormData) => Promise<ActionState>, onSuccess?: () => void) {
  const { toast } = useToast();
  return useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res?.error) toast("error", res.error);
    if (res?.success) {
      toast("success", res.success);
      onSuccess?.();
    }
    return res;
  }, null);
}

function ManualPanel({
  method,
  plan,
  planName,
  currency,
  period,
}: {
  method: CheckoutMethod;
  plan: string;
  planName: string;
  currency: Currency;
  period: CheckoutPeriod;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const s = styleOf(method.key);
  const [copied, setCopied] = useState(false);
  const [state, dispatch, pending] = useFormAction(payManual, () => router.push("/dashboard/plan?pay=sent"));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(method.accountNumber ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the number is on screen anyway
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: s.ring }} data-testid="manual-panel">
      <BrandHeader method={method}>{t("pay.sendMoney")}</BrandHeader>
      <div className="grid gap-4 p-5" style={{ background: s.soft }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{t("pay.amount")}</p>
            <p className="mt-1 text-2xl font-extrabold" style={{ color: s.ring }} data-testid="pay-amount">
              {period.amountText}
            </p>
            <p className="text-xs text-stone-500">
              {planName} · {t(period.months === 1 ? "pay.months_one" : "pay.months", { n: period.months })}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {method.key === "bank" ? t("pay.accountNo") : t("pay.number")}
              {method.accountType && <span className="normal-case"> · {method.accountType}</span>}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="break-all font-mono text-xl font-bold text-stone-900" data-testid="pay-number">
                {method.accountNumber}
              </p>
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold"
                style={{ background: s.ring, color: "#fff" }}
              >
                {copied ? t("pay.copied") : t("pay.copy")}
              </button>
            </div>
            {method.accountName && <p className="text-xs text-stone-500">{method.accountName}</p>}
          </div>
        </div>

        {method.instructions && (
          <ol className="grid gap-1.5 rounded-xl bg-white p-4 text-sm text-stone-700">
            {method.instructions
              .split("\n")
              .filter((l) => l.trim())
              .map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: s.ring }}>
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
          </ol>
        )}

        <form
          className="grid gap-3 rounded-xl bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => dispatch(fd));
          }}
        >
          <Hidden plan={plan} months={period.months} currency={currency} method={method.key} />
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-stone-800">{t("pay.trxLabel")}</span>
            <input
              name="trx_id"
              required
              minLength={4}
              maxLength={40}
              pattern="[A-Za-z0-9\- ]{4,40}"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={method.key === "bank" ? "REF-123456" : "8N7A6B5C4D"}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-mono text-lg uppercase tracking-wider text-stone-900 outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: s.ring }}
              data-testid="trx-input"
            />
            <span className="text-xs text-stone-500">{t("pay.trxHint")}</span>
          </label>
          {!pending && state?.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-base font-bold shadow-sm transition hover:opacity-95 disabled:opacity-60"
            style={{ background: s.bg, color: s.fg }}
            data-testid="pay-submit"
          >
            {pending && <Spinner className="mr-2" />}
            {t("pay.submitTrx")}
          </button>
          <p className="text-xs text-stone-500">{t("pay.reviewNote")}</p>
        </form>
      </div>
    </div>
  );
}

function OnlinePanel({ method, plan, currency, period }: { method: CheckoutMethod; plan: string; currency: Currency; period: CheckoutPeriod }) {
  const { t } = useI18n();
  const s = styleOf(method.key);
  const [state, dispatch, pending] = useFormAction(payOnline);
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: s.ring }} data-testid="online-panel">
      <BrandHeader method={method}>{t("pay.securePay")}</BrandHeader>
      <form
        className="grid gap-4 p-5"
        style={{ background: s.soft }}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => dispatch(fd));
        }}
      >
        <Hidden plan={plan} months={period.months} currency={currency} method={method.key} />
        {method.instructions && <p className="whitespace-pre-line text-sm text-stone-700">{method.instructions}</p>}
        {!pending && state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-base font-bold shadow-sm transition hover:opacity-95 disabled:opacity-60"
          style={{ background: s.bg, color: s.fg }}
          data-testid="pay-online"
        >
          {pending && <Spinner className="mr-2" />}
          {t("pay.payWith", { amount: period.amountText, method: method.name })}
        </button>
        <p className="text-xs text-stone-500">{t("pay.onlineNote")}</p>
      </form>
    </div>
  );
}

export function CurrencySwitch({ currency, href }: { currency: Currency; href: string }) {
  const { t } = useI18n();
  return (
    <Link href={href} className="font-medium text-emerald-700 underline" data-testid="currency-switch">
      {currency === "BDT" ? t("pay.switchUsd") : t("pay.switchBdt")}
    </Link>
  );
}
