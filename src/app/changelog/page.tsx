import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { BlurFade } from "@/components/velora/blur-fade";
import { ButtonLink } from "@/components/ui";
import { RELEASES, UPCOMING, type ChangeType, type UpcomingStatus } from "@/lib/changelog";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    title: t("changelog.metaTitle"),
    description: t("changelog.metaDesc"),
    alternates: langAlternates("/changelog", locale),
  };
}

const TYPE_STYLE: Record<ChangeType, string> = {
  new: "bg-emerald-100 text-emerald-800",
  improved: "bg-sky-100 text-sky-800",
  fixed: "bg-amber-100 text-amber-800",
};
const STATUS_STYLE: Record<UpcomingStatus, string> = {
  next: "bg-emerald-700 text-white",
  planned: "bg-sky-100 text-sky-800",
  exploring: "bg-stone-200 text-stone-700",
};

export default async function ChangelogPage() {
  const { t, f, locale } = await getI18n();
  const pick = (x: { en: string; bn: string }) => (locale === "bn" ? x.bn : x.en);

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("changelog.title")}</h1>
        <p className="mt-2 max-w-2xl text-stone-600">{t("changelog.desc")}</p>
        <nav aria-label={t("changelog.title")} className="mt-5 flex flex-wrap gap-2 text-sm">
          <a href="#coming" className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-800">{t("changelog.jumpComing")}</a>
          <a href="#released" className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-800">{t("changelog.jumpReleased")}</a>
        </nav>

        <section id="coming" aria-labelledby="coming-title" className="mt-10 scroll-mt-24">
          <h2 id="coming-title" className="text-2xl font-bold tracking-tight text-stone-900">{t("changelog.comingTitle")}</h2>
          <p className="mt-1 text-sm text-stone-500">{t("changelog.comingNote")}</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {UPCOMING.map((u, i) => (
              <li key={u.title.en}>
                <BlurFade delay={0.03 * i} className="h-full">
                  <article className="flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[u.status]}`}>
                      {t(`changelog.status.${u.status}`)}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-stone-900">{pick(u.title)}</h3>
                    <p className="mt-1 text-stone-600">{pick(u.body)}</p>
                  </article>
                </BlurFade>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {t("changelog.ideaPrompt")}{" "}
            <Link href="/contact" className="font-semibold underline">{t("changelog.ideaContact")}</Link>{" · "}
            <Link href="/community" className="font-semibold underline">{t("community.title")}</Link>
          </p>
        </section>

        <section id="released" aria-labelledby="released-title" className="mt-14 scroll-mt-24">
          <h2 id="released-title" className="text-2xl font-bold tracking-tight text-stone-900">{t("changelog.releasedTitle")}</h2>
          <ol className="mt-6 border-l-2 border-emerald-200 pl-5 sm:pl-8">
            {RELEASES.map((r) => (
              <li key={r.id} id={r.id} className="relative scroll-mt-24 pb-10 last:pb-0">
                <span aria-hidden className="absolute -left-[1.78rem] top-1.5 size-3 rounded-full border-2 border-white bg-emerald-600 ring-2 ring-emerald-200 sm:-left-[2.53rem]" />
                <time dateTime={r.date} className="text-sm font-medium text-emerald-800">{f.date(r.date)}</time>
                <h3 className="mt-0.5 text-xl font-semibold text-stone-900">
                  <a href={`#${r.id}`} className="hover:underline">{pick(r.title)}</a>
                </h3>
                <p className="mt-1 text-stone-600">{pick(r.summary)}</p>
                <ul className="mt-3 grid gap-2.5">
                  {r.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-0.5 w-[4.6rem] shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${TYPE_STYLE[c.type]}`}>
                        {t(`changelog.type.${c.type}`)}
                      </span>
                      <span className="min-w-0 text-stone-700">{pick(c)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

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
