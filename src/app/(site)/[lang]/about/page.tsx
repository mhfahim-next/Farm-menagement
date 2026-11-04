import type { Metadata } from "next";
import Link from "@/components/local-link";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { getI18n } from "@/lib/i18n/server";
import { DEFAULT_OG_IMAGE, langAlternates, ORGANIZATION, SITE_NAME, SITE_URL, siteUrl } from "@/lib/site";

// Static page, rebuilt at most once an hour (admin changes refresh it sooner).
export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    title: { absolute: t("about.metaTitle") },
    description: t("about.metaDesc"),
    alternates: langAlternates("/about", locale),
    openGraph: { type: "website", title: t("about.metaTitle"), description: t("about.metaDesc"), url: "/about", images: [DEFAULT_OG_IMAGE] },
  };
}

/** Who runs FarmFlows and how its guides and tools are made (the organisation; no personal names). */
export default async function AboutPage() {
  const { t, locale } = await getI18n();
  const section = (title: string, paras: string[]) => (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
      {paras.map((p, i) => (
        <p key={i} className="mt-3 leading-7 text-stone-700">
          {p}
        </p>
      ))}
    </section>
  );
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: t("about.title"),
          description: t("about.metaDesc"),
          url: siteUrl("/about", locale),
          inLanguage: locale,
          mainEntity: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
        }}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14" data-testid="about">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("about.title")}</h1>
        <p className="mt-4 text-lg leading-8 text-stone-700">{t("about.lead")}</p>
        {section(t("about.whatTitle"), [t("about.what1"), t("about.what2")])}
        {section(t("about.whoTitle"), [t("about.who1")])}
        {section(t("about.contentTitle"), [t("about.content1"), t("about.content2"), t("about.content3")])}
        {section(t("about.whereTitle"), [t("about.where1")])}
        <section className="mt-10 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold text-emerald-950">{t("about.contactTitle")}</h2>
          <p className="mt-2 text-emerald-900">{t("about.contactBody")}</p>
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-medium">
            <a href={`mailto:${ORGANIZATION.email}`} className="text-emerald-800 hover:underline">
              {ORGANIZATION.email}
            </a>
            <a href={`tel:${ORGANIZATION.phone.replace(/[\s-]/g, "")}`} className="text-emerald-800 hover:underline">
              {ORGANIZATION.phone}
            </a>
          </p>
          <p className="mt-3 flex flex-wrap gap-x-6 text-sm">
            <Link href="/contact" className="text-emerald-800 underline">
              {t("about.contactPage")}
            </Link>
            <Link href="/privacy" className="text-emerald-800 underline">
              {t("about.privacy")}
            </Link>
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
