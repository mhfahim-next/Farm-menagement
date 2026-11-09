import { imageUrl } from "@/lib/blog";
import type { I18n, Locale } from "@/lib/i18n/core";
import { promoHref, type Promo } from "@/lib/promos";

/**
 * One promo box: a FarmFlows promotion or a sponsor banner. Plain HTML, no
 * scripts: the click goes through /api/promo/<id> (counted there). Sponsor
 * links are marked rel="sponsored" for search engines and always labelled.
 */
export function PromoBox({ promo, locale, t, className = "" }: { promo: Promo; locale: Locale; t: I18n["t"]; className?: string }) {
  const bn = locale === "bn";
  const title = bn ? promo.title_bn : promo.title_en;
  const body = bn ? promo.body_bn : promo.body_en;
  const cta = bn ? promo.cta_bn : promo.cta_en;
  const sponsor = promo.kind === "sponsor";
  const outside = !promo.url.startsWith("/");
  return (
    <aside
      aria-label={sponsor ? t("promo.sponsored") : t("promo.fromUs")}
      data-testid="promo-box"
      data-promo={promo.id}
      className={`not-prose rounded-xl border p-4 sm:p-5 ${sponsor ? "border-stone-300 bg-stone-50" : "border-emerald-200 bg-emerald-50"} ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {sponsor ? t("promo.sponsoredBy", { name: promo.sponsor_name ?? "" }) : t("promo.fromUs")}
      </p>
      <div className="mt-2 flex items-start gap-4">
        {promo.image_path && (
          // eslint-disable-next-line @next/next/no-img-element -- small picture from the blog library, fixed size (no layout shift)
          <img src={imageUrl(promo.image_path)} alt="" width={96} height={96} loading="lazy" className="size-20 shrink-0 rounded-lg border border-stone-200 bg-white object-cover sm:size-24" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{title}</p>
          {body && <p className="mt-1 text-sm text-stone-700">{body}</p>}
          <a
            href={promoHref(promo, locale)}
            rel={sponsor ? "sponsored noopener" : "nofollow"}
            target={outside ? "_blank" : undefined}
            className={`mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white ${sponsor ? "bg-stone-800 hover:bg-stone-900" : "bg-emerald-700 hover:bg-emerald-800"}`}
          >
            {cta} {outside ? "↗" : "→"}
          </a>
        </div>
      </div>
    </aside>
  );
}
