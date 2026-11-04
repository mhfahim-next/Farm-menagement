import Link from "@/components/local-link";
import { localized, type BlogPost } from "@/lib/blog";
import type { I18n } from "@/lib/i18n/core";
import { createPublicClient } from "@/lib/supabase/public";
import { TOOL_GUIDES } from "@/lib/tool-guides";
import type { ToolSlug } from "@/lib/tool-list";
import type { ToolParams } from "@/lib/tools";

/** The published blog article a tool links to (title in the reader's language), or null. */
export async function guideArticle(slug: ToolSlug) {
  const blog = TOOL_GUIDES[slug].blog;
  if (!blog) return null;
  const { data } = await createPublicClient().from("blog_posts").select("slug, title_en, title_bn, body_en, body_bn").eq("slug", blog).eq("published", true).maybeSingle();
  return data as Pick<BlogPost, "slug" | "title_en" | "title_bn" | "body_en" | "body_bn"> | null;
}

/** How the tool works, its formula, a worked example, a short FAQ and its blog article (public tool pages). */
export function ToolGuide({ slug, params, i18n, article }: { slug: ToolSlug; params: ToolParams; i18n: I18n; article: Awaited<ReturnType<typeof guideArticle>> }) {
  const { t, f, locale } = i18n;
  const g = TOOL_GUIDES[slug];
  const ex = g.example(params, locale, (v, d) => f.number(v, d), (iso) => f.date(iso));
  const title = article ? localized(article as BlogPost, locale).title : null;
  return (
    <div className="mt-10 grid gap-8 text-stone-700" data-testid="tool-guide">
      <section>
        <h2 className="text-xl font-semibold text-stone-900">{t("tguide.how")}</h2>
        {g.how.map((p, i) => (
          <p key={i} className="mt-3 leading-7">
            {p[locale]}
          </p>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-semibold text-stone-900">{t("tguide.formula")}</h2>
        <ul className="mt-3 space-y-2">
          {g.formula.map((x, i) => (
            <li key={i} className="rounded-lg bg-stone-100 px-4 py-2 font-medium text-stone-800">
              {x[locale]}
            </li>
          ))}
        </ul>
      </section>
      {ex && (
        <section data-testid="tool-example">
          <h2 className="text-xl font-semibold text-stone-900">{t("tguide.example")}</h2>
          <p className="mt-3 leading-7">{ex.setup}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6">
            {ex.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-950">{ex.result}</p>
        </section>
      )}
      <section data-testid="tool-faq">
        <h2 className="text-xl font-semibold text-stone-900">{t("tguide.faq")}</h2>
        <div className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {g.faq.map((x, i) => (
            <details key={i} className="group p-4" open={i === 0}>
              <summary className="cursor-pointer font-medium text-stone-900">{x.q[locale]}</summary>
              <p className="mt-2 leading-7">{x.a[locale]}</p>
            </details>
          ))}
        </div>
      </section>
      {article && title && (
        <p className="rounded-xl border border-stone-200 bg-white p-4" data-testid="tool-article">
          <span className="text-sm text-stone-500">{t("tguide.read")}</span>
          <br />
          <Link href={`/blog/${article.slug}`} className="font-semibold text-emerald-700 hover:underline">
            {title} →
          </Link>
        </p>
      )}
    </div>
  );
}
