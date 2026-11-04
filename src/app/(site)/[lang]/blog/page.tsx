import type { Metadata } from "next";
import { BlogCards, CategoryChips } from "@/components/blog-list";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { getBlogCategories, getPublishedPosts } from "@/lib/blog-data";
import { getI18n } from "@/lib/i18n/server";
import { localized, modifiedAt } from "@/lib/blog";
import { langAlternates, SITE_NAME, SITE_URL, siteUrl } from "@/lib/site";

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { t, locale } = await getI18n();
  const { q } = await searchParams;
  return {
    title: t("blog.metaTitle"),
    description: t("blog.desc"),
    alternates: langAlternates("/blog", locale),
    // Search result pages are thin duplicates: keep them out of the index.
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogIndexPage({ searchParams }: PageProps<"/[lang]/blog">) {
  const i18n = await getI18n();
  const { t } = i18n;
  const { q: rawQ } = await searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const [posts, categories] = await Promise.all([getPublishedPosts({ q }), getBlogCategories()]);

  const { locale } = i18n;
  return (
    <div className="flex flex-1 flex-col">
      {!q && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": ["Blog", "CollectionPage"],
            "@id": `${siteUrl("/blog", locale)}#blog`,
            name: t("blog.metaTitle"),
            description: t("blog.desc"),
            url: siteUrl("/blog", locale),
            inLanguage: locale,
            publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
            blogPost: posts.slice(0, 30).map((p) => {
              const v = localized(p, locale);
              return { "@type": "BlogPosting", headline: v.title, url: siteUrl(`/blog/${p.slug}`, locale), datePublished: p.published_at ?? p.created_at, dateModified: modifiedAt(p) };
            }),
          }}
        />
      )}
      <ScrollProgress />
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("blog.title")}</h1>
            <p className="mt-2 text-stone-600">{t("blog.desc")}</p>
          </div>
          <form role="search" action="/blog" className="flex w-full gap-2 sm:w-auto">
            <label htmlFor="blog-q" className="sr-only">{t("blog.search")}</label>
            <input
              id="blog-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("blog.searchPlaceholder")}
              className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base sm:w-64 sm:text-sm"
            />
            <button className="rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">{t("blog.search")}</button>
          </form>
        </div>
        <CategoryChips categories={categories} i18n={i18n} />

        {q && <p className="mt-6 text-sm text-stone-600">{t("blog.resultsFor", { n: posts.length, q })}</p>}
        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
            {q ? t("blog.noResults") : t("blog.empty")}
          </p>
        ) : (
          <BlogCards posts={posts} i18n={i18n} />
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
