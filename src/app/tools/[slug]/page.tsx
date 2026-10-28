import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FarmTool } from "@/components/farm-tools";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates, SITE_NAME, SITE_URL } from "@/lib/site";
import { TOOLS, toolBySlug, toolName, toolShort } from "@/lib/tool-list";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const tool = toolBySlug((await params).slug);
  if (!tool) return {};
  const { t, locale } = await getI18n();
  const path = `/tools/${tool.slug}`;
  return {
    title: t(toolName(tool.key)),
    description: `${t(toolShort(tool.key))}. ${t("tools.desc")}`,
    alternates: langAlternates(path, locale),
    openGraph: { title: t(toolName(tool.key)), description: t(toolShort(tool.key)), url: path },
  };
}

/** One free calculator, open to everyone. Signed-in farmers use the same tool from their dashboard. */
export default async function PublicToolPage({ params }: PageProps<"/tools/[slug]">) {
  const tool = toolBySlug((await params).slug);
  if (!tool) notFound();
  const { t, locale } = await getI18n();
  const viewer = await getViewer();
  const url = `${SITE_URL}/tools/${tool.slug}`;
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: t(toolName(tool.key)),
              description: t(toolShort(tool.key)),
              url,
              inLanguage: locale,
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "BDT" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
                { "@type": "ListItem", position: 2, name: t("tools.title"), item: `${SITE_URL}/tools` },
                { "@type": "ListItem", position: 3, name: t(toolName(tool.key)), item: url },
              ],
            },
          ],
        }}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link href="/tools" className="text-sm font-medium text-emerald-700 hover:underline">
          ← {t("tools.all")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          <span aria-hidden>{tool.icon} </span>
          {t(toolName(tool.key))}
        </h1>
        <p className="mt-2 text-stone-600">{t(toolShort(tool.key))}</p>
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <FarmTool slug={tool.slug} today={today()} />
        </div>
        <section className="mt-10 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-950">{t("tools.ctaTitle")}</h2>
          <p className="mt-1 text-emerald-900">{t("tools.ctaBody")}</p>
          <ButtonLink href={viewer ? `${viewer.home === "/doctor" ? "/doctor" : "/dashboard/tools/" + tool.slug}` : "/signup"} className="mt-4 rounded-full px-6">
            {viewer ? SITE_NAME : t("tools.ctaButton")}
          </ButtonLink>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
