import Link from "@/components/local-link";
import { Stars } from "@/components/star-input";
import { BlurFade } from "@/components/velora/blur-fade";
import type { I18n } from "@/lib/i18n/core";
import type { PublicReview } from "@/lib/public-data";

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
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-stone-900">{r.name}</span>
            {r.is_founder && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900" data-testid="review-founder">
                {t("reviews.founder")}
              </span>
            )}
          </div>
          {r.role && <div className="truncate text-stone-500">{r.role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

/**
 * Approved reviews, each exactly once in the page (no repeated copies for an
 * animation): a row that scrolls sideways on small screens. The founder's own
 * review carries a "Founder" label and is left out of the customer rating.
 */
export function ReviewsSection({ reviews, t }: { reviews: PublicReview[]; t: I18n["t"] }) {
  const customers = reviews.filter((r) => !r.is_founder);
  const avg = customers.reduce((s, r) => s + r.rating, 0) / Math.max(1, customers.length);

  return (
    <section id="reviews" className="relative isolate scroll-mt-20 overflow-hidden py-20">
      <div aria-hidden className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-72 max-w-4xl -translate-y-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="mx-auto max-w-2xl px-4 text-center">
        <BlurFade>
          <p className="text-sm font-semibold text-emerald-700">{t("reviews.kicker")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t("reviews.title")}</h2>
          {customers.length > 0 ? (
            <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-stone-600">
              <Stars rating={Math.round(avg)} label={t("review.stars", { n: Math.round(avg) })} />
              {t("reviews.summary", { avg: avg.toFixed(1), n: customers.length })}
            </p>
          ) : reviews.length > 0 ? null : (
            <p className="mx-auto mt-4 max-w-xl text-stone-600">{t("reviews.none")}</p>
          )}
        </BlurFade>
      </div>

      {reviews.length > 0 && (
        <ul
          className="mx-auto mt-12 flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] lg:flex-wrap lg:justify-center lg:overflow-visible"
          data-testid="reviews-list"
        >
          {reviews.map((r) => (
            <li key={r.id} className="snap-start">
              <ReviewCard r={r} t={t} />
            </li>
          ))}
        </ul>
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
