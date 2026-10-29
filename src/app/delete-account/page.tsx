import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { getSiteInfo, safe } from "@/lib/public-data";
import { langAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t("del.title"), description: t("del.intro"), alternates: langAlternates("/delete-account", locale) };
}

/**
 * How to delete a FarmFlows account and what goes with it. Public (no login),
 * because Google Play asks for a web page where people can request deletion.
 */
export default async function DeleteAccountPage({ searchParams }: PageProps<"/delete-account">) {
  const { t, f } = await getI18n();
  const requested = (await searchParams).requested;
  const due = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : null;
  const [viewer, info] = await Promise.all([getViewer(), safe(() => getSiteInfo(), null)]);
  const list = (keys: MessageKey[]) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-stone-700">
      {keys.map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  );
  const steps = (keys: MessageKey[]) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-stone-700">
      {keys.map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ol>
  );
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14" data-testid="delete-account">
        <p className="text-sm font-semibold text-emerald-700">FarmFlows</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t("del.title")}</h1>
        <p className="mt-3 text-lg text-stone-600">{t("del.intro")}</p>
        {due && (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900" role="status" data-testid="delete-requested">
            {t("del.requested", { date: f.date(due) })}
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">⏳ {t("del.waitTitle")}</h2>
          <p className="mt-2 text-stone-700">{t("del.wait")}</p>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">📱 {t("del.appTitle")}</h2>
            {steps(["del.app1", "del.app2", "del.app3"])}
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">💻 {t("del.webTitle")}</h2>
            {steps(["del.web1", "del.web2", "del.web3"])}
            <div className="mt-4">
              <ButtonLink href={viewer ? "/dashboard/profile" : "/login?next=/dashboard/profile"} variant="secondary">
                {viewer ? t("del.goProfile") : t("del.login")}
              </ButtonLink>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">{t("del.helpTitle")}</h2>
          <p className="mt-2 text-amber-950/90">{t("del.help")}</p>
          {info?.contact_email && (
            <p className="mt-2 text-amber-950/90">
              {t("del.helpEmail", { email: info.contact_email })}
            </p>
          )}
          <div className="mt-4">
            <ButtonLink href="/contact" variant="secondary">
              {t("del.contact")}
            </ButtonLink>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">{t("del.deletedTitle")}</h2>
            {list(["del.deleted1", "del.deleted2", "del.deleted3"])}
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">{t("del.keptTitle")}</h2>
            {list(["del.kept1", "del.kept2", "del.kept3", "del.kept4"])}
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">{t("del.partialTitle")}</h2>
          <p className="mt-2 text-stone-700">{t("del.partial")}</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
