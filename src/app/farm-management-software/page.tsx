import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { GUIDE } from "@/lib/seo-content";
import { DEFAULT_OG_IMAGE, langAlternates, SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/farm-management-software";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const title = GUIDE.metaTitle[locale];
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description: GUIDE.metaDescription[locale],
    alternates: langAlternates(PATH, locale),
    openGraph: { title, description: GUIDE.metaDescription[locale], type: "article", url: PATH, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function FarmManagementSoftwarePage() {
  const { t, locale } = await getI18n();
  const viewer = await getViewer();
  const g = (x: { en: string; bn: string }) => x[locale];
  const url = `${SITE_URL}${PATH}`;

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${url}#page`,
              url,
              name: g(GUIDE.metaTitle),
              description: g(GUIDE.metaDescription),
              inLanguage: locale,
              isPartOf: { "@id": `${SITE_URL}/#website` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
                { "@type": "ListItem", position: 2, name: g(GUIDE.h1), item: url },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: GUIDE.faq.map((i) => ({ "@type": "Question", name: g(i.q), acceptedAnswer: { "@type": "Answer", text: g(i.a) } })),
            },
            {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android, iOS",
              url: SITE_URL,
              offers: { "@type": "Offer", price: 0, priceCurrency: "BDT", name: "Free plan" },
            },
          ],
        }}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-900">{SITE_NAME}</Link> <span aria-hidden>/</span> <span>{t("seo.guideCrumb")}</span>
        </nav>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{g(GUIDE.h1)}</h1>
        <p className="mt-4 text-lg text-stone-600">{g(GUIDE.intro)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={viewer ? viewer.home : "/signup"} className="rounded-full px-6">
            {viewer ? t("landing.goDashboard") : t("landing.startFree")}
          </ButtonLink>
          <ButtonLink href="/#features" variant="secondary" className="rounded-full px-6">{t("footer.features")}</ButtonLink>
        </div>

        <section aria-labelledby="what" className="mt-12">
          <h2 id="what" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.whatTitle)}</h2>
          <p className="mt-3 leading-8 text-stone-700">{g(GUIDE.whatBody)}</p>
        </section>

        <section aria-labelledby="track" className="mt-12">
          <h2 id="track" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.trackTitle)}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {GUIDE.track.map((x) => (
              <li key={x.title.en} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-stone-900">{g(x.title)}</h3>
                <p className="mt-1 text-sm text-stone-600">{g(x.body)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="free" className="mt-12">
          <h2 id="free" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.freeTitle)}</h2>
          <p className="mt-3 leading-8 text-stone-700">{g(GUIDE.freeBody)}</p>
        </section>

        <section aria-labelledby="compare" className="mt-12">
          <h2 id="compare" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.compareTitle)}</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  {GUIDE.compareHead[locale].map((h, i) => (
                    <th key={i} scope="col" className={`px-3 py-2 font-semibold ${i === 3 ? "text-emerald-800" : "text-stone-800"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {GUIDE.compareRows.map((row, r) => (
                  <tr key={r}>
                    {row[locale].map((c, i) => (
                      i === 0 ? (
                        <th key={i} scope="row" className="px-3 py-2 font-medium text-stone-800">{c}</th>
                      ) : (
                        <td key={i} className={`px-3 py-2 ${i === 3 ? "font-medium text-emerald-800" : "text-stone-600"}`}>{c}</td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="choose" className="mt-12">
          <h2 id="choose" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.chooseTitle)}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-stone-700 marker:font-semibold marker:text-emerald-700">
            {GUIDE.choose.map((x) => (
              <li key={x.en} className="leading-7">{g(x)}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="start" className="mt-12">
          <h2 id="start" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.startTitle)}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-stone-700 marker:font-semibold marker:text-emerald-700">
            {GUIDE.start.map((x) => (
              <li key={x.en} className="leading-7">{g(x)}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold tracking-tight text-stone-900">{g(GUIDE.faqTitle)}</h2>
          <div className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {GUIDE.faq.map((i) => (
              <details key={i.q.en} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-stone-900">
                  {g(i.q)}
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-stone-600">{g(i.a)}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-stone-600">
          {t("seo.readMore")}{" "}
          <Link href="/blog" className="font-medium text-emerald-700 underline">{t("blog.title")}</Link>{" · "}
          <Link href="/community" className="font-medium text-emerald-700 underline">{t("community.title")}</Link>{" · "}
          <Link href="/changelog" className="font-medium text-emerald-700 underline">{t("changelog.nav")}</Link>
        </p>

        <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-stone-900">{g(GUIDE.ctaTitle)}</p>
          <p className="mt-1 text-stone-600">{g(GUIDE.ctaBody)}</p>
          <ButtonLink href={viewer ? viewer.home : "/signup"} className="mt-4">{viewer ? t("landing.goDashboard") : t("landing.startFree")}</ButtonLink>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
