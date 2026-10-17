import { HeaderShell, NavLink } from "@/components/header-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicMenu, type PublicLink } from "@/components/public-menu";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

/** Header for public pages (landing, blog). */
export async function PublicHeader() {
  const { t } = await getI18n();
  const links: PublicLink[] = [
    { href: "/#features", label: t("footer.features") },
    { href: "/#pricing", label: t("footer.pricing") },
    { href: "/blog", label: t("blog.nav") },
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
          {links.slice(0, 4).map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="flex items-center gap-1.5 max-md:hidden">
            <span aria-hidden className="mx-1 h-6 w-px bg-stone-200" />
            <ButtonLink href="/login" variant="ghost" className="rounded-full">
              {t("landing.login")}
            </ButtonLink>
            <ButtonLink href="/signup" className="whitespace-nowrap rounded-full px-5 shadow-sm shadow-emerald-700/20">
              {t("landing.startFree")}
            </ButtonLink>
          </div>
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
