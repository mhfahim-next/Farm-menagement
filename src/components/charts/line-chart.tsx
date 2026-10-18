"use client";

import { useState } from "react";

export type LinePoint = { key: string; x: number; label: string; value: number };

/**
 * Single-series line over time (one hue, 2px line, 8px markers with a surface
 * ring). Hover or focus shows the nearest point; a hidden table repeats the data.
 */
export function LineChart({
  points,
  title,
  unit,
  locale = "en",
  height = 170,
}: {
  points: LinePoint[];
  title: string;
  unit: string;
  locale?: string;
  height?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 });
  const W = 600;
  const H = height;
  const pad = { l: 8, r: 8, t: 12, b: 8 };
  const xs = points.map((p) => p.x);
  const vs = points.map((p) => p.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  // Some headroom so the line never sits on the frame.
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || Math.max(10, hi * 0.1);
  const yMin = Math.max(0, lo - span * 0.15);
  const yMax = hi + span * 0.15;
  const px = (x: number) => pad.l + (maxX === minX ? (W - pad.l - pad.r) / 2 : ((x - minX) / (maxX - minX)) * (W - pad.l - pad.r));
  const py = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.value).toFixed(1)}`).join(" ");
  const a = active !== null ? points[active] : null;

  const nearest = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(px(p.x) - x) < Math.abs(px(points[best].x) - x)) best = i;
    });
    return best;
  };

  return (
    <figure className="relative">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-stone-400">
        <span>
          {nf.format(yMax)} {unit}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[170px] w-full touch-none"
        role="img"
        aria-label={title}
        tabIndex={0}
        onPointerMove={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1));
          if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? points.length) - 1));
        }}
        onBlur={() => setActive(null)}
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)} className="stroke-stone-200" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path} fill="none" className="stroke-emerald-600" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {a && <line x1={px(a.x)} x2={px(a.x)} y1={pad.t} y2={H - pad.b} className="stroke-stone-300" vectorEffect="non-scaling-stroke" />}
      </svg>
      {/* Markers as HTML so they stay round when the SVG stretches. */}
      {points.map((p, i) => (
        <span
          key={p.key}
          aria-hidden
          className={`pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${active === i ? "size-3 bg-emerald-700" : "bg-emerald-600"}`}
          style={{ left: `${(px(p.x) / W) * 100}%`, top: `calc(1.25rem + ${(py(p.value) / H) * 170}px)` }}
        />
      ))}
      {a && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${Math.min(88, Math.max(12, (px(a.x) / W) * 100))}%`, top: `calc(1.25rem + ${(py(a.value) / H) * 170 - 10}px)` }}
        >
          <span className="block text-stone-500">{a.label}</span>
          <span className="font-semibold tabular-nums text-stone-900">
            {nf.format(a.value)} {unit}
          </span>
        </div>
      )}
      <div className="mt-1.5 flex justify-between text-[11px] text-stone-400">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>
                {nf.format(p.value)} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
