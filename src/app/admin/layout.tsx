import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/dashboard-nav";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

/** Private app area: keep it out of search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, profile } = await requireSuperAdmin();
  const { t } = await getI18n();

  const nav: NavItem[] = [
    { href: "/admin", label: t("nav.adminOverview") },
    { href: "/admin/analytics", label: t("nav.adminAnalytics") },
    { href: "/admin/users", label: t("nav.adminUsers") },
    { href: "/admin/farms", label: t("nav.adminFarms") },
    { href: "/admin/plans", label: t("nav.adminPlans") },
    { href: "/admin/requests", label: t("nav.adminRequests") },
    { href: "/admin/blog", label: t("nav.adminBlog") },
    { href: "/admin/community", label: t("nav.adminCommunity") },
    { href: "/admin/reviews", label: t("nav.adminReviews") },
    { href: "/admin/messages", label: t("nav.adminMessages") },
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
