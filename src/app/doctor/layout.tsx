import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/dashboard-nav";
import { requireDoctor } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";

/** Private app area: keep it out of search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DoctorLayout({ children }: LayoutProps<"/doctor">) {
  const { user, profile, supabase } = await requireDoctor();
  const { t } = await getI18n();
  const { data: invites } = await supabase.rpc("my_pending_invites");
  const count = invites?.length ?? 0;

  const nav: NavItem[] = [
    { href: "/doctor", label: t("doctor.consoleNav"), icon: "doctor" },
    { href: "/doctor/profile", label: t("menu.profile"), icon: "profile" },
    { href: "/community", label: t("community.nav"), icon: "community" },
  ];

  return (
    <AppShell
      logoHref="/doctor"
      title={profile.full_name ?? t("doctor.consoleNav")}
      subtitle={profile.doctor_verified ? `✓ ${t("doctor.badgeVerified")}` : t("doctor.badgeUnverified")}
      nav={nav}
      user={{
        name: profile.full_name,
        email: user.email ?? null,
        avatarUrl: profile.avatar_url,
        isSuperAdmin: profile.is_super_admin,
        isDoctor: true,
      }}
      banner={
        count > 0 ? (
          <div role="status" className="border-b border-sky-200 bg-sky-100 px-4 py-2 text-center text-sm text-sky-800">
            ✉ {t(count === 1 ? "invites.banner" : "invites.bannerMany", { n: count })}{" "}
            <Link href="/invites" className="font-medium underline">
              {t("invites.bannerLink")}
            </Link>
          </div>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
