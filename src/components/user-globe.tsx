"use client";

import dynamic from "next/dynamic";
import type { GlobeMarker } from "@/components/velora/globe";

// Canvas-only, so it is loaded in the browser after the rest of the page.
const Globe = dynamic(() => import("@/components/velora/globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="aspect-square w-full max-w-md animate-pulse rounded-full bg-stone-100" />,
});

export function UserGlobe({ markers, label, className }: { markers: GlobeMarker[]; label: string; className?: string }) {
  return (
    <Globe
      markers={markers}
      center={[23.7, 90.4]}
      speed={4}
      dotColor="var(--color-stone-400)"
      accentColor="var(--brand)"
      label={label}
      className={className}
    />
  );
}
