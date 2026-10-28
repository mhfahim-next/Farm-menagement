import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import Image from "next/image";
import { ButtonLink } from "@/components/ui";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { Marquee } from "@/components/velora/marquee";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ShimmerLink } from "@/components/velora/shimmer-link";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { ToolGrid } from "@/components/tool-grid";
import { WordRotate } from "@/components/velora/word-rotate";
import { getViewer } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { planFeatures, planName, priceText } from "@/lib/plan-utils";
import { getPlans } from "@/lib/plans";
import { FaqSection } from "@/components/faq-section";
import { HomeGlobe } from "@/components/home-globe";
import { globeCopy } from "@/lib/country-copy";
import { readGeo } from "@/lib/geo";
import { currencyFor } from "@/lib/payments";
import { JsonLd } from "@/components/json-ld";
import { ReviewsSection } from "@/components/reviews-section";
import { getApprovedReviews, getPublicStats, safe } from "@/lib/public-data";
import { langAlternates, SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: langAlternates("/", locale) };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const i18n = await getI18n();
  const viewer = await getViewer();
  const { t, f, locale } = i18n;
  const [allPlans, reviews, live] = await Promise.all([
    getPlans(),
    safe(() => getApprovedReviews(), []),
    safe(() => getPublicStats(), null),
  ]);
  const plans = allPlans.filter((p) => p.active);
  // Globe section worded for the visitor's country (?cc=IN previews another country).
  const sp = await searchParams;
  const preview = typeof sp.cc === "string" && /^[A-Za-z]{2}$/.test(sp.cc) ? sp.cc : null;
  const country = (await readGeo()).country;
  const copy = globeCopy(preview ?? country, locale);
  // Prices in taka for Bangladesh, dollars elsewhere.
  const currency = currencyFor(preview ? preview.toUpperCase() : country);
  // Real platform numbers once there are enough farms; until then, plain facts.
  // "64 districts" is about Bangladesh, so other countries don't get it.
  const stats =
    live && live.farms >= 10
      ? [
          { value: live.farms, label: t("globe.farms") },
          { value: live.animals + live.birds, label: t("globe.animals") },
          { value: live.records, label: t("globe.records") },
        ]
      : [
          ...(copy.country === "BD" ? [{ value: 64, label: t("globe.districts") }] : []),
          { value: 2, label: t("globe.languages") },
          { value: 24, label: t("globe.hours") },
        ];
  // The middle paid plan is highlighted as the recommended one.
  const highlightKey = plans.length >= 3 ? plans[1].key : null;

  const features = [1, 2, 3, 13, 16, 17, 4, 18, 7, 8, 5, 9, 10, 14, 15, 11, 12, 6] as const;
  const featureIcons = {
    1: "🐄", 2: "🥛", 3: "💉", 4: "🐔", 5: "💰", 6: "🌐", 7: "📦", 8: "🧾", 9: "📶", 10: "📥", 11: "🤖", 12: "👥", 13: "⚖️", 14: "🏷️", 15: "📄", 16: "🐐", 17: "🐂", 18: "🐥",
  } as const;
  const rotating = ([1, 2, 3, 4, 5, 6] as const).map((n) => t(`landing.rotate.${n}`));

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              // Tells Google the site's name (shown above the result instead of the bare domain).
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              alternateName: ["FarmFlow", "FarmFlows App", "ফার্মফ্লোজ"],
              url: SITE_URL,
              inLanguage: ["bn", "en"],
            },
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 },
            },
            {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android, iOS",
              description: t("meta.description"),
              url: SITE_URL,
              inLanguage: ["bn", "en"],
              featureList: [
                "Cattle and herd records", "Milk records", "Vaccine and treatment reminders", "Breeding and calving calendar",
                "Layer flock and egg records", "Broiler and Sonali batches with FCR", "Goat and sheep records", "Cattle fattening and Qurbani profit", "Feed and medicine stock", "Sales and buyer dues", "Staff attendance and salary",
                "Income, expenses and profit per litre and per egg", "Works offline", "Import from Excel or CSV",
                "AI assistant in Bangla and English", "Vet approvals", "Weight and growth tracking", "QR tags for animals", "PDF report per animal", "Bangla and English",
              ],
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
              <WordRotate words={rotating} className="text-emerald-800" />
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">{t("landing.heroBody")}</p>
            <BlurFade delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ShimmerLink href={viewer ? viewer.home : "/signup"} className="text-base">
                  {viewer ? t("landing.goDashboard") : t("landing.ctaPrimary")}
                </ShimmerLink>
                {/* Same pill shape and height as the main button, but quiet: outline + arrow. */}
                {!viewer && (
                <Link
                  href="/login"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-emerald-700/25 bg-white px-7 text-base font-medium text-emerald-800 shadow-sm transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:translate-y-0"
                >
                  {t("landing.ctaSecondary")}
                  <svg viewBox="0 0 20 20" aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </Link>
                )}
              </div>
              {!viewer && (
                <p className="mt-5 text-sm text-stone-700">
                  {t("doctor.areDoctor")}{" "}
                  <Link href="/doctor/signup" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">
                    {t("doctor.landingCta")}
                  </Link>
                </p>
              )}
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

        <section id="tools" aria-labelledby="tools-title" className="scroll-mt-20 border-t border-stone-200 bg-emerald-50/60" data-testid="home-tools">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <BlurFade className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                <span aria-hidden>🧮</span> {t("tools.homeKicker")}
              </span>
              <h2 id="tools-title" className="mt-4 text-3xl font-bold tracking-tight">{t("tools.homeTitle")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-stone-600">{t("tools.homeBody")}</p>
            </BlurFade>
            <div className="mt-10">
              <ToolGrid base="/tools" t={t} />
            </div>
            <div className="mt-8 text-center">
              <ButtonLink href="/tools" variant="secondary" data-testid="home-tools-all">
                {t("tools.all")} →
              </ButtonLink>
            </div>
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

        <section id="mobile-app" aria-labelledby="mobile-app-title" className="scroll-mt-20 border-t border-stone-200 bg-gradient-to-b from-emerald-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-[1fr_auto]">
            <BlurFade>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <span aria-hidden>⏳</span> {t("landing.mobile.badge")}
              </span>
              <h2 id="mobile-app-title" className="mt-4 text-3xl font-bold tracking-tight">{t("landing.mobile.title")}</h2>
              <p className="mt-3 max-w-xl text-stone-600">{t("landing.mobile.body")}</p>
              <ul className="mt-5 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden className="text-emerald-700">✓</span>
                    {t(`landing.mobile.point${n}`)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-stone-700">
                <span aria-hidden>📲 </span>
                {t("landing.mobile.now")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href={viewer ? viewer.home : "/signup"}>{viewer ? t("landing.goDashboard") : t("landing.mobile.cta")}</ButtonLink>
                <ButtonLink href="/changelog#coming" variant="secondary">
                  {t("landing.mobile.roadmap")}
                </ButtonLink>
              </div>
            </BlurFade>
            {/* A simple phone outline with the app icon; decorative. */}
            <BlurFade delay={0.1} className="mx-auto max-md:hidden">
              <div aria-hidden className="relative h-[22rem] w-44 rounded-[2.2rem] border-[6px] border-stone-800 bg-white shadow-xl">
                <div className="absolute left-1/2 top-2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-stone-800" />
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="rounded-2xl" />
                  <span className="text-sm font-bold text-stone-900">FarmFlows</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">{t("landing.mobile.badge")}</span>
                </div>
              </div>
            </BlurFade>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-t border-stone-200">
          <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-full bg-radial-[at_75%_50%] from-emerald-200/40 to-transparent to-60% lg:w-2/3" />
          <HomeGlobe
            locale={locale}
            kicker={copy.kicker}
            title={copy.title}
            body={copy.body}
            center={copy.center}
            stats={stats}
            globeLabel={t("globe.label")}
          />
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
                    <p className="mt-2 text-3xl font-bold">{priceText(i18n, p, currency)}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {p.price_monthly === null ? t("plans.perMonthCustom") : t("plans.perMonth")}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-700">
                      {planFeatures(t, p).map((x) => (
                        <li key={x}>✓ {x}</li>
                      ))}
                      <li className="text-stone-500">✓ {t("plans.feat.vets")}</li>
                    </ul>
                    {/* Signed-in farmers manage their plan inside the app; doctors have no farm plan. */}
                    {(!viewer || viewer.profile?.account_type !== "doctor") && (
                      <ButtonLink
                        href={viewer ? "/dashboard/plan" : p.price_monthly === 0 ? "/signup" : `/signup?plan=${p.key}`}
                        variant={highlight ? "primary" : "secondary"}
                        className="mt-6 w-full"
                      >
                        {viewer
                          ? t("landing.managePlan")
                          : p.price_monthly === 0
                            ? t("plans.getStarted")
                            : t("plans.choose", { plan: planName(p, locale, p.key) })}
                      </ButtonLink>
                    )}
                  </div>
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </section>

        <div className="border-t border-stone-200">
          <ReviewsSection reviews={reviews} t={t} />
        </div>

        <FaqSection
          kicker={t("faq.kicker")}
          title={t("faq.title")}
          items={([1, 2, 3, 4, 5, 6] as const).map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }))}
        />

        <section className="px-4 pb-20">
          <BlurFade>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-emerald-900 px-6 py-14 text-center text-white sm:px-12">
              <AuroraBackground intensity="vivid" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.ctaTitle")}</h2>
                <p className="mx-auto mt-3 max-w-xl text-white/85">{t("landing.ctaBody")}</p>
                <ShimmerLink href={viewer ? viewer.home : "/signup"} className="mt-8 bg-amber-300 text-base text-emerald-950 shadow-black/20">
                  {viewer ? t("landing.goDashboard") : t("landing.ctaPrimary")}
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
