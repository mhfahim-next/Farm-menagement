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

// Dairy hubs of major milk-producing countries. Denmark and Ireland sit next to the
// Netherlands at globe scale, so they are dots without a name (quiet: true).
const DAIRY_HUBS: { lat: number; lng: number; en: string; bn: string; quiet?: boolean }[] = [
  { lat: 22.56, lng: 72.95, en: "Anand, India", bn: "আনন্দ, ভারত" },
  { lat: 31.52, lng: 74.36, en: "Lahore, Pakistan", bn: "লাহোর, পাকিস্তান" },
  { lat: 6.93, lng: 79.85, en: "Colombo, Sri Lanka", bn: "কলম্বো, শ্রীলঙ্কা" },
  { lat: 52.37, lng: 4.9, en: "Amsterdam, Netherlands", bn: "আমস্টারডাম, নেদারল্যান্ডস" },
  { lat: 43.07, lng: -89.4, en: "Wisconsin, USA", bn: "উইসকনসিন, যুক্তরাষ্ট্র" },
  { lat: -37.79, lng: 175.28, en: "Hamilton, New Zealand", bn: "হ্যামিলটন, নিউজিল্যান্ড" },
  { lat: 55.68, lng: 12.57, en: "Copenhagen, Denmark", bn: "কোপেনহেগেন, ডেনমার্ক", quiet: true },
  { lat: 51.9, lng: -8.47, en: "Cork, Ireland", bn: "কর্ক, আয়ারল্যান্ড", quiet: true },
  { lat: -37.81, lng: 144.96, en: "Victoria, Australia", bn: "ভিক্টোরিয়া, অস্ট্রেলিয়া" },
  { lat: -21.76, lng: -43.35, en: "Minas Gerais, Brazil", bn: "মিনাস জেরাইস, ব্রাজিল" },
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
    () => [
      // Bangladesh's cities sit close together at globe scale, so only Dhaka is named; the rest are dots.
      ...CITIES.map((c, i) => ({ lat: c.lat, lng: c.lng, label: i === 0 ? (locale === "bn" ? c.bn : c.en) : undefined })),
      ...DAIRY_HUBS.map((c) => ({ lat: c.lat, lng: c.lng, label: c.quiet ? undefined : locale === "bn" ? c.bn : c.en })),
    ],
    [locale],
  );
  const arcs: GlobeArc[] = useMemo(
    () =>
      [...CITIES.slice(1), ...DAIRY_HUBS].map((c) => ({ from: [CITIES[0].lat, CITIES[0].lng] as [number, number], to: [c.lat, c.lng] as [number, number] })),
    [],
  );

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
          center={[24, 70]}
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
