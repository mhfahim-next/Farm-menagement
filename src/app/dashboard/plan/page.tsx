import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { UsageMeter } from "@/components/usage-meter";
import { PaymentMark } from "@/components/payment-mark";
import { Badge, ButtonLink, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { readGeo } from "@/lib/geo";
import { getI18n } from "@/lib/i18n/server";
import { daysUntil, methodName, moneyText, pickCurrency, receiptCode, STATUS_TONE, type Currency, type Payment, type PaymentMethod } from "@/lib/payments";
import { farmQuota, limitState, planFeatures, planName, priceText, USAGE_KEYS, type Plan } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { cancelRequest, requestUpgrade, sendSupport } from "./actions";
import { cancelPayment } from "./pay/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("plan.meta") };
}

type RequestRow = {
  id: string;
  kind: "upgrade" | "support";
  plan_requested: string | null;
  subject: string | null;
  message: string | null;
  priority: boolean;
  status: "open" | "approved" | "rejected" | "resolved";
  admin_reply: string | null;
  created_at: string;
};

const statusTone = { open: "amber", approved: "green", rejected: "red", resolved: "blue" } as const;

export default async function PlanPage({ searchParams }: PageProps<"/dashboard/plan">) {
  const { supabase, farm, farms } = await requireRole(MANAGERS);
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const { plans, plan, usage, limits, states } = await getPlanContext();
  const { data: aiRaw } = await supabase.rpc("ai_prompts_status", { p_farm: farm.id });
  const ai = { used: (aiRaw as { used?: number } | null)?.used ?? 0, max: (aiRaw as { max?: number | null } | null)?.max ?? null };
  const sp = await searchParams;
  const highlight = typeof sp.choose === "string" ? sp.choose : null;

  const currency = pickCurrency((await readGeo()).country, sp.cur);
  const PAY_RESULTS = ["paid", "sent", "processing", "failed", "cancelled"] as const;
  const payResult = PAY_RESULTS.find((x) => x === sp.pay) ?? null;

  const [{ data: reqData }, { data: settings }, { data: payData }, { data: methodRows }] = await Promise.all([
    supabase.from("requests").select("*").eq("farm_id", farm.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("system_settings").select("payments_enabled").eq("id", 1).maybeSingle(),
    supabase.from("payments").select("*").eq("farm_id", farm.id).neq("status", "awaiting").order("created_at", { ascending: false }).limit(20),
    supabase.from("payment_methods").select("key, name_en, name_bn"),
  ]);
  const requests = (reqData ?? []) as RequestRow[];
  const pending = requests.find((r) => r.kind === "upgrade" && r.status === "open");
  const payments = (payData ?? []) as Payment[];
  const pendingPayment = payments.find((p) => p.status === "pending");
  const methodsByKey = new Map(((methodRows ?? []) as Pick<PaymentMethod, "key" | "name_en" | "name_bn">[]).map((m) => [m.key, m]));
  const paymentsOn = Boolean(settings?.payments_enabled);
  const expiresAt = farm.plan !== "free" ? (farm.plan_expires_at ?? null) : null;
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null;

  const nameOf = (key: string | null) => planName(plans.find((p) => p.key === key), locale, key ?? "");
  const visible = plans.filter((p) => p.active || p.key === farm.plan);
  const owned = farms.filter((x) => x.role === "owner");
  const quota = farmQuota(plans, owned.map((x) => x.plan));

  return (
    <>
      <PageHeader title={t("plan.title")} description={t("plan.desc")} />
      {payResult && (
        <p
          role="status"
          data-testid="pay-result"
          className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${payResult === "paid" ? "bg-emerald-50 text-emerald-800" : payResult === "sent" || payResult === "processing" ? "bg-sky-50 text-sky-800" : "bg-red-50 text-red-700"}`}
        >
          {t(`pay.result.${payResult}`)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={t("plan.currentTitle", { plan: nameOf(farm.plan) })} description={priceText(i18n, plan, currency) + " · " + (plan.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth"))}>
          {expiresAt && daysLeft !== null && (
            <div
              data-testid="plan-expiry"
              className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${daysLeft < 0 ? "bg-red-50 text-red-700" : daysLeft <= 7 ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
            >
              <span>
                {daysLeft < 0
                  ? t("pay.expired", { date: f.date(expiresAt) })
                  : daysLeft <= 7
                    ? t("pay.endsSoon", { date: f.date(expiresAt), n: daysLeft })
                    : t("pay.paidUntil", { date: f.date(expiresAt) })}
              </span>
              {paymentsOn && daysLeft <= 7 && plan.price_monthly !== null && (
                <Link href={`/dashboard/plan/pay?plan=${farm.plan}`} className="font-semibold underline">
                  {t("pay.renew")}
                </Link>
              )}
            </div>
          )}
          <h3 className="mb-3 text-sm font-semibold text-stone-700">{t("plan.usageTitle")}</h3>
          <div className="grid gap-4">
            {USAGE_KEYS.map((k) => (
              <UsageMeter
                key={k}
                label={t(`plan.usage.${k}`)}
                used={usage[k]}
                max={limits[k]}
                state={k === "members" && states[k] === "full" ? "ok" : states[k]}
                text={limits[k] === null ? t("plan.usageUnlimited", { used: usage[k] }) : t("plan.usageOf", { used: usage[k], max: limits[k]! })}
              />
            ))}
            <UsageMeter
              label={t("plan.usage.ai")}
              used={ai.used}
              max={ai.max}
              state={limitState(ai.used, ai.max)}
              text={ai.max === null ? t("plan.usageUnlimited", { used: ai.used }) : t("plan.usageOf", { used: ai.used, max: ai.max })}
            />
            <UsageMeter
              label={t("plan.usage.farms")}
              used={owned.length}
              max={quota.cap}
              state="ok"
              text={quota.cap === null ? t("plan.usageUnlimited", { used: owned.length }) : t("plan.usageOf", { used: owned.length, max: quota.cap })}
            />
          </div>
          {USAGE_KEYS.filter((k) => states[k] === "over").map((k) => (
            <p key={k} className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {t(`plan.over.${k}`, { used: usage[k], max: limits[k] ?? 0, plan: nameOf(farm.plan) })}
            </p>
          ))}
          <p className="mt-4 text-xs text-stone-500">{t("plan.vetNote")}</p>
        </Card>

        <div className="grid content-start gap-6">
          <Card title={t("pay.historyTitle")} description={paymentsOn ? t("pay.historyDesc") : t("pay.offNote")}>
            {payments.length === 0 ? (
              <p className="text-sm text-stone-500">{t("pay.historyEmpty")}</p>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm" data-testid="payment-history">
                {payments.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <PaymentMark method={p.method} size="sm" locale={locale} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-stone-900">
                        {nameOf(p.plan)} · {t(p.months === 1 ? "pay.months_one" : "pay.months", { n: p.months })} · {moneyText(f, Number(p.amount), p.currency)}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {f.date(p.created_at)} · {methodName(methodsByKey.get(p.method), locale, p.method)}
                        {p.trx_id && <> · TrxID <span className="font-mono">{p.trx_id}</span></>}
                      </span>
                      {p.admin_note && p.status !== "paid" && <span className="block text-xs text-red-700">{p.admin_note}</span>}
                    </span>
                    <Badge tone={STATUS_TONE[p.status]}>{t(`pay.status.${p.status}`)}</Badge>
                    {p.status === "paid" && (
                      <Link href={`/dashboard/plan/receipt/${p.id}`} className="text-xs font-medium text-emerald-700 underline">
                        {receiptCode(p.receipt_no)}
                      </Link>
                    )}
                    {p.status === "pending" && <ConfirmForm action={cancelPayment} fields={{ id: p.id }} label={t("pay.cancel")} confirm={t("pay.cancelConfirm")} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={t("plan.supportTitle")}
            description={plan.priority_support ? t("plan.supportPriority") : t("plan.supportStandard")}
          >
            <ActionForm action={sendSupport} submitLabel={t("plan.supportSend")}>
              <Field label={t("plan.supportSubject")}>
                <Input name="subject" maxLength={120} />
              </Field>
              <Field label={t("plan.supportMessage")}>
                <Textarea name="message" rows={3} maxLength={2000} required />
              </Field>
            </ActionForm>
          </Card>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">{t("plan.plansTitle")}</h2>
      {pendingPayment && (
        <div data-testid="pending-payment" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("pay.pendingBanner", {
            plan: nameOf(pendingPayment.plan),
            amount: moneyText(f, Number(pendingPayment.amount), pendingPayment.currency),
            trx: pendingPayment.trx_id ?? "",
          })}
        </div>
      )}
      {pending && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{t("plan.requestPending", { plan: nameOf(pending.plan_requested), date: f.date(pending.created_at) })}</span>
          <ConfirmForm action={cancelRequest} fields={{ id: pending.id }} label={t("plan.requestCancel")} />
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {visible.map((p) => (
          <PlanCard
            key={p.key}
            i18n={i18n}
            p={p}
            name={planName(p, locale, p.key)}
            current={p.key === farm.plan}
            highlight={highlight === p.key}
            higher={p.sort_order > plan.sort_order}
            pending={Boolean(pending)}
            t={t}
            currency={currency}
            canPay={paymentsOn && !pendingPayment}
          />
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">{t("plan.historyTitle")}</h2>
      {requests.length === 0 ? (
        <EmptyState title={t("plan.historyEmpty")} />
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-stone-900">
                  {r.kind === "upgrade" ? t("plan.kind.upgrade", { plan: nameOf(r.plan_requested) }) : r.subject || t("plan.kind.support")}
                </span>
                <span className="flex items-center gap-2">
                  {r.priority && <Badge tone="blue">{t("plan.priorityBadge")}</Badge>}
                  <Badge tone={statusTone[r.status]}>{t(`plan.status.${r.status}`)}</Badge>
                  <span className="text-xs text-stone-500">{f.date(r.created_at)}</span>
                </span>
              </div>
              {r.message && <p className="mt-2 whitespace-pre-line text-stone-600">{r.message}</p>}
              {r.admin_reply && (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                  <strong>{t("plan.adminReply")}:</strong> {r.admin_reply}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PlanCard({
  i18n,
  p,
  name,
  current,
  highlight,
  higher,
  pending,
  t,
  currency,
  canPay,
}: {
  i18n: Awaited<ReturnType<typeof getI18n>>;
  p: Plan;
  name: string;
  current: boolean;
  highlight: boolean;
  higher: boolean;
  pending: boolean;
  t: Awaited<ReturnType<typeof getI18n>>["t"];
  currency: Currency;
  canPay: boolean;
}) {
  // Priced plans are bought here; "contact us" plans (no price) still go through a request.
  const buyable = canPay && p.key !== "free" && p.price_monthly !== null && p.price_monthly > 0;
  return (
    <div
      data-testid={`plan-card-${p.key}`}
      className={`rounded-xl border bg-white p-6 ${
        current ? "border-emerald-600 ring-2 ring-emerald-600/20" : highlight ? "border-sky-500 ring-2 ring-sky-500/20" : "border-stone-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{name}</h3>
        {current && <Badge tone="green">{t("plans.current")}</Badge>}
      </div>
      <p className="mt-2 text-3xl font-bold">{priceText(i18n, p, currency)}</p>
      <p className="text-xs text-stone-500">{p.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth")}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
        {planFeatures(t, p).map((x) => (
          <li key={x}>✓ {x}</li>
        ))}
      </ul>
      {buyable && (higher || current) && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <ButtonLink href={`/dashboard/plan/pay?plan=${p.key}`} variant={current ? "secondary" : "primary"} className="w-full" data-testid={`buy-${p.key}`}>
            {current ? t("pay.renew") : t("pay.upgradeTo", { plan: name })}
          </ButtonLink>
        </div>
      )}
      {!buyable && higher && !pending && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <ActionForm action={requestUpgrade} submitLabel={p.price_monthly === null ? t("plans.contactUs") : t("plan.requestSend", { plan: name })} fullWidthSubmit className="grid gap-3">
            <input type="hidden" name="plan" value={p.key} />
            <Field label={t("plan.requestNote")}>
              <Textarea name="message" rows={2} maxLength={500} placeholder={t("plan.requestNotePlaceholder")} />
            </Field>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
