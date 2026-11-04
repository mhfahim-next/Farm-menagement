import type { Metadata } from "next";
import Link from "@/components/local-link";
import { notFound } from "next/navigation";
import { DiseaseArticle } from "@/components/disease-guide";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { getViewer } from "@/lib/auth";
import { DISEASES, diseaseBySlug } from "@/lib/diseases";
import { getI18n } from "@/lib/i18n/server";
import { DEFAULT_OG_IMAGE, langAlternates, SITE_NAME, SITE_URL, siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return DISEASES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/diseases/[slug]">): Promise<Metadata> {
  const d = diseaseBySlug((await params).slug);
  if (!d) return {};
  const { t, locale } = await getI18n();
  const name = locale === "bn" ? d.name.bn : d.name.en;
  const summary = locale === "bn" ? d.summary.bn : d.summary.en;
  const path = `/diseases/${d.slug}`;
  return {
    title: t("dis.pageTitle", { name }),
    description: summary.length > 158 ? `${summary.slice(0, 155).trimEnd()}…` : summary,
    alternates: langAlternates(path, locale),
    openGraph: { type: "article", title: name, description: summary, url: path, images: [DEFAULT_OG_IMAGE] },
  };
}

/** One disease, public (SEO): signs, what to do now, prevention, find a vet. */
export default async function DiseasePage({ params }: PageProps<"/[lang]/diseases/[slug]">) {
  const d = diseaseBySlug((await params).slug);
  if (!d) notFound();
  const [{ t, locale }, viewer] = await Promise.all([getI18n(), getViewer()]);
  const name = locale === "bn" ? d.name.bn : d.name.en;
  const url = siteUrl(`/diseases/${d.slug}`, locale);
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Article", headline: name, description: locale === "bn" ? d.summary.bn : d.summary.en, inLanguage: locale, url, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL } },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: siteUrl("/", locale) },
                { "@type": "ListItem", position: 2, name: t("dis.title"), item: siteUrl("/diseases", locale) },
                { "@type": "ListItem", position: 3, name, item: url },
              ],
            },
          ],
        }}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link href="/diseases" className="text-sm font-medium text-emerald-700 hover:underline">
          ← {t("dis.all")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{name}</h1>
        <div className="mt-4">
          <DiseaseArticle d={d} t={t} locale={locale} base="/diseases" vetHref={viewer && viewer.home !== "/doctor" ? "/dashboard/doctors" : "/signup"} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
