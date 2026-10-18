import Link from "next/link";
import { Fragment } from "react";
import { Avatar } from "@/components/avatar";
import { communityImageUrl, excerpt, postLang, type CommunityAuthor, type CommunityQuestion, type CommunityTopic } from "@/lib/community";
import type { I18n } from "@/lib/i18n/core";

/** Member text as plain paragraphs: no HTML, no links (keeps spam links out). */
export function PlainText({ text }: { text: string }) {
  return (
    <div lang={postLang(text)} className="grid gap-3 break-words leading-7 text-stone-800">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

export function PostImages({ images, alt }: { images: string[]; alt: string }) {
  if (!images.length) return null;
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {images.map((p, i) => (
        <li key={p}>
          <a href={communityImageUrl(p)} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element -- already resized WebP from storage */}
            <img
              src={communityImageUrl(p)}
              alt={`${alt} (${i + 1})`}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full rounded-lg border border-stone-200 bg-stone-100 object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function VetBadge({ t }: { t: I18n["t"] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
      <span aria-hidden>✓</span> {t("community.vetBadge")}
    </span>
  );
}

export function AuthorLine({ author, date, i18n }: { author?: CommunityAuthor; date: string; i18n: I18n }) {
  const { t, f } = i18n;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
      <Avatar url={author?.avatar_url} name={author?.full_name} size={28} />
      <span className="font-medium text-stone-800">{author?.full_name ?? t("community.member")}</span>
      {author?.is_vet && <VetBadge t={t} />}
      <span aria-hidden>·</span>
      <time dateTime={date}>{f.date(date)}</time>
    </div>
  );
}

export function QuestionCard({
  q,
  topic,
  author,
  i18n,
}: {
  q: CommunityQuestion;
  topic?: CommunityTopic;
  author?: CommunityAuthor;
  i18n: I18n;
}) {
  const { t, f, locale } = i18n;
  // A best answer that was later hidden no longer counts.
  const solved = !!q.best_answer_id && q.answer_count > 0;
  return (
    <article className="relative flex gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 sm:p-5">
      <div className="hidden w-20 shrink-0 flex-col items-center gap-1 text-center text-xs text-stone-600 sm:flex">
        <span
          className={`w-full rounded-lg px-2 py-1.5 ${
            solved ? "bg-emerald-700 text-white" : q.answer_count ? "border border-emerald-600 text-emerald-800" : "border border-stone-200"
          }`}
        >
          <span className="block text-lg font-bold">{f.number(q.answer_count)}</span>
          {t("community.answersShort")}
        </span>
        <span>👍 {f.number(q.helpful_count)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
          {topic && <span className="font-semibold uppercase tracking-wide text-emerald-700">{locale === "bn" ? topic.name_bn : topic.name_en}</span>}
          {solved && <span className="font-semibold text-emerald-700">✓ {t("community.solved")}</span>}
          <span className="sm:hidden">{t("community.answersCount", { n: q.answer_count })}</span>
        </p>
        <h2 lang={postLang(q.title)} className="mt-1 text-lg font-semibold text-stone-900">
          <Link href={`/community/q/${q.id}`} className="after:absolute after:inset-0 after:rounded-xl">
            {q.title}
          </Link>
        </h2>
        <p lang={postLang(q.body)} className="mt-1 line-clamp-2 text-sm text-stone-600">{excerpt(q.body, 220)}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <AuthorLine author={author} date={q.created_at} i18n={i18n} />
          {q.images.length > 0 && <span className="text-xs text-stone-500">📷 {f.number(q.images.length)}</span>}
        </div>
      </div>
    </article>
  );
}
