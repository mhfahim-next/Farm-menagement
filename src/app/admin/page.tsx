import type { Metadata } from "next";
import { Card, PageHeader, StatCard } from "@/components/ui";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { planName } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { getI18n } from "@/lib/i18n/server";
import type { AdminStats } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.meta") };
}

export default async function AdminOverviewPage() {
  const [{ supabase }, { t, f, locale }] = await Promise.all([requireSuperAdmin(), getI18n()]);
  const [plans, { data, error }, { count: openRequests }, { count: unverified }] = await Promise.all([
    getPlans(),
    supabase.rpc("admin_stats"),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "doctor").eq("doctor_verified", false),
  ]);
  if (error) throw new Error(error.message);
  const s = data as AdminStats;

  return (
    <>
      <PageHeader title={t("admin.overviewTitle")} description={t("admin.overviewDesc")} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("admin.users")} value={f.number(s.users)} hint={t("admin.newUsers7", { n: s.users_7d })} />
        <StatCard label={t("admin.farms")} value={f.number(s.farms)} hint={t("admin.suspendedFarms", { n: s.suspended_farms })} />
        <StatCard label={t("admin.activeCattle")} value={f.number(s.cattle)} />
        <StatCard label={t("admin.activeFlocks")} value={f.number(s.flocks)} />
        <StatCard label={t("admin.milk30")} value={t("common.litersShort", { n: f.number(Number(s.milk_30d_liters), 0) })} />
        <StatCard label={t("admin.eggs30")} value={f.number(Number(s.eggs_30d))} />
        <StatCard label={t("admin.newUsersLabel")} value={f.number(s.users_30d)} />
        <Link href="/admin/requests" className="block">
          <StatCard label={t("admin.openRequests")} value={f.number(openRequests ?? 0)} tone={openRequests ? "bad" : "default"} />
        </Link>
        <StatCard label={t("admin.unverifiedDoctors")} value={f.number(unverified ?? 0)} />
        <StatCard
          label={t("admin.suspendedUsers")}
          value={f.number(s.banned_users)}
          tone={s.banned_users ? "bad" : "default"}
        />
      </div>

      <Card title={t("admin.plansTitle")} className="mt-6">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.key} className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-sm text-stone-500">{planName(p, locale, p.key)}</p>
              <p className="text-xl font-bold tabular-nums">{f.number(s.plans?.[p.key] ?? 0)}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
