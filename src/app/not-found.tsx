import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("notFound.title"), robots: { index: false, follow: false } };
}

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
        <p className="text-7xl font-extrabold tracking-tight text-emerald-700 sm:text-8xl" aria-hidden>
          404
        </p>
        <p className="mt-2 text-5xl" aria-hidden>🐄</p>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{t("notFound.title")}</h1>
        <p className="mt-3 max-w-md text-stone-600">{t("notFound.body")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">{t("notFound.home")}</ButtonLink>
          <ButtonLink href="/blog" variant="secondary">{t("notFound.blog")}</ButtonLink>
          <ButtonLink href="/community" variant="secondary">{t("notFound.community")}</ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
