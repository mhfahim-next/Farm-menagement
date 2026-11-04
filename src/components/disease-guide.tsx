import Link from "next/link";
import { DiseaseChecker } from "@/components/disease-checker";
import { DISEASE_SPECIES, DISEASES, SYMPTOMS, symptomsFor, type Bi, type Disease } from "@/lib/diseases";
import type { I18n, Locale } from "@/lib/i18n/core";

const pick = (b: Bi, locale: Locale) => (locale === "bn" ? b.bn : b.en);

/** The checker and the list of all diseases by animal (public /diseases and /dashboard/diseases). */
export function DiseaseGuide({ t, locale, base }: { t: I18n["t"]; locale: Locale; base: "/diseases" | "/dashboard/diseases" }) {
  const species = DISEASE_SPECIES.map((s) => ({ key: s, label: t(`dis.species.${s}`), symptoms: symptomsFor(s).map((id) => ({ id, label: pick(SYMPTOMS[id], locale) })) }));
  const diseases = DISEASES.map((d) => ({ slug: d.slug, name: pick(d.name, locale), species: d.species, symptoms: d.symptoms, urgent: d.urgent, zoonotic: d.zoonotic }));
  return (
    <div className="grid gap-8">
      <DiseaseChecker species={species} diseases={diseases} base={base} />
      {DISEASE_SPECIES.map((s) => (
        <section key={s}>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">{t(`dis.list.${s}`)}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {DISEASES.filter((d) => d.species.includes(s)).map((d) => (
              <li key={d.slug}>
                <Link href={`${base}/${d.slug}`} className="block h-full rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-600" data-testid={`dis-card-${d.slug}`}>
                  <span className="font-semibold text-stone-900">{pick(d.name, locale)}</span>
                  <Badges d={d} t={t} />
                  <span className="mt-1 block text-sm text-stone-600">{pick(d.summary, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Badges({ d, t }: { d: Disease; t: I18n["t"] }) {
  if (!d.urgent && !d.zoonotic && !d.vaccine) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1.5 text-xs">
      {d.urgent && <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800">{t("dis.urgent")}</span>}
      {d.zoonotic && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">{t("dis.zoonotic")}</span>}
      {d.vaccine && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">{t("dis.vaccine")}</span>}
    </span>
  );
}

/** One disease: signs, what to do now, prevention, and where to get a vet. */
export function DiseaseArticle({ d, t, locale, vetHref, base }: { d: Disease; t: I18n["t"]; locale: Locale; vetHref: string; base: string }) {
  const list = (items: Bi[], testId: string) => (
    <ul className="list-disc space-y-1.5 pl-5 text-stone-800" data-testid={testId}>
      {items.map((x, i) => (
        <li key={i}>{pick(x, locale)}</li>
      ))}
    </ul>
  );
  return (
    <article className="grid gap-6" data-testid="disease-article">
      <div>
        <p className="text-sm text-stone-500">{d.species.map((s) => t(`dis.species.${s}`)).join(" · ")}</p>
        {d.aka && <p className="mt-1 text-sm text-stone-600">{t("dis.aka", { names: pick(d.aka, locale) })}</p>}
        <Badges d={d} t={t} />
        <p className="mt-3 text-lg text-stone-800">{pick(d.summary, locale)}</p>
      </div>
      {(d.urgent || d.zoonotic || d.report) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" data-testid="dis-warning">
          {d.urgent && <p className="font-semibold">{t("dis.urgentNote")}</p>}
          {d.zoonotic && <p className="mt-1">{t("dis.zoonoticNote")}</p>}
          {d.report && <p className="mt-1">{t("dis.reportNote")}</p>}
        </div>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-stone-900">{t("dis.signs")}</h2>
        {list(d.signs, "dis-signs")}
        <p className="mt-3 text-sm text-stone-600">
          {t("dis.checkList")}: {d.symptoms.map((s) => pick(SYMPTOMS[s], locale)).join(" · ")}
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-stone-900">{t("dis.todo")}</h2>
        {list(d.todo, "dis-todo")}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-stone-900">{t("dis.prevent")}</h2>
        {list(d.prevent, "dis-prevent")}
      </section>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-5">
        <div>
          <p className="font-semibold text-emerald-950">{t("dis.vetTitle")}</p>
          <p className="text-sm text-emerald-900">{t("dis.vetBody")}</p>
        </div>
        <Link href={vetHref} className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800" data-testid="dis-find-vet">
          {t("dis.findVet")}
        </Link>
      </section>
      <p className="text-xs text-stone-500">{t("dis.notDiagnosis")}</p>
      <Link href={base} className="text-sm font-medium text-emerald-700 hover:underline">
        ← {t("dis.all")}
      </Link>
    </article>
  );
}
