"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GlobeArc, GlobeMarker } from "@/components/velora/globe";
import { NumberTicker } from "@/components/velora/number-ticker";

const Globe = dynamic(() => import("@/components/velora/globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="aspect-square w-full max-w-[min(100%,32rem)] animate-pulse rounded-full bg-emerald-50" />,
});

// Bangladesh's divisional cities; arcs fan out from Dhaka.
const CITIES: { lat: number; lng: number; en: string; bn: string }[] = [
  { lat: 23.81, lng: 90.41, en: "Dhaka", bn: "ঢাকা" },
  { lat: 22.36, lng: 91.78, en: "Chattogram", bn: "চট্টগ্রাম" },
  { lat: 24.37, lng: 88.6, en: "Rajshahi", bn: "রাজশাহী" },
  { lat: 22.85, lng: 89.54, en: "Khulna", bn: "খুলনা" },
  { lat: 24.9, lng: 91.87, en: "Sylhet", bn: "সিলেট" },
  { lat: 25.74, lng: 89.25, en: "Rangpur", bn: "রংপুর" },
  { lat: 22.7, lng: 90.37, en: "Barishal", bn: "বরিশাল" },
  { lat: 24.75, lng: 90.41, en: "Mymensingh", bn: "ময়মনসিংহ" },
];

/** Velora "hero-globe" layout: copy + live numbers beside a dotted globe centred on Bangladesh. */
export function HomeGlobe({
  locale,
  kicker,
  title,
  body,
  stats,
  globeLabel,
}: {
  locale: "en" | "bn";
  kicker: string;
  title: string;
  body: string;
  stats: { value: number; label: string }[];
  globeLabel: string;
}) {
  const markers: GlobeMarker[] = useMemo(
    // The cities sit close together at globe scale, so only Dhaka is named; the rest are dots.
    () => CITIES.map((c, i) => ({ lat: c.lat, lng: c.lng, label: i === 0 ? (locale === "bn" ? c.bn : c.en) : undefined })),
    [locale],
  );
  const arcs: GlobeArc[] = useMemo(() => CITIES.slice(1).map((c) => ({ from: [CITIES[0].lat, CITIES[0].lng], to: [c.lat, c.lng] })), []);

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:gap-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-emerald-700">{kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          <span className="bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-transparent">{title}</span>
        </h2>
        <p className="mt-5 text-lg text-pretty text-stone-600">{body}</p>
        <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-stone-200 pt-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-1">
              <dt className="text-xs text-stone-500 sm:text-sm">{s.label}</dt>
              <dd className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                <NumberTicker value={s.value} locale={locale === "bn" ? "bn-BD" : "en-US"} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="relative flex justify-center">
        <Globe
          markers={markers}
          arcs={arcs}
          center={[22, 88]}
          speed={4}
          dotColor="var(--color-stone-400)"
          accentColor="var(--brand)"
          className="max-w-[min(100%,32rem)]"
          label={globeLabel}
        />
      </div>
    </div>
  );
}
