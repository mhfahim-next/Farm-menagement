import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCards, CategoryChips } from "@/components/blog-list";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { pickLang } from "@/lib/blog";
import { getBlogCategories, getCategoryBySlug, getPublishedPosts } from "@/lib/blog-data";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates, SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const { t, locale } = await getI18n();
  const name = pickLang(category, "name", locale);
  return {
    title: `${name} · ${t("blog.title")}`,
    description: pickLang(category, "description", locale) || t("blog.desc"),
    alternates: langAlternates(`/blog/category/${category.slug}`, locale),
  };
}

export default async function BlogCategoryPage({ params }: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const [posts, categories] = await Promise.all([getPublishedPosts({ categoryId: category.id }), getBlogCategories()]);
  const name = pickLang(category, "name", locale);
  const description = pickLang(category, "description", locale);

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("blog.title"), item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 2, name, item: `${SITE_URL}/blog/category/${category.slug}` },
          ],
        }}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <Link href="/blog" className="text-sm text-stone-600 hover:text-stone-900">← {t("blog.title")}</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{name}</h1>
        {description && <p className="mt-2 max-w-2xl text-stone-600">{description}</p>}
        <CategoryChips categories={categories} active={category.slug} i18n={i18n} />
        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">{t("blog.empty")}</p>
        ) : (
          <BlogCards posts={posts} i18n={i18n} />
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
