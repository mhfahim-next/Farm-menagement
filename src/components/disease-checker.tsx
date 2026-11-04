"use client";

import Link from "@/components/local-link";
import { useState } from "react";
import { useI18n } from "./i18n-provider";

export type CheckerDisease = { slug: string; name: string; species: string[]; symptoms: string[]; urgent: boolean; zoonotic: boolean };
export type CheckerSpecies = { key: string; label: string; symptoms: { id: string; label: string }[] };

/**
 * Pick the animal and tick what you see: the diseases that fit best are listed
 * (most signs matched first, then the share of the disease's signs). Same
 * order as matchDiseases() in src/lib/diseases.ts, done here on slim data.
 */
export function DiseaseChecker({ species, diseases, base }: { species: CheckerSpecies[]; diseases: CheckerDisease[]; base: string }) {
  const { t } = useI18n();
  const [sp, setSp] = useState(species[0]?.key ?? "cattle");
  const [seen, setSeen] = useState<string[]>([]);
  const current = species.find((s) => s.key === sp) ?? species[0];
  const toggle = (id: string) => setSeen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const picked = new Set(seen);
  const results = diseases
    .filter((d) => d.species.includes(sp))
    .map((d) => {
      const matched = d.symptoms.filter((s) => picked.has(s)).length;
      return { d, matched, share: matched / d.symptoms.length };
    })
    .filter((m) => m.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.share - a.share || Number(b.d.urgent) - Number(a.d.urgent))
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6" data-testid="disease-checker">
      <h2 className="text-lg font-semibold text-stone-900">{t("dis.checkerTitle")}</h2>
      <p className="mt-1 text-sm text-stone-600">{t("dis.checkerBody")}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={t("dis.animal")}>
        {species.map((s) => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={sp === s.key}
            onClick={() => {
              setSp(s.key);
              setSeen([]);
            }}
            data-testid={`dis-species-${s.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${sp === s.key ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {current?.symptoms.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={picked.has(s.id)}
            onClick={() => toggle(s.id)}
            data-testid={`dis-sym-${s.id}`}
            className={`rounded-lg border px-3 py-1.5 text-left text-sm ${picked.has(s.id) ? "border-amber-600 bg-amber-50 font-medium text-amber-900" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
          >
            {picked.has(s.id) ? "✓ " : ""}
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-5" aria-live="polite">
        {seen.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">{t("dis.pickSigns")}</p>
        ) : results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">{t("dis.noMatch")}</p>
        ) : (
          <ol className="grid gap-2" data-testid="dis-results">
            {results.map(({ d, matched }) => (
              <li key={d.slug}>
                <Link href={`${base}/${d.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 hover:border-emerald-600 hover:bg-emerald-50" data-testid={`dis-result-${d.slug}`}>
                  <span>
                    <span className="font-semibold text-stone-900">{d.name}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
                      {d.urgent && <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800">{t("dis.urgent")}</span>}
                      {d.zoonotic && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">{t("dis.zoonotic")}</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-stone-600">{t("dis.matched", { n: matched, of: d.symptoms.length })}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-stone-500">{t("dis.notDiagnosis")}</p>
      </div>
    </section>
  );
}
