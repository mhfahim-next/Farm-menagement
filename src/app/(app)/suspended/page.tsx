import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("suspended.farmTitle") };
}

export default async function SuspendedPage() {
  await requireUser();
  const { t } = await getI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>⏸</p>
        <h1 className="mt-3 text-xl font-bold">{t("suspended.farmTitle")}</h1>
        <p className="mt-2 text-sm text-stone-600">{t("suspended.farmBody")}</p>
        <form action="/auth/signout" method="post" className="mt-6">
          <Button type="submit" variant="secondary">
            {t("menu.logout")}
          </Button>
        </form>
      </div>
    </div>
  );
}
