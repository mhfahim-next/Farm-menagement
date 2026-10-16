import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { localized, type BlogPost } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

async function load(slug: string) {
  const supabase = await createClient();
  // RLS: visitors only get published posts; super admins can also preview drafts.
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  return data as BlogPost | null;
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return {};
  const { locale } = await getI18n();
  const v = localized(post, locale);
  return { title: v.title, description: v.summary ?? undefined, openGraph: { title: v.title, description: v.summary ?? undefined, type: "article" } };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) notFound();
  const { t, f, locale } = await getI18n();
  const v = localized(post, locale);

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link href="/blog" className="text-sm text-stone-500 hover:text-stone-900">
          ← {t("blog.title")}
        </Link>
        {!post.published && (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{t("blog.draftNotice")}</p>
        )}
        <article lang={v.lang} className="mt-4">
          <p className="text-sm text-stone-500">{f.date(post.published_at ?? post.created_at)}</p>
          <h1 className="mt-1 break-words text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{v.title}</h1>
          {v.summary && <p className="mt-3 text-lg text-stone-600">{v.summary}</p>}
          <div className="mt-6 border-t border-stone-200 pt-2">
            <Markdown source={v.body} />
          </div>
        </article>

        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-stone-900">{t("blog.ctaTitle")}</p>
          <p className="mt-1 text-stone-600">{t("blog.ctaBody")}</p>
          <ButtonLink href="/signup" className="mt-4">{t("landing.startFree")}</ButtonLink>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
