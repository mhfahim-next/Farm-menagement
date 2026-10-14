import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/dashboard-nav";
import { getProfile, requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { farm, user, role, supabase } = await requireFarm();
  const profile = await getProfile();
  const { t, e, locale } = await getI18n();

  const { data: settings } = await supabase
    .from("system_settings")
    .select("announcement_en, announcement_bn, announcement_active")
    .eq("id", 1)
    .maybeSingle();
  const announcement = settings?.announcement_active
    ? ((locale === "bn" ? settings.announcement_bn : settings.announcement_en) ??
      settings.announcement_en ??
      settings.announcement_bn)
    : null;

  const nav: NavItem[] = [
    { href: "/dashboard", label: t("nav.overview") },
    ...(farm.has_dairy
      ? [
          { href: "/dashboard/cattle", label: t("nav.cattle") },
          { href: "/dashboard/milk", label: t("nav.milk") },
          { href: "/dashboard/health", label: t("nav.health") },
          { href: "/dashboard/breeding", label: t("nav.breeding") },
        ]
      : []),
    ...(farm.has_layer ? [{ href: "/dashboard/flocks", label: t("nav.flocks") }] : []),
    { href: "/dashboard/finance", label: t("nav.finance") },
    { href: "/dashboard/settings", label: t("nav.settings") },
  ];

  return (
    <AppShell
      logoHref="/dashboard"
      title={farm.name}
      subtitle={e(role)}
      nav={nav}
      user={{
        name: profile?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        isSuperAdmin: profile?.is_super_admin ?? false,
      }}
      banner={
        announcement ? (
          <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            📢 {announcement}
          </div>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
