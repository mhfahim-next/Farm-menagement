import Link from "next/link";
import { FarmScene } from "@/components/farm-scene";
import { Logo } from "@/components/logo";
import { TextHoverEffect } from "@/components/velora/text-hover-effect";
import { getViewer } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { getSiteInfo, safe } from "@/lib/public-data";

/** Footer for public pages: link columns, a big FarmFlows wordmark, and a farm landscape underneath. */
export async function SiteFooter() {
  const { t } = await getI18n();
  const viewer = await getViewer();
  const info = await safe(() => getSiteInfo(), null);
  const year = new Date().getFullYear();

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("footer.product"),
      links: [
        { href: "/#features", label: t("footer.features") },
        { href: "/tools", label: t("tools.title") },
        { href: "/#pricing", label: t("footer.pricing") },
        { href: "/#mobile-app", label: t("footer.app") },
        { href: "/changelog", label: t("changelog.nav") },
      ],
    },
    {
      title: t("footer.learn"),
      links: [
        { href: "/blog", label: t("blog.nav") },
        { href: "/farm-management-software", label: t("footer.guide") },
        { href: "/community", label: t("community.nav") },
        { href: "/#reviews", label: t("footer.reviews") },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { href: "/contact", label: t("contact.title") },
        ...(viewer
          ? [{ href: viewer.home, label: t("landing.goDashboard") }]
          : [
              { href: "/signup", label: t("landing.startFree") },
              { href: "/login", label: t("landing.login") },
              { href: "/doctor/signup", label: t("footer.forDoctors") },
            ]),
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { href: "/terms", label: t("legal.terms") },
        { href: "/privacy", label: t("legal.privacy") },
        { href: "/delete-account", label: t("del.nav") },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-stone-200 bg-white" data-testid="site-footer">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 pb-6 pt-14 sm:grid-cols-4 sm:gap-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 max-w-sm sm:col-span-4 lg:col-span-1">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-stone-600">{t("footer.tagline")}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <span aria-hidden>🌾</span> {t("footer.madeFor")}
          </p>
          {(info?.contact_email || info?.contact_phone) && (
            <ul className="mt-4 space-y-1 text-sm">
              {info.contact_email && (
                <li>
                  <a href={`mailto:${info.contact_email}`} className="text-stone-600 hover:text-emerald-700">✉️ {info.contact_email}</a>
                </li>
              )}
              {info.contact_phone && (
                <li>
                  <a href={`tel:${info.contact_phone.replace(/[^\d+]/g, "")}`} className="text-stone-600 hover:text-emerald-700">📞 {info.contact_phone}</a>
                </li>
              )}
            </ul>
          )}
        </div>
        {columns.map((c) => (
          // Two columns side by side on phones, four in a row on wider screens.
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold text-stone-900">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-stone-600 transition-colors hover:text-emerald-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <TextHoverEffect text="FarmFlows" className="font-black" />
      </div>

      {/* Farming scene with the copyright line resting on the grass. */}
      <div className="relative -mt-6 h-40 sm:-mt-12 sm:h-56 lg:h-64">
        <FarmScene className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-900/60 to-transparent px-4 pb-3 pt-8 dark:from-black/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-white">
            <span>{t("landing.footer", { year })}</span>
            <span>{t("footer.rights")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
