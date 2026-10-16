import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { planFeatures, planName, priceText } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";

export default async function Home() {
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const plans = (await getPlans()).filter((p) => p.active);
  // The middle paid plan is highlighted as the recommended one.
  const highlightKey = plans.length >= 3 ? plans[1].key : null;

  const features = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />

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
            <p className="mt-5 text-sm text-stone-500">
              {t("doctor.areDoctor")}{" "}
              <Link href="/doctor/signup" className="font-medium text-emerald-700 hover:underline">
                {t("doctor.landingCta")}
              </Link>
            </p>
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
              {plans.map((p) => {
                const highlight = p.key === highlightKey;
                return (
                  <div
                    key={p.key}
                    data-testid={`home-plan-${p.key}`}
                    className={`rounded-xl border p-6 ${highlight ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-stone-200"}`}
                  >
                    <h3 className="font-semibold">{planName(p, locale, p.key)}</h3>
                    <p className="mt-2 text-3xl font-bold">{priceText(i18n, p)}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {p.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth")}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-stone-700">
                      {planFeatures(t, p).map((x) => (
                        <li key={x}>✓ {x}</li>
                      ))}
                      <li className="text-stone-500">✓ {t("plans.feat.vets")}</li>
                    </ul>
                    <ButtonLink
                      href={p.price_monthly === 0 ? "/signup" : `/signup?plan=${p.key}`}
                      variant={highlight ? "primary" : "secondary"}
                      className="mt-6 w-full"
                    >
                      {p.price_monthly === 0 ? t("plans.getStarted") : t("plans.choose", { plan: planName(p, locale, p.key) })}
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
