import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/dashboard-nav";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

/** Private app area: keep it out of search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Things waiting for an admin (menu badges) are read while the admin check runs;
  // the function checks super admin itself, and nothing is shown unless requireSuperAdmin passes.
  const [{ user, profile }, { t }, { data: inbox }] = await Promise.all([
    requireSuperAdmin(),
    getI18n(),
    createClient().then((supabase) => supabase.rpc("admin_inbox_counts")),
  ]);
  const counts = (inbox ?? {}) as { requests?: number; messages?: number; payments?: number };

  const nav: NavItem[] = [
    { href: "/admin", label: t("nav.adminOverview") },
    { href: "/admin/analytics", label: t("nav.adminAnalytics") },
    { href: "/admin/users", label: t("nav.adminUsers") },
    { href: "/admin/farms", label: t("nav.adminFarms") },
    { href: "/admin/plans", label: t("nav.adminPlans") },
    { href: "/admin/payments", label: t("nav.adminPayments"), badge: counts.payments ?? 0 },
    { href: "/admin/requests", label: t("nav.adminRequests"), badge: counts.requests ?? 0 },
    { href: "/admin/blog", label: t("nav.adminBlog") },
    { href: "/admin/community", label: t("nav.adminCommunity") },
    { href: "/admin/reviews", label: t("nav.adminReviews") },
    { href: "/admin/messages", label: t("nav.adminMessages"), badge: counts.messages ?? 0 },
    { href: "/admin/reminders", label: t("nav.adminReminders") },
    { href: "/admin/site", label: t("nav.adminSite") },
    { href: "/admin/ai", label: t("nav.adminAi") },
    { href: "/admin/options", label: t("nav.adminOptions") },
    { href: "/admin/audit", label: t("nav.adminAudit") },
    { href: "/admin/settings", label: t("nav.adminSettings") },
    { href: "/dashboard", label: `← ${t("menu.backToApp")}` },
  ];

  return (
    <AppShell
      logoHref="/admin"
      title={t("admin.title")}
      subtitle={t("admin.subtitle")}
      nav={nav}
      inAdmin
      user={{
        name: profile.full_name,
        email: user.email ?? null,
        avatarUrl: profile.avatar_url,
        isSuperAdmin: true,
      }}
    >
      {children}
    </AppShell>
  );
}
