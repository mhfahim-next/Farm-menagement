import type { Metadata } from "next";
import Link from "next/link";
import { FarmForm } from "@/components/farm-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { farmQuota } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { createFarm } from "@/app/onboarding/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("farm.addTitle") };
}

export default async function NewFarmPage() {
  const { farms, role } = await requireFarm();
  const i18n = await getI18n();
  const { t } = i18n;
  const plans = await getPlans();
  const quota = farmQuota(plans, farms.filter((f) => f.role === "owner").map((f) => f.plan));

  return (
    <>
      <PageHeader
        title={t("farm.addTitle")}
        description={t("farm.addDesc")}
        action={
          <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-900">
            {t("menu.backToApp")}
          </Link>
        }
      />
      <Card className="max-w-lg">
        {quota.allowed ? (
          <FarmForm action={createFarm} i18n={i18n} />
        ) : (
          <div className="grid gap-3 text-sm">
            <p className="text-stone-700">{t("farm.addLocked", { n: quota.cap ?? 1 })}</p>
            {MANAGERS.includes(role) && <ButtonLink href="/dashboard/plan">{t("plan.upgradeNow")}</ButtonLink>}
          </div>
        )}
      </Card>
    </>
  );
}
