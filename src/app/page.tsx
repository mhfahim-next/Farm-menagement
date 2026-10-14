import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getI18n();

  const features = [1, 2, 3, 4, 5, 6] as const;
  const plans = [
    { id: "free", items: [1, 2, 3] },
    { id: "pro", items: [1, 2, 3, 4], highlight: true },
    { id: "business", items: [1, 2, 3] },
  ] as const;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
              {t("landing.login")}
            </ButtonLink>
            <ButtonLink href="/signup">{t("landing.startFree")}</ButtonLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-emerald-50 to-stone-50">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <p className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              {t("landing.badge")}
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">{t("landing.heroBody")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/signup" className="px-6 py-3 text-base">
                {t("landing.ctaPrimary")}
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="px-6 py-3 text-base">
                {t("landing.ctaSecondary")}
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((n) => (
              <div key={n} className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="font-semibold text-stone-900">{t(`landing.f${n}.title`)}</h3>
                <p className="mt-2 text-sm text-stone-600">{t(`landing.f${n}.body`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t("landing.pricingTitle")}</h2>
            <p className="mt-2 text-center text-stone-500">{t("landing.pricingSub")}</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-6 ${
                    "highlight" in p ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-stone-200"
                  }`}
                >
                  <h3 className="font-semibold">{t(`enum.${p.id}`)}</h3>
                  <p className="mt-2 text-3xl font-bold">{t(`landing.plan.${p.id}.price`)}</p>
                  <p className="mt-2 text-sm text-stone-500">{t(`landing.plan.${p.id}.body`)}</p>
                  <ul className="mt-5 space-y-2 text-sm text-stone-700">
                    {p.items.map((i) => (
                      <li key={i}>✓ {t(`landing.plan.${p.id}.i${i}` as "landing.plan.free.i1")}</li>
                    ))}
                  </ul>
                  <ButtonLink
                    href="/signup"
                    variant={"highlight" in p ? "primary" : "secondary"}
                    className="mt-6 w-full"
                  >
                    {t("landing.getStarted")}
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        {t("landing.footer", { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
