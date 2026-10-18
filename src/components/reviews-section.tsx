import Link from "next/link";
import { Stars } from "@/components/star-input";
import { BlurFade } from "@/components/velora/blur-fade";
import { Marquee } from "@/components/velora/marquee";
import type { I18n } from "@/lib/i18n/core";
import type { PublicReview } from "@/lib/public-data";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function ReviewCard({ r, t }: { r: PublicReview; t: I18n["t"] }) {
  return (
    <figure className="flex w-72 shrink-0 flex-col justify-between gap-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300 sm:w-96">
      <div>
        <Stars rating={r.rating} label={t("review.stars", { n: r.rating })} />
        <blockquote lang={r.lang} className="mt-4 text-sm leading-relaxed text-pretty text-stone-700 sm:text-base">
          <p>“{r.body}”</p>
        </blockquote>
      </div>
      <figcaption className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-from to-brand-to text-xs font-bold text-white">
          {initials(r.name)}
        </span>
        <div className="min-w-0 text-sm">
          <div className="truncate font-semibold text-stone-900">{r.name}</div>
          {r.role && <div className="truncate text-stone-500">{r.role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

/** Velora "testimonials-marquee": approved customer reviews in two rows drifting in opposite directions. */
export function ReviewsSection({ reviews, t }: { reviews: PublicReview[]; t: I18n["t"] }) {
  const half = Math.ceil(reviews.length / 2);
  const rows = reviews.length >= 4 ? [reviews.slice(0, half), reviews.slice(half)] : [reviews];
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length);

  return (
    <section id="reviews" className="relative isolate scroll-mt-20 overflow-hidden py-20">
      <div aria-hidden className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-72 max-w-4xl -translate-y-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="mx-auto max-w-2xl px-4 text-center">
        <BlurFade>
          <p className="text-sm font-semibold text-emerald-700">{t("reviews.kicker")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t("reviews.title")}</h2>
          {reviews.length > 0 ? (
            <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-stone-600">
              <Stars rating={Math.round(avg)} label={t("review.stars", { n: Math.round(avg) })} />
              {t("reviews.summary", { avg: avg.toFixed(1), n: reviews.length })}
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-xl text-stone-600">{t("reviews.none")}</p>
          )}
        </BlurFade>
      </div>

      {reviews.length > 0 && (
        <div className="mt-12 flex flex-col gap-5">
          {rows.map((row, i) => (
            <Marquee
              key={i}
              pauseOnHover
              reverse={i === 1}
              repeat={row.length < 3 ? 4 : 2}
              className={cn("py-1 [--gap:1.25rem]", i === 1 ? "[--duration:70s]" : "[--duration:60s]")}
            >
              {row.map((r) => (
                <ReviewCard key={r.id} r={r} t={t} />
              ))}
            </Marquee>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-stone-500">
        {t("reviews.writeCta")}{" "}
        <Link href="/dashboard/review" className="font-semibold text-emerald-700 hover:underline">
          {t("reviews.writeLink")}
        </Link>
      </p>
    </section>
  );
}
