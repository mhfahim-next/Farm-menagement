import type { Metadata } from "next";
import Link from "@/components/local-link";
import { QuestionCard } from "@/components/community/community-ui";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { SORTS, type Sort } from "@/lib/community";
import { getAuthors, getTopics, listQuestions, PAGE_SIZE } from "@/lib/community-data";
import { getI18n } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/paths";
import { notFound } from "next/navigation";
import { langAlternates, siteUrl } from "@/lib/site";
import { PromoBox } from "@/components/promo-box";
import { pickPromo } from "@/lib/promos";
import { getPromos } from "@/lib/public-data";
import { Fragment } from "react";

export type ListQuery = { topic?: string; q?: string; sort?: string; page?: string | number };

/** Address of a list view: the static pages when nothing but a topic is picked, else /community/list?… */
export function listHref({ topic, q, sort, page }: ListQuery) {
  const p = Number(page) || 1;
  const s = sort && sort !== "latest" ? sort : undefined;
  if (!q && !s && p === 1) return topic ? `/community/topic/${topic}` : "/community";
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (q) params.set("q", q);
  if (s) params.set("sort", s);
  if (p > 1) params.set("page", String(p));
  return `/community/list?${params}`;
}

/** Title, description and canonical of a list view (search, other orders and later pages stay out of search engines). */
export async function listMetadata(query: ListQuery): Promise<Metadata> {
  const { t, locale } = await getI18n();
  const topics = await getTopics();
  const tp = query.topic ? topics.find((x) => x.slug === query.topic) : undefined;
  const name = tp ? (locale === "bn" ? tp.name_bn : tp.name_en) : null;
  const href = listHref(query);
  const indexed = !href.startsWith("/community/list");
  return {
    title: name ? `${name} · ${t("community.title")}` : t("community.metaTitle"),
    description: t("community.metaDesc"),
    alternates: langAlternates(indexed ? href : tp ? `/community/topic/${tp.slug}` : "/community", locale),
    robots: indexed ? undefined : { index: false, follow: true },
  };
}

/**
 * The question list. /community and /community/topic/<slug> are static (first
 * page, newest activity); search, other orders and later pages are made per
 * request at /community/list?….
 */
export async function CommunityList(query: ListQuery) {
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const q = query.q?.trim() ?? "";
  const sort: Sort = SORTS.find((s) => s === query.sort) ?? "latest";
  const page = Math.max(1, Math.min(500, Number(query.page) || 1));
  const topics = await getTopics();
  const topic = query.topic ? topics.find((x) => x.slug === query.topic) : undefined;
  if (query.topic && !topic) notFound();

  const { questions, total } = await listQuestions({ topicId: topic?.id, q, sort, page });
  const [authors, promos] = await Promise.all([getAuthors(questions.map((x) => x.author_id)), getPromos()]);
  // One promo box in the list, after the fifth question (or after the last when fewer).
  const promo = questions.length ? pickPromo(promos, "community_list", { key: `${topic?.slug ?? ""}:${page}` }) : null;
  const promoAfter = Math.min(5, questions.length) - 1;
  const topicById = new Map(topics.map((x) => [x.id, x]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: ListQuery) => listHref({ topic: topic?.slug, q: q || undefined, sort, page, ...patch });
  const chip = (to: string, label: string, on: boolean) => (
    <Link
      key={to + label}
      href={to}
      aria-current={on ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        on ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 text-stone-700 hover:border-emerald-600 hover:text-emerald-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("community.title"),
          description: t("community.metaDesc"),
          url: siteUrl("/community", locale),
        }}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("community.title")}</h1>
            <p className="mt-2 max-w-2xl text-stone-600">{t("community.desc")}</p>
          </div>
          <ButtonLink href="/community/ask" className="rounded-full">+ {t("community.ask")}</ButtonLink>
        </div>

        <form role="search" action={localePath("/community/list", locale)} className="mt-6 flex gap-2">
          {topic && <input type="hidden" name="topic" value={topic.slug} />}
          <label htmlFor="community-q" className="sr-only">{t("community.search")}</label>
          <input
            id="community-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("community.searchPlaceholder")}
            className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base sm:text-sm"
          />
          <button className="rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">{t("community.search")}</button>
        </form>

        <nav aria-label={t("community.topics")} className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chip(href({ topic: undefined, page: 1 }), t("community.allTopics"), !topic)}
          {topics.map((x) => chip(href({ topic: x.slug, page: 1 }), locale === "bn" ? x.name_bn : x.name_en, topic?.id === x.id))}
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
          <nav aria-label={t("community.sortBy")} className="flex gap-1 text-sm">
            {SORTS.map((s) => (
              <Link
                key={s}
                href={href({ sort: s === "latest" ? undefined : s, page: 1 })}
                aria-current={s === sort ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 font-medium ${s === sort ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                {t(`community.sort.${s}`)}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-stone-500">{t("community.questionsCount", { n: f.number(total) })}</p>
        </div>

        {questions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-stone-300 p-8 text-center">
            <p className="text-stone-600">{q ? t("community.noResults") : t("community.empty")}</p>
            <ButtonLink href="/community/ask" className="mt-4">{t("community.askFirst")}</ButtonLink>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3">
            {questions.map((x, n) => (
              <Fragment key={x.id}>
                <li>
                  <QuestionCard q={x} topic={x.topic_id ? topicById.get(x.topic_id) : undefined} author={authors.get(x.author_id)} i18n={i18n} />
                </li>
                {promo && n === promoAfter && (
                  <li>
                    <PromoBox promo={promo} locale={locale} t={t} />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label={t("community.pages")} className="mt-8 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Link href={href({ page: page - 1 })} rel="prev" className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50">← {t("community.prev")}</Link>}
            <span className="text-stone-600">{t("community.pageOf", { page: f.number(page), pages: f.number(pages) })}</span>
            {page < pages && <Link href={href({ page: page + 1 })} rel="next" className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50">{t("community.next")} →</Link>}
          </nav>
        )}

        <aside className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">{t("community.rulesTitle")}</p>
          <p className="mt-1">{t("community.rulesBody")}</p>
        </aside>
      </main>
      <PublicFooter />
    </div>
  );
}
