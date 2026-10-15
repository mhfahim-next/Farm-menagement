import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { PlanFields } from "@/components/plan-fields";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { planName, priceText } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { addPlan, savePlan } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.plans.title") };
}

export default async function AdminPlansPage() {
  const { supabase } = await requireSuperAdmin();
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const plans = await getPlans();

  const { data: farmPlans } = await supabase.from("farms").select("plan");
  const counts = new Map<string, number>();
  for (const f of farmPlans ?? []) counts.set(f.plan, (counts.get(f.plan) ?? 0) + 1);

  return (
    <>
      <PageHeader title={t("admin.plans.title")} description={t("admin.plans.desc")} />
      <p className="mb-4 rounded-lg bg-stone-100 px-4 py-2.5 text-sm text-stone-600">{t("admin.plans.lowerNote")}</p>

      <div className="grid gap-4">
        {plans.map((p) => (
          <Card key={p.key} className={p.active ? "" : "opacity-75"}>
            <ActionForm action={savePlan} submitLabel={t("admin.plans.save")} submitVariant="secondary">
              <input type="hidden" name="key" value={p.key} />
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span>
                  {t("admin.plans.code")}: <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">{p.key}</code>
                </span>
                <Badge tone="blue">{planName(p, locale)} · {priceText(i18n, p)}</Badge>
                <span>{t("admin.plans.farmsOnPlan", { n: counts.get(p.key) ?? 0 })}</span>
                {!p.active && <Badge tone="amber">{t("options.hidden")}</Badge>}
              </div>
              <PlanFields t={t} plan={p} />
            </ActionForm>
          </Card>
        ))}

        <Card title={t("admin.plans.addTitle")} className="border-dashed">
          <ActionForm action={addPlan} submitLabel={t("admin.plans.addSubmit")}>
            <Field label={t("admin.plans.code")} hint={t("admin.plans.codeHint")}>
              <Input name="key" required maxLength={30} className="max-w-56" />
            </Field>
            <PlanFields t={t} />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
