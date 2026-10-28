import { HeaderShell, NavLink } from "@/components/header-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicMenu, type PublicLink } from "@/components/public-menu";
import { ButtonLink } from "@/components/ui";
import { UserMenu } from "@/components/user-menu";
import { getViewer } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

/** Header for public pages (landing, blog). */
export async function PublicHeader() {
  const { t } = await getI18n();
  const viewer = await getViewer();
  const sections: PublicLink[] = [
    { href: "/#features", label: t("footer.features") },
    { href: "/tools", label: t("tools.navFree") },
    { href: "/#pricing", label: t("footer.pricing") },
    { href: "/blog", label: t("blog.nav") },
    { href: "/community", label: t("community.nav") },
  ];
  // Signed-in people don't need log in / sign up / "for doctors": they get their account menu instead.
  const links: PublicLink[] = viewer
    ? sections
    : [
        ...sections,
        { href: "/doctor/signup", label: t("doctor.landingLink") },
        { href: "/login", label: t("landing.login") },
        { href: "/signup", label: t("landing.startFree"), primary: true },
      ];
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        {/* Wide screens: section links in the middle. */}
        <nav aria-label={t("common.menu")} className="flex items-center gap-1 max-lg:hidden">
          {links.slice(0, viewer ? 5 : 6).map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {viewer ? (
            <UserMenu
              user={{
                name: viewer.profile?.full_name ?? null,
                email: viewer.user.email ?? null,
                avatarUrl: viewer.profile?.avatar_url ?? null,
                isSuperAdmin: !!viewer.profile?.is_super_admin,
                isDoctor: viewer.profile?.account_type === "doctor",
              }}
            />
          ) : (
            <div className="flex items-center gap-1.5 max-md:hidden">
              <span aria-hidden className="mx-1 h-6 w-px bg-stone-200" />
              <ButtonLink href="/login" variant="ghost" className="rounded-full">
                {t("landing.login")}
              </ButtonLink>
              <ButtonLink href="/signup" className="whitespace-nowrap rounded-full px-5 shadow-sm shadow-emerald-700/20">
                {t("landing.startFree")}
              </ButtonLink>
            </div>
          )}
          {/* Tablets: section links go in the menu too; phones: everything does. */}
          <div className="lg:hidden">
            <PublicMenu links={links} menuLabel={t("common.menu")} closeLabel={t("common.close")} />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}

/** Kept for existing imports; the public footer is now <SiteFooter />. */
export { SiteFooter as PublicFooter } from "@/components/site-footer";
