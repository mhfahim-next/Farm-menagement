import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCards } from "@/components/blog-list";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { pickLang } from "@/lib/blog";
import { getPublishedPosts, getTagBySlug } from "@/lib/blog-data";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/blog/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  const { t, locale } = await getI18n();
  const name = pickLang(tag, "name", locale);
  const posts = await getPublishedPosts({ tagId: tag.id });
  return {
    title: t("blog.tagTitle", { name }),
    description: t("blog.tagDesc", { name }),
    alternates: langAlternates(`/blog/tag/${tag.slug}`, locale),
    // A tag with a single article would only duplicate that article.
    robots: posts.length < 2 ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogTagPage({ params }: PageProps<"/blog/tag/[slug]">) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const i18n = await getI18n();
  const { t, locale } = i18n;
  const posts = await getPublishedPosts({ tagId: tag.id });
  const name = pickLang(tag, "name", locale);

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <Link href="/blog" className="text-sm text-stone-600 hover:text-stone-900">← {t("blog.title")}</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">#{name}</h1>
        <p className="mt-2 text-stone-600">{t("blog.tagDesc", { name })}</p>
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
