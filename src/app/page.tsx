import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { Marquee } from "@/components/velora/marquee";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ShimmerLink } from "@/components/velora/shimmer-link";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { WordRotate } from "@/components/velora/word-rotate";
import { getI18n } from "@/lib/i18n/server";
import { planFeatures, planName, priceText } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const plans = (await getPlans()).filter((p) => p.active);
  // The middle paid plan is highlighted as the recommended one.
  const highlightKey = plans.length >= 3 ? plans[1].key : null;

  const features = [1, 2, 3, 4, 5, 6] as const;
  const featureIcons = { 1: "🐄", 2: "🥛", 3: "💉", 4: "🐔", 5: "💰", 6: "🌐" } as const;
  const rotating = ([1, 2, 3, 4, 5, 6] as const).map((n) => t(`landing.rotate.${n}`));

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/icons/icon-512.png`,
            },
            {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android, iOS",
              description: t("meta.description"),
              url: SITE_URL,
              inLanguage: ["bn", "en"],
              offers: plans
                .filter((p) => p.price_monthly !== null)
                .map((p) => ({ "@type": "Offer", name: planName(p, locale, p.key), price: p.price_monthly, priceCurrency: "BDT" })),
            },
          ],
        }}
      />
      <ScrollProgress />
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-stone-50">
          <AuroraBackground intensity="subtle" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <BlurFade>
              <p className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                {t("landing.badge")}
              </p>
            </BlurFade>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 text-xl font-medium text-stone-700 sm:text-2xl">
              {t("landing.rotatePrefix")}{" "}
              <WordRotate words={rotating} className="text-emerald-700" />
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">{t("landing.heroBody")}</p>
            <BlurFade delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ShimmerLink href="/signup" className="text-base">
                  {t("landing.ctaPrimary")}
                </ShimmerLink>
                <ButtonLink href="/login" variant="secondary" className="h-12 rounded-full px-6 text-base">
                  {t("landing.ctaSecondary")}
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-stone-500">
                {t("doctor.areDoctor")}{" "}
                <Link href="/doctor/signup" className="font-medium text-emerald-700 hover:underline">
                  {t("doctor.landingCta")}
                </Link>
              </p>
            </BlurFade>
          </div>
        </section>

        <section aria-label={t("landing.marqueeLabel")} className="border-y border-stone-200 bg-white py-5">
          <Marquee pauseOnHover className="[--duration:35s]" repeat={3}>
            {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => (
              <span key={n} className="whitespace-nowrap rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-800">
                {t(`landing.marquee.${n}`)}
              </span>
            ))}
          </Marquee>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <BlurFade>
            <h2 className="text-center text-3xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
          </BlurFade>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((n, i) => (
              <BlurFade key={n} delay={0.05 * i} className="h-full">
                <SpotlightCard className="h-full border-stone-200 p-6 transition-shadow hover:shadow-md">
                  <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-2xl">
                    {featureIcons[n]}
                  </span>
                  <h3 className="mt-4 font-semibold text-stone-900">{t(`landing.f${n}.title`)}</h3>
                  <p className="mt-2 text-sm text-stone-600">{t(`landing.f${n}.body`)}</p>
                </SpotlightCard>
              </BlurFade>
            ))}
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <BlurFade>
              <h2 className="text-center text-3xl font-bold tracking-tight">{t("landing.stepsTitle")}</h2>
            </BlurFade>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {([1, 2, 3] as const).map((n, i) => (
                <li key={n}>
                  <BlurFade delay={0.08 * i} className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6">
                    <span className="grid size-10 place-items-center rounded-full bg-emerald-700 font-bold text-white">{f.number(n)}</span>
                    <h3 className="mt-4 font-semibold text-stone-900">{t(`landing.step${n}.title`)}</h3>
                    <p className="mt-2 text-sm text-stone-600">{t(`landing.step${n}.body`)}</p>
                  </BlurFade>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t("landing.pricingTitle")}</h2>
            <p className="mt-2 text-center text-stone-500">{t("landing.pricingSub")}</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((p, i) => {
                const highlight = p.key === highlightKey;
                return (
                  <BlurFade key={p.key} delay={0.06 * i} className="h-full">
                  <div
                    data-testid={`home-plan-${p.key}`}
                    className={`flex h-full flex-col rounded-2xl border bg-white p-6 ${highlight ? "border-emerald-600 shadow-lg shadow-emerald-700/10 ring-2 ring-emerald-600/20" : "border-stone-200"}`}
                  >
                    <h3 className="font-semibold">{planName(p, locale, p.key)}</h3>
                    <p className="mt-2 text-3xl font-bold">{priceText(i18n, p)}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {p.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth")}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-700">
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
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <BlurFade>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-emerald-900 px-6 py-14 text-center text-white sm:px-12">
              <AuroraBackground intensity="vivid" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.ctaTitle")}</h2>
                <p className="mx-auto mt-3 max-w-xl text-white/85">{t("landing.ctaBody")}</p>
                <ShimmerLink href="/signup" className="mt-8 bg-amber-300 text-base text-emerald-950 shadow-black/20">
                  {t("landing.ctaPrimary")}
                </ShimmerLink>
              </div>
            </div>
          </BlurFade>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
