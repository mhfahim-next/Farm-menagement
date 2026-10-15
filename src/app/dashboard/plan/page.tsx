import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { UsageMeter } from "@/components/usage-meter";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { MANAGERS, requireRole } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { farmQuota, planFeatures, planName, priceText, USAGE_KEYS, type Plan } from "@/lib/plan-utils";
import { getPlanContext } from "@/lib/plans";
import { cancelRequest, requestUpgrade, sendSupport } from "./actions";

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
  const sp = await searchParams;
  const highlight = typeof sp.choose === "string" ? sp.choose : null;

  const [{ data: reqData }, { data: settings }] = await Promise.all([
    supabase.from("requests").select("*").eq("farm_id", farm.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("system_settings").select("payment_instructions_en, payment_instructions_bn").eq("id", 1).maybeSingle(),
  ]);
  const requests = (reqData ?? []) as RequestRow[];
  const pending = requests.find((r) => r.kind === "upgrade" && r.status === "open");
  const payText =
    (locale === "bn" ? settings?.payment_instructions_bn : settings?.payment_instructions_en) ??
    settings?.payment_instructions_en ??
    settings?.payment_instructions_bn ??
    null;

  const nameOf = (key: string | null) => planName(plans.find((p) => p.key === key), locale, key ?? "");
  const visible = plans.filter((p) => p.active || p.key === farm.plan);
  const owned = farms.filter((x) => x.role === "owner");
  const quota = farmQuota(plans, owned.map((x) => x.plan));

  return (
    <>
      <PageHeader title={t("plan.title")} description={t("plan.desc")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={t("plan.currentTitle", { plan: nameOf(farm.plan) })} description={priceText(i18n, plan) + " · " + (plan.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth"))}>
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
          <Card title={t("plan.payTitle")}>
            {payText ? (
              <p className="whitespace-pre-line text-sm text-stone-700">{payText}</p>
            ) : (
              <p className="text-sm text-stone-500">{t("plan.payEmpty")}</p>
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
      {pending && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{t("plan.requestPending", { plan: nameOf(pending.plan_requested), date: f.date(pending.created_at) })}</span>
          <form action={cancelRequest}>
            <input type="hidden" name="id" value={pending.id} />
            <Button type="submit" variant="secondary" className="px-3 py-1.5">
              {t("plan.requestCancel")}
            </Button>
          </form>
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
}: {
  i18n: Awaited<ReturnType<typeof getI18n>>;
  p: Plan;
  name: string;
  current: boolean;
  highlight: boolean;
  higher: boolean;
  pending: boolean;
  t: Awaited<ReturnType<typeof getI18n>>["t"];
}) {
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
      <p className="mt-2 text-3xl font-bold">{priceText(i18n, p)}</p>
      <p className="text-xs text-stone-500">{p.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth")}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
        {planFeatures(t, p).map((x) => (
          <li key={x}>✓ {x}</li>
        ))}
      </ul>
      {higher && !pending && (
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
