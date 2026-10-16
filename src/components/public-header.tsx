import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicMenu, type PublicLink } from "@/components/public-menu";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

/** Header and footer for public pages (landing, blog). */
export async function PublicHeader() {
  const { t } = await getI18n();
  const links: PublicLink[] = [
    { href: "/blog", label: t("blog.nav") },
    { href: "/doctor/signup", label: t("doctor.landingLink") },
    { href: "/login", label: t("landing.login") },
    { href: "/signup", label: t("landing.startFree"), primary: true },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {/* Wide screens: links in the bar. Phones: they live in the side menu. */}
          <nav className="flex items-center gap-2 max-md:hidden">
            <Link href="/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
              {t("blog.nav")}
            </Link>
            <ButtonLink href="/doctor/signup" variant="ghost">
              {t("doctor.landingLink")}
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost">
              {t("landing.login")}
            </ButtonLink>
            <ButtonLink href="/signup" className="whitespace-nowrap">
              {t("landing.startFree")}
            </ButtonLink>
          </nav>
          <PublicMenu links={links} menuLabel={t("common.menu")} closeLabel={t("common.close")} />
        </div>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  const { t } = await getI18n();
  return (
    <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
      <Link href="/blog" className="mr-4 hover:text-stone-800 hover:underline">
        {t("blog.nav")}
      </Link>
      {t("landing.footer", { year: new Date().getFullYear() })}
    </footer>
  );
}
