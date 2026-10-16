import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

/** Header and footer for public pages (landing, blog). */
export async function PublicHeader() {
  const { t } = await getI18n();
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 max-[400px]:hidden">
            {t("blog.nav")}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <ButtonLink href="/doctor/signup" variant="ghost" className="max-md:hidden">
            {t("doctor.landingLink")}
          </ButtonLink>
          <ButtonLink href="/login" variant="ghost" className="max-sm:hidden">
            {t("landing.login")}
          </ButtonLink>
          <ButtonLink href="/signup" className="px-3 sm:px-4">
            {t("landing.startFree")}
          </ButtonLink>
        </nav>
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
