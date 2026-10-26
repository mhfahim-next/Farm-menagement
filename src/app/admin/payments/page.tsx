import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PaymentMark } from "@/components/payment-mark";
import { PaymentReviewer } from "@/components/payment-reviewer";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { providerStatus } from "@/lib/payment-providers";
import { daysUntil, isoInDays, methodName, moneyText, receiptCode, STATUS_TONE, type BillingPeriod, type Payment, type PaymentMethod } from "@/lib/payments";
import { planName } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { SITE_URL } from "@/lib/site";
import { deletePeriod, planExpiry, saveMethod, savePeriod, setPaymentsEnabled } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("adminpay.title") };
}

const TABS = ["pending", "expiring", "all", "settings"] as const;
type Tab = (typeof TABS)[number];

type FarmRow = { id: string; name: string; plan: string; plan_expires_at: string | null; owner_id: string };

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "pending";
  const plans = await getPlans();
  const nameOf = (key: string | null) => planName(plans.find((p) => p.key === key), locale, key ?? "");

  const soon = isoInDays(7);
  const now = isoInDays(0);
  const [{ data: methodRows }, { count: pendingCount }, { data: expRows }, { data: settings }] = await Promise.all([
    supabase.from("payment_methods").select("*").order("sort_order"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("farms").select("id, name, plan, plan_expires_at, owner_id").neq("plan", "free").not("plan_expires_at", "is", null).lt("plan_expires_at", soon).order("plan_expires_at"),
    supabase.from("system_settings").select("payments_enabled").eq("id", 1).maybeSingle(),
  ]);
  const methods = (methodRows ?? []) as PaymentMethod[];
  const methodByKey = new Map(methods.map((m) => [m.key, m]));
  const expiring = (expRows ?? []) as FarmRow[];
  const expiredCount = expiring.filter((x) => x.plan_expires_at && x.plan_expires_at < now).length;

  let payments: Payment[] = [];
  if (tab === "pending" || tab === "all") {
    let q = supabase.from("payments").select("*").order("created_at", { ascending: tab === "pending" }).limit(200);
    q = tab === "pending" ? q.eq("status", "pending") : q;
    payments = ((await q).data ?? []) as Payment[];
  }
  const farmIds = [...new Set(payments.map((p) => p.farm_id))];
  const peopleIds = [...new Set([...payments.map((p) => p.created_by), ...expiring.map((x) => x.owner_id)].filter(Boolean) as string[])];
  const [{ data: farmRows }, { data: people }] = await Promise.all([
    farmIds.length ? supabase.from("farms").select("id, name, plan, plan_expires_at").in("id", farmIds) : Promise.resolve({ data: [] }),
    peopleIds.length ? supabase.from("profiles").select("id, full_name, phone").in("id", peopleIds) : Promise.resolve({ data: [] }),
  ]);
  const farmById = new Map(((farmRows ?? []) as FarmRow[]).map((x) => [x.id, x]));
  const personById = new Map(((people ?? []) as { id: string; full_name: string | null; phone: string | null }[]).map((p) => [p.id, p]));

  const tabLabel: Record<Tab, string> = {
    pending: `${t("adminpay.tab.pending")}${pendingCount ? ` (${f.number(pendingCount)})` : ""}`,
    expiring: `${t("adminpay.tab.expiring")}${expiredCount ? ` (${f.number(expiredCount)})` : ""}`,
    all: t("adminpay.tab.all"),
    settings: t("adminpay.tab.settings"),
  };

  return (
    <>
      <PageHeader title={t("adminpay.title")} description={t("adminpay.desc")} />
      {!settings?.payments_enabled && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{t("adminpay.allOff")}</p>
      )}
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label={t("adminpay.title")}>
        {TABS.map((x) => (
          <Link
            key={x}
            href={x === "pending" ? "/admin/payments" : `/admin/payments?tab=${x}`}
            className={`rounded-lg px-3 py-1.5 ${tab === x ? "bg-emerald-700 text-white" : "border border-stone-300 bg-white"}`}
            data-testid={`tab-${x}`}
          >
            {tabLabel[x]}
          </Link>
        ))}
      </nav>

      {(tab === "pending" || tab === "all") &&
        (payments.length === 0 ? (
          <EmptyState title={t(tab === "pending" ? "adminpay.emptyPending" : "adminpay.emptyAll")} />
        ) : (
          <div className="grid gap-3">
            {payments.map((p) => {
              const farm = farmById.get(p.farm_id);
              const who = personById.get(p.created_by ?? "");
              const m = methodByKey.get(p.method);
              return (
                <Card key={p.id}>
                  <div data-testid="payment-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <PaymentMark method={p.method} locale={locale} />
                        <div>
                          <p className="font-semibold text-stone-900">
                            {moneyText(f, Number(p.amount), p.currency)} · {nameOf(p.plan)} · {t(p.months === 1 ? "pay.months_one" : "pay.months", { n: p.months })}
                          </p>
                          <p className="text-sm text-stone-500">
                            {farm?.name ?? "—"} · {who?.full_name ?? "—"}
                            {who?.phone ? ` · ${who.phone}` : ""} · {t("admin.requests.currentPlan", { plan: nameOf(farm?.plan ?? null) })}
                          </p>
                          {p.trx_id && (
                            <p className="mt-1 text-sm">
                              {t("pay.r.trx")}: <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono font-bold text-stone-900" data-testid="admin-trx">{p.trx_id}</span>
                              {m?.account_number && <span className="text-stone-500"> → {m.account_number}</span>}
                            </p>
                          )}
                          {p.provider_payment_id && <p className="mt-1 break-all font-mono text-xs text-stone-500">{p.provider_payment_id}</p>}
                          {p.admin_note && <p className="mt-1 text-sm text-stone-600">{p.admin_note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_TONE[p.status]}>{t(`pay.status.${p.status}`)}</Badge>
                        {p.status === "paid" && <span className="font-mono text-xs text-stone-500">{receiptCode(p.receipt_no)}</span>}
                        <span className="text-xs text-stone-500">{f.dateTime(p.created_at)}</span>
                      </div>
                    </div>
                    {(p.status === "pending" || (tab === "all" && (p.status === "awaiting" || p.status === "failed"))) && (
                      <PaymentReviewer
                        id={p.id}
                        confirmApprove={t("adminpay.confirmApprove", {
                          amount: moneyText(f, Number(p.amount), p.currency),
                          method: methodName(m, locale, p.method),
                          plan: nameOf(p.plan),
                          farm: farm?.name ?? "",
                        })}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "expiring" &&
        (expiring.length === 0 ? (
          <EmptyState title={t("adminpay.emptyExpiring")} />
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-stone-600">{t("adminpay.expiringHelp")}</p>
            {expiring.map((x) => {
              const d = daysUntil(x.plan_expires_at!);
              const owner = personById.get(x.owner_id);
              return (
                <Card key={x.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3" data-testid="expiring-card">
                    <div>
                      <p className="font-semibold text-stone-900">
                        <Link href={`/admin/farms?q=${encodeURIComponent(x.name)}`} className="hover:underline">
                          {x.name}
                        </Link>{" "}
                        · {nameOf(x.plan)}
                      </p>
                      <p className="text-sm text-stone-500">
                        {owner?.full_name ?? "—"}
                        {owner?.phone ? ` · ${owner.phone}` : ""}
                      </p>
                      <p className={`mt-1 text-sm font-medium ${d < 0 ? "text-red-700" : "text-amber-700"}`}>
                        {d < 0 ? t("adminpay.endedOn", { date: f.date(x.plan_expires_at) }) : t("adminpay.endsOn", { date: f.date(x.plan_expires_at), n: d })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ConfirmForm
                        action={planExpiry}
                        fields={{ farm: x.id, action: "downgrade" }}
                        label={t("adminpay.toFree")}
                        confirm={t("adminpay.toFreeConfirm", { farm: x.name })}
                      />
                      <ConfirmForm action={planExpiry} fields={{ farm: x.id, action: "extend", months: "1" }} label={t("adminpay.extend1")} />
                      <ConfirmForm
                        action={planExpiry}
                        fields={{ farm: x.id, action: "no_expiry" }}
                        label={t("adminpay.noExpiry")}
                        confirm={t("adminpay.noExpiryConfirm", { farm: x.name })}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "settings" && <Settings methods={methods} enabled={Boolean(settings?.payments_enabled)} />}
    </>
  );
}

async function Settings({ methods, enabled }: { methods: PaymentMethod[]; enabled: boolean }) {
  const { supabase } = await requireSuperAdmin();
  const { t, locale } = await getI18n();
  const status = providerStatus();
  const { data: periodRows } = await supabase.from("billing_periods").select("*").order("months");
  const periods = (periodRows ?? []) as BillingPeriod[];
  const envOk = (ok: boolean) => <Badge tone={ok ? "green" : "red"}>{ok ? t("adminpay.env.set") : t("adminpay.env.missing")}</Badge>;

  return (
    <div className="grid gap-6">
      <Card title={t("adminpay.master")} description={t("adminpay.masterDesc")}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={enabled ? "green" : "red"}>{enabled ? t("adminpay.on") : t("adminpay.off")}</Badge>
          <ConfirmForm
            action={setPaymentsEnabled}
            fields={{ on: enabled ? "0" : "1" }}
            label={enabled ? t("adminpay.turnAllOff") : t("adminpay.turnAllOn")}
            confirm={enabled ? t("adminpay.turnAllOffConfirm") : undefined}
            variant={enabled ? "secondary" : "primary"}
          />
        </div>
      </Card>

      <Card title={t("adminpay.periods")} description={t("adminpay.periodsDesc")}>
        <div className="grid gap-3">
          {periods.map((p) => (
            <div key={p.months} className="flex flex-wrap items-end gap-3 border-b border-stone-100 pb-3">
              <ActionForm action={savePeriod} submitLabel={t("admin.plans.save")} submitVariant="secondary" className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="months" value={p.months} />
                <span className="w-24 pb-2 font-semibold text-stone-900">{t(p.months === 1 ? "pay.months_one" : "pay.months", { n: p.months })}</span>
                <Field label={t("adminpay.discount")}>
                  <Input name="discount" type="number" min="0" max="90" step="0.5" defaultValue={Number(p.discount_percent)} className="w-24" />
                </Field>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={p.active} className="accent-emerald-700" />
                  {t("adminpay.active")}
                </label>
              </ActionForm>
              <ConfirmForm action={deletePeriod} fields={{ months: String(p.months) }} label={t("adminpay.remove")} confirm={t("adminpay.removeConfirm")} />
            </div>
          ))}
          <ActionForm action={savePeriod} submitLabel={t("adminpay.addPeriod")} className="flex flex-wrap items-end gap-3">
            <Field label={t("adminpay.months")}>
              <Input name="months" type="number" min="1" max="36" required className="w-24" />
            </Field>
            <Field label={t("adminpay.discount")}>
              <Input name="discount" type="number" min="0" max="90" step="0.5" defaultValue={0} className="w-24" />
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" name="active" defaultChecked className="accent-emerald-700" />
              {t("adminpay.active")}
            </label>
          </ActionForm>
        </div>
        <p className="mt-3 text-xs text-stone-500">{t("adminpay.usdHint")}</p>
      </Card>

      <h2 className="text-lg font-semibold">{t("adminpay.methods")}</h2>
      <p className="-mt-4 text-sm text-stone-600">{t("adminpay.methodsDesc")}</p>
      {methods.map((m) => (
        <Card key={m.key} className={m.active ? "" : "opacity-80"}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <PaymentMark method={m.key} locale={locale} />
            <span className="font-semibold text-stone-900">{methodName(m, locale, m.key)}</span>
            <Badge tone={m.active ? "green" : "default"}>{m.active ? t("adminpay.on") : t("adminpay.off")}</Badge>
            <Badge tone="blue">{m.kind === "manual" ? t("pay.kind.manual") : t("pay.kind.online")}</Badge>
          </div>
          {m.kind !== "manual" && (
            <div className="mb-4 grid gap-1.5 rounded-lg bg-stone-50 p-3 text-sm" data-testid={`env-${m.key}`}>
              <p className="font-medium text-stone-800">{t("adminpay.env.title")}</p>
              {m.kind === "stripe" ? (
                <>
                  <p className="flex flex-wrap items-center gap-2"><code>STRIPE_SECRET_KEY</code> {envOk(status.stripe.key)} {status.stripe.mode && <Badge tone={status.stripe.mode === "live" ? "green" : "amber"}>{status.stripe.mode}</Badge>}</p>
                  <p className="flex flex-wrap items-center gap-2"><code>STRIPE_WEBHOOK_SECRET</code> {envOk(status.stripe.webhook)}</p>
                  <p className="text-xs text-stone-500">{t("adminpay.env.webhook")}: <code className="break-all">{SITE_URL}/api/payments/stripe/webhook</code> — checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired</p>
                </>
              ) : (
                <>
                  <p className="flex flex-wrap items-center gap-2"><code>SSLCOMMERZ_STORE_ID</code> / <code>SSLCOMMERZ_STORE_PASSWORD</code> {envOk(status.sslcommerz.key)} <Badge tone={status.sslcommerz.mode === "live" ? "green" : "amber"}>{status.sslcommerz.mode}</Badge></p>
                  <p className="text-xs text-stone-500">{t("adminpay.env.ipn")}: <code className="break-all">{SITE_URL}/api/payments/sslcommerz/ipn</code> · <code>SSLCOMMERZ_LIVE=true</code> {t("adminpay.env.forLive")}</p>
                </>
              )}
              <p className="flex flex-wrap items-center gap-2"><code>SUPABASE_SERVICE_ROLE_KEY</code> {envOk(status.serviceKey)}</p>
              <p className="text-xs text-stone-500">{t("adminpay.env.why")}</p>
            </div>
          )}
          <ActionForm action={saveMethod} submitLabel={t("admin.plans.save")} submitVariant="secondary">
            <input type="hidden" name="key" value={m.key} />
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
              <Field label={t("admin.plans.nameEn")}>
                <Input name="name_en" defaultValue={m.name_en} required maxLength={40} />
              </Field>
              <Field label={t("admin.plans.nameBn")}>
                <Input name="name_bn" defaultValue={m.name_bn ?? ""} maxLength={40} />
              </Field>
              <Field label={t("admin.plans.order")}>
                <Input name="sort_order" type="number" defaultValue={m.sort_order} />
              </Field>
            </div>
            {m.kind === "manual" && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={m.key === "bank" ? t("pay.accountNo") : t("pay.number")}>
                  <Input name="account_number" defaultValue={m.account_number ?? ""} maxLength={80} placeholder={m.key === "bank" ? "1234567890123" : "01XXXXXXXXX"} data-testid={`number-${m.key}`} />
                </Field>
                <Field label={t("adminpay.accountType")}>
                  <Input name="account_type" defaultValue={m.account_type ?? ""} maxLength={80} />
                </Field>
                <Field label={t("adminpay.accountName")}>
                  <Input name="account_name" defaultValue={m.account_name ?? ""} maxLength={80} />
                </Field>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("adminpay.instructionsEn")}>
                <Textarea name="instructions_en" rows={3} defaultValue={m.instructions_en ?? ""} maxLength={1500} />
              </Field>
              <Field label={t("adminpay.instructionsBn")}>
                <Textarea name="instructions_bn" rows={3} defaultValue={m.instructions_bn ?? ""} maxLength={1500} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="font-medium text-stone-700">{t("adminpay.currencies")}:</span>
              {(["BDT", "USD"] as const).map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <input type="checkbox" name={`cur_${c}`} defaultChecked={m.currencies.includes(c)} className="accent-emerald-700" />
                  {c}
                </label>
              ))}
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" name="active" defaultChecked={m.active} className="accent-emerald-700" data-testid={`active-${m.key}`} />
                {t("adminpay.methodOn")}
              </label>
            </div>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}
