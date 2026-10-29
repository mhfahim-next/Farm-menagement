import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ToolGrid } from "@/components/tool-grid";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { DEFAULT_OG_IMAGE, langAlternates, SITE_NAME, SITE_URL } from "@/lib/site";
import { TOOLS, toolName } from "@/lib/tool-list";

const PATH = "/tools";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    title: t("tools.title"),
    description: t("tools.desc"),
    alternates: langAlternates(PATH, locale),
    openGraph: { title: t("tools.title"), description: t("tools.desc"), url: PATH, images: [DEFAULT_OG_IMAGE] },
  };
}

/** Free farm calculators, open to everyone (they bring farmers in from search). */
export default async function ToolsPage() {
  const { t, locale } = await getI18n();
  const viewer = await getViewer();
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("tools.title"),
          inLanguage: locale,
          itemListElement: TOOLS.map((tool, i) => ({ "@type": "ListItem", position: i + 1, name: t(toolName(tool.key)), url: `${SITE_URL}${PATH}/${tool.slug}` })),
        }}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("tools.title")}</h1>
        <p className="mt-3 max-w-2xl text-lg text-stone-600">{t("tools.desc")}</p>
        <div className="mt-8">
          <ToolGrid base="/tools" t={t} />
        </div>
        <section className="mt-12 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold text-emerald-950">{t("tools.ctaTitle")}</h2>
          <p className="mt-1 text-emerald-900">{t("tools.ctaBody")}</p>
          <ButtonLink href={viewer ? viewer.home : "/signup"} className="mt-4 rounded-full px-6">
            {viewer ? SITE_NAME : t("tools.ctaButton")}
          </ButtonLink>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
