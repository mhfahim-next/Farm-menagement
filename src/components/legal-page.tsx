import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { BlurFade } from "@/components/velora/blur-fade";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { getI18n } from "@/lib/i18n/server";
import { getSitePage, safe, type SitePage } from "@/lib/public-data";

/** Terms / privacy page; the text is edited by super admins (Admin → Pages). */
export async function LegalPage({ slug }: { slug: SitePage["slug"] }) {
  const { t, f, locale } = await getI18n();
  const page = await safe(() => getSitePage(slug), null);
  if (!page) notFound();
  const bn = locale === "bn";

  return (
    <div className="flex flex-1 flex-col">
      <ScrollProgress />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
        <BlurFade>
          <p className="text-sm font-semibold text-emerald-700">FarmFlows</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{bn ? page.title_bn : page.title_en}</h1>
          <p className="mt-2 text-sm text-stone-500">{t("legal.updated", { date: f.date(page.updated_at) })}</p>
        </BlurFade>
        <article lang={bn ? "bn" : "en"} className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <Markdown source={bn ? page.body_bn : page.body_en} />
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
