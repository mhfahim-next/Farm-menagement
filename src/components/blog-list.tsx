import Link from "next/link";
import { BlurFade } from "@/components/velora/blur-fade";
import { imageUrl, localized, pickLang, readingMinutes, type BlogCategory, type BlogPostFull } from "@/lib/blog";
import type { I18n } from "@/lib/i18n/core";

/** Cover image of a post card, or a calm placeholder in the category colour. */
function CardCover({ post, locale, eager }: { post: BlogPostFull; locale: I18n["locale"]; eager: boolean }) {
  if (post.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- already resized WebP from storage
      <img
        src={imageUrl(post.cover.path)}
        alt={pickLang(post.cover, "alt", locale)}
        width={post.cover.width ?? 1600}
        height={post.cover.height ?? 900}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="aspect-[16/9] w-full rounded-t-xl bg-stone-100 object-cover"
      />
    );
  }
  return (
    <div aria-hidden className="grid aspect-[16/9] w-full place-items-center rounded-t-xl bg-gradient-to-br from-emerald-100 via-lime-50 to-amber-50 text-5xl">
      {post.category?.slug === "poultry" ? "🐔" : post.category?.slug === "feed-nutrition" ? "🌾" : post.category?.slug === "farm-business" ? "📒" : "🐄"}
    </div>
  );
}

/** Grid of article cards used by the blog index, category and tag pages. */
export function BlogCards({ posts, i18n }: { posts: BlogPostFull[]; i18n: I18n }) {
  const { t, f, locale } = i18n;
  return (
    <ul className="mt-8 grid gap-5 sm:grid-cols-2">
      {posts.map((p, i) => {
        const v = localized(p, locale);
        return (
          <li key={p.id} className={i === 0 && posts.length > 2 ? "sm:col-span-2" : undefined}>
            <BlurFade delay={0.04 * i} className="h-full">
              <article className="group relative flex h-full flex-col rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow">
                <CardCover post={p} locale={locale} eager={i === 0} />
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                    {p.category && (
                      <Link href={`/blog/category/${p.category.slug}`} className="relative z-10 font-semibold uppercase tracking-wide text-emerald-700 hover:underline">
                        {pickLang(p.category, "name", locale)}
                      </Link>
                    )}
                    <span>{f.date(p.published_at)}</span>
                    <span aria-hidden>·</span>
                    <span>{t("blog.minRead", { n: readingMinutes(v.body) })}</span>
                  </p>
                  <h2 lang={v.lang} className="mt-1.5 text-xl font-semibold text-stone-900">
                    <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
                      {v.title}
                    </Link>
                  </h2>
                  {v.summary && <p lang={v.lang} className="mt-2 line-clamp-3 text-stone-600">{v.summary}</p>}
                  <span className="mt-auto pt-3 text-sm font-medium text-emerald-700">{t("blog.read")} →</span>
                </div>
              </article>
            </BlurFade>
          </li>
        );
      })}
    </ul>
  );
}

/** Category chips above the article list. */
export function CategoryChips({ categories, active, i18n }: { categories: BlogCategory[]; active?: string; i18n: I18n }) {
  const { t, locale } = i18n;
  const chip = (href: string, label: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        on ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 text-stone-700 hover:border-emerald-600 hover:text-emerald-800"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label={t("blog.categories")} className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chip("/blog", t("blog.all"), !active)}
      {categories.map((c) => chip(`/blog/category/${c.slug}`, pickLang(c, "name", locale), active === c.slug))}
    </nav>
  );
}
