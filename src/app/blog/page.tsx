import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { BlurFade } from "@/components/velora/blur-fade";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { localized, type BlogPost } from "@/lib/blog";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("blog.title"), description: t("blog.desc"), alternates: { canonical: "/blog" } };
}

export default async function BlogIndexPage() {
  const { t, f, locale } = await getI18n();
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  const posts = (data ?? []) as BlogPost[];

  return (
    <div className="flex flex-1 flex-col">
      <ScrollProgress />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("blog.title")}</h1>
        <p className="mt-2 text-stone-500">{t("blog.desc")}</p>

        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">{t("blog.empty")}</p>
        ) : (
          <ul className="mt-8 grid gap-4">
            {posts.map((p, i) => {
              const v = localized(p, locale);
              return (
                <li key={p.id}>
                  <BlurFade delay={0.05 * i}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
                  >
                    <p className="text-xs text-stone-500">{f.date(p.published_at)}</p>
                    <h2 lang={v.lang} className="mt-1 text-xl font-semibold text-stone-900">{v.title}</h2>
                    {v.summary && <p lang={v.lang} className="mt-2 text-stone-600">{v.summary}</p>}
                    <span className="mt-3 inline-block text-sm font-medium text-emerald-700">{t("blog.read")} →</span>
                  </Link>
                  </BlurFade>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
