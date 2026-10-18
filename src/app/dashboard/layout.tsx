import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/dashboard-nav";
import { LazyAiAssistant as AiAssistant } from "@/components/ai-assistant-lazy";
import { FarmSwitcher } from "@/components/farm-switcher";
import { getProfile, MANAGERS, requireFarm, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { farmQuota, planName } from "@/lib/plan-utils";
import { getPlanContext, getPlans } from "@/lib/plans";

/** Private app area: keep it out of search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { farm, user, role, farms, supabase } = await requireFarm();
  const profile = await getProfile();
  const { t, f, o, locale } = await getI18n();
  const isManager = MANAGERS.includes(role);
  const isStaff = STAFF.includes(role);
  const isVet = role === "vet";

  const [{ data: settings }, { data: invites }, plans] = await Promise.all([
    supabase
      .from("system_settings")
      .select("announcement_en, announcement_bn, announcement_active")
      .eq("id", 1)
      .maybeSingle(),
    supabase.rpc("my_pending_invites"),
    getPlans(),
  ]);
  const announcement = settings?.announcement_active
    ? ((locale === "bn" ? settings.announcement_bn : settings.announcement_en) ??
      settings.announcement_en ??
      settings.announcement_bn)
    : null;

  // Farm switcher: several farms, or the plan lets this owner add one.
  const owned = farms.filter((f) => f.role === "owner").map((f) => f.plan);
  const quota = owned.length > 0 ? farmQuota(plans, owned) : { allowed: false, cap: 1 as number | null };
  const canAddFarm = quota.allowed && owned.length > 0;
  const showSwitcher = farms.length > 1 || canAddFarm;

  // Plan limit banner for people who can act on it.
  let limitBanner: string | null = null;
  if (isManager) {
    const { plan, usage, limits, states } = await getPlanContext();
    // The owner always uses the first team seat, so a full seat count is normal;
    // only cattle/flocks being full (or the team being over its limit) is worth a banner.
    const hit = (["cattle", "flocks", "members"] as const).filter((k) =>
      k === "members" ? states[k] === "over" : states[k] === "full" || states[k] === "over",
    );
    if (hit.length > 0) {
      limitBanner =
        planName(plan, locale) +
        " — " +
        hit.map((k) => `${t(`plan.usage.${k}`)} ${t("plan.usageOf", { used: usage[k], max: limits[k] ?? 0 })}`).join(" · ");
    }
  }

  // Entries doctors submitted that wait for an owner / manager to approve.
  let pendingApprovals = 0;
  if (isManager) {
    const { count } = await supabase.from("pending_entries").select("id", { count: "exact", head: true }).eq("farm_id", farm.id).eq("status", "pending");
    pendingApprovals = count ?? 0;
  }

  const nav: NavItem[] = isVet
    ? [
        { href: "/dashboard/cattle", label: t("nav.cattle") },
        { href: "/dashboard/health", label: t("nav.health") },
        { href: "/dashboard/breeding", label: t("nav.breeding") },
        { href: "/dashboard/approvals", label: t("nav.approvals") },
        { href: "/doctor", label: `← ${t("doctor.consoleNav")}` },
      ]
    : [
        { href: "/dashboard", label: t("nav.overview") },
        ...(farm.has_dairy
          ? [
              { href: "/dashboard/cattle", label: t("nav.cattle") },
              { href: "/dashboard/milk", label: t("nav.milk") },
              { href: "/dashboard/health", label: t("nav.health") },
              { href: "/dashboard/breeding", label: t("nav.breeding") },
            ].map((i) => ({ ...i, group: t("nav.group.cow") }))
          : []),
        ...(farm.has_layer
          ? [
              { href: "/dashboard/flocks", label: t("nav.flocks") },
              ...(isStaff ? [{ href: "/dashboard/flock-health", label: t("nav.flockHealth") }] : []),
            ].map((i) => ({ ...i, group: t("nav.group.layer") }))
          : []),
        ...(isStaff
          ? [
              { href: "/dashboard/finance", label: t("nav.finance") },
              { href: "/dashboard/sales", label: t("nav.sales") },
              { href: "/dashboard/inventory", label: t("nav.inventory") },
              { href: "/dashboard/profit", label: t("nav.profit") },
              ...(isManager ? [{ href: "/dashboard/staff", label: t("nav.staff") }] : []),
              { href: "/dashboard/reports", label: t("nav.reports") },
            ].map((i) => ({ ...i, group: t("nav.group.finance") }))
          : []),
        ...[
          ...(isManager ? [{ href: "/dashboard/approvals", label: pendingApprovals > 0 ? `${t("nav.approvals")} (${f.number(pendingApprovals)})` : t("nav.approvals") }] : []),
          ...(isManager ? [{ href: "/dashboard/plan", label: t("nav.plan") }] : []),
          { href: "/dashboard/settings", label: t("nav.settings") },
          { href: "/dashboard/review", label: t("nav.review") },
          { href: "/community", label: t("community.nav") },
        ].map((i) => ({ ...i, group: t("nav.group.farm") })),
      ];

  const invitesCount = invites?.length ?? 0;

  // AI assistant (staff only): how many prompts this farm has used this month.
  let aiStatus: { used: number; max: number | null } | null = null;
  if (isStaff) {
    const { data } = await supabase.rpc("ai_prompts_status", { p_farm: farm.id });
    const st = data as { used?: number; max?: number | null } | null;
    aiStatus = { used: st?.used ?? 0, max: st?.max ?? null };
  }

  return (
    <AppShell
      logoHref={isVet ? "/doctor" : "/dashboard"}
      title={farm.name}
      subtitle={o("member_role", role)}
      titleSlot={
        showSwitcher ? (
          <FarmSwitcher
            farms={farms.map((f) => ({ id: f.id, name: f.name, role: f.role }))}
            currentId={farm.id}
            canAdd={canAddFarm}
            addLockedHint={
              !canAddFarm && owned.length > 0 && farms.length > 1
                ? t("farm.addLocked", { n: quota.cap ?? 1 })
                : null
            }
          />
        ) : undefined
      }
      nav={nav}
      user={{
        name: profile?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        isSuperAdmin: profile?.is_super_admin ?? false,
        isDoctor: profile?.account_type === "doctor",
      }}
      banner={
        <>
          {announcement && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
              📢 {announcement}
            </div>
          )}
          {invitesCount > 0 && (
            <div role="status" className="border-b border-sky-200 bg-sky-100 px-4 py-2 text-center text-sm text-sky-800">
              ✉ {t(invitesCount === 1 ? "invites.banner" : "invites.bannerMany", { n: invitesCount })}{" "}
              <Link href="/invites" className="font-medium underline">
                {t("invites.bannerLink")}
              </Link>
            </div>
          )}
          {pendingApprovals > 0 && (
            <div role="status" data-testid="approvals-banner" className="border-b border-sky-200 bg-sky-100 px-4 py-2 text-center text-sm text-sky-800">
              ✎ {t(pendingApprovals === 1 ? "approvals.banner" : "approvals.bannerMany", { n: f.number(pendingApprovals) })}{" "}
              <Link href="/dashboard/approvals" className="font-medium underline">
                {t("approvals.bannerLink")}
              </Link>
            </div>
          )}
          {limitBanner && (
            <div role="alert" data-testid="plan-banner" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
              {t("plan.banner.full", { what: limitBanner })}{" "}
              <Link href="/dashboard/plan" className="font-medium underline">
                {t("plan.banner.link")}
              </Link>
            </div>
          )}
        </>
      }
    >
      {isVet && (
        <p className="mb-5 rounded-lg bg-sky-100 px-4 py-2.5 text-sm text-sky-800">
          {t("doctor.vetNotice", { farm: farm.name })}
        </p>
      )}
      {children}
      {aiStatus && <AiAssistant initial={aiStatus} />}
    </AppShell>
  );
}
