import type { Metadata } from "next";
import { DiseaseGuide } from "@/components/disease-guide";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { DISEASES } from "@/lib/diseases";
import { getI18n } from "@/lib/i18n/server";
import { DEFAULT_OG_IMAGE, langAlternates, SITE_NAME, SITE_URL, siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    title: t("dis.metaTitle"),
    description: t("dis.metaDesc"),
    alternates: langAlternates("/diseases", locale),
    openGraph: { title: t("dis.metaTitle"), description: t("dis.metaDesc"), url: "/diseases", images: [DEFAULT_OG_IMAGE] },
  };
}

/** Public disease guide with the symptom checker. */
export default async function DiseasesPage() {
  const { t, locale } = await getI18n();
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("dis.title"),
          itemListElement: DISEASES.map((d, i) => ({ "@type": "ListItem", position: i + 1, url: siteUrl(`/diseases/${d.slug}`, locale), name: locale === "bn" ? d.name.bn : d.name.en })),
        }}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
        <p className="text-sm font-medium text-emerald-700">{SITE_NAME}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{t("dis.title")}</h1>
        <p className="mt-2 max-w-2xl text-stone-600">{t("dis.intro")}</p>
        <div className="mt-6">
          <DiseaseGuide t={t} locale={locale} base="/diseases" />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
