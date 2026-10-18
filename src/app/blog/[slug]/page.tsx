import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { BlogCards } from "@/components/blog-list";
import { BLOG_IMAGE_PREFIX, imageUrl, localized, pickLang, POST_SELECT, readingMinutes, type BlogImage, type BlogPostFull } from "@/lib/blog";
import { getRelatedPosts } from "@/lib/blog-data";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { JsonLd } from "@/components/json-ld";
import { langAlternates, SITE_NAME, SITE_URL } from "@/lib/site";

async function load(slug: string) {
  const supabase = await createClient();
  // RLS: visitors only get published posts; super admins can also preview drafts.
  const { data } = await supabase.from("blog_posts").select(POST_SELECT).eq("slug", slug).maybeSingle();
  return data as unknown as BlogPostFull | null;
}

/** Library rows for the images an article embeds (for sizes and alt text). */
async function embeddedImages(body: string) {
  const paths = [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith(BLOG_IMAGE_PREFIX))
    .map((u) => u.slice(BLOG_IMAGE_PREFIX.length));
  if (!paths.length) return new Map<string, BlogImage>();
  const supabase = await createClient();
  const { data } = await supabase.from("blog_images").select("*").in("path", paths);
  return new Map(((data ?? []) as BlogImage[]).map((i) => [i.path, i]));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return {};
  const { locale } = await getI18n();
  const v = localized(post, locale);
  const image = post.cover
    ? { url: imageUrl(post.cover.path), width: post.cover.width ?? undefined, height: post.cover.height ?? undefined, alt: pickLang(post.cover, "alt", locale) }
    : { url: `/blog/${post.slug}/og`, width: 1200, height: 630, alt: v.title };
  return {
    title: v.title,
    keywords: post.tags.map((x) => pickLang(x.tag, "name", locale)),
    description: v.summary ?? undefined,
    alternates: langAlternates(`/blog/${post.slug}`, locale),
    robots: post.published ? undefined : { index: false },
    openGraph: {
      title: v.title,
      description: v.summary ?? undefined,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      section: post.category ? pickLang(post.category, "name", locale) : undefined,
      tags: post.tags.map((x) => pickLang(x.tag, "name", locale)),
      images: [image],
    },
    twitter: { card: "summary_large_image", images: [image.url] },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) notFound();
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const v = localized(post, locale);
  const [images, related] = await Promise.all([embeddedImages(v.body), post.published ? getRelatedPosts(post) : []]);
  const minutes = readingMinutes(v.body);
  const categoryName = post.category ? pickLang(post.category, "name", locale) : null;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="flex flex-1 flex-col">
      <ScrollProgress />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link href="/blog" className="text-sm text-stone-500 hover:text-stone-900">
          ← {t("blog.title")}
        </Link>
        {!post.published && (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{t("blog.draftNotice")}</p>
        )}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("blog.title"), item: `${SITE_URL}/blog` },
              ...(post.category
                ? [{ "@type": "ListItem", position: 2, name: categoryName, item: `${SITE_URL}/blog/category/${post.category.slug}` }]
                : []),
              { "@type": "ListItem", position: post.category ? 3 : 2, name: v.title, item: url },
            ],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: v.title,
            description: v.summary ?? undefined,
            inLanguage: v.lang,
            datePublished: post.published_at ?? post.created_at,
            dateModified: post.updated_at ?? post.published_at ?? post.created_at,
            mainEntityOfPage: url,
            url,
            image: post.cover ? [imageUrl(post.cover.path)] : [`${url}/og`],
            articleSection: categoryName ?? undefined,
            keywords: post.tags.map((x) => pickLang(x.tag, "name", locale)).join(", ") || undefined,
            wordCount: v.body.split(/\s+/).filter(Boolean).length,
            timeRequired: `PT${minutes}M`,
            author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` } },
          }}
        />
        <article lang={v.lang} className="mt-4">
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-stone-600">
            {post.category && (
              <Link href={`/blog/category/${post.category.slug}`} className="font-semibold uppercase tracking-wide text-emerald-700 hover:underline">
                {categoryName}
              </Link>
            )}
            <time dateTime={post.published_at ?? post.created_at}>{f.date(post.published_at ?? post.created_at)}</time>
            <span aria-hidden>·</span>
            <span>{t("blog.minRead", { n: minutes })}</span>
          </p>
          <h1 className="mt-1 break-words text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{v.title}</h1>
          {v.summary && <p className="mt-3 text-lg text-stone-600">{v.summary}</p>}
          {post.cover && (
            <figure className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- resized WebP from storage; the main image of the page */}
              <img
                src={imageUrl(post.cover.path)}
                alt={pickLang(post.cover, "alt", locale)}
                width={post.cover.width ?? undefined}
                height={post.cover.height ?? undefined}
                fetchPriority="high"
                className="h-auto w-full rounded-2xl border border-stone-200 bg-stone-100"
              />
              {pickLang(post.cover, "caption", locale) && (
                <figcaption className="mt-2 text-center text-sm text-stone-500">{pickLang(post.cover, "caption", locale)}</figcaption>
              )}
            </figure>
          )}
          <div className="mt-6 border-t border-stone-200 pt-2">
            <Markdown source={v.body} images={images} locale={locale} />
          </div>
          {post.tags.length > 0 && (
            <ul aria-label={t("blog.tags")} className="mt-8 flex flex-wrap gap-2 border-t border-stone-200 pt-5">
              {post.tags.map(({ tag }) => (
                <li key={tag.id}>
                  <Link href={`/blog/tag/${tag.slug}`} className="inline-block rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800">
                    #{pickLang(tag, "name", locale)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-stone-900">{t("blog.ctaTitle")}</p>
          <p className="mt-1 text-stone-600">{t("blog.ctaBody")}</p>
          <ButtonLink href="/signup" className="mt-4">{t("landing.startFree")}</ButtonLink>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-12">
            <h2 id="related" className="text-2xl font-bold tracking-tight text-stone-900">{t("blog.related")}</h2>
            <BlogCards posts={related} i18n={i18n} />
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
