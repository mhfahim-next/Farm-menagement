import { JsonLd } from "@/components/json-ld";
import { BlurFade } from "@/components/velora/blur-fade";

/** Velora-style FAQ accordion, plus FAQPage structured data so search engines can show the answers. */
export function FaqSection({ title, kicker, items }: { title: string; kicker: string; items: { q: string; a: string }[] }) {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-stone-200 bg-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <div className="mx-auto max-w-3xl px-4 py-20">
        <BlurFade>
          <p className="text-center text-sm font-semibold text-emerald-700">{kicker}</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{title}</h2>
        </BlurFade>
        <div className="mt-10 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {items.map((i, n) => (
            <details key={n} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden" open={n === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-stone-900">
                {i.q}
                <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-stone-600">{i.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
