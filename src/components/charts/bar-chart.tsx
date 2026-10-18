"use client";

import { useState } from "react";

export type BarDatum = { key: string; label: string; value: number };

/**
 * Single-series column chart (one hue, magnitude). Hover or focus a column
 * for its value; a visually hidden table carries the same numbers.
 */
export function BarChart({
  data,
  title,
  valueLabel,
  locale = "en",
  height = 160,
}: {
  data: BarDatum[];
  title: string;
  valueLabel: string;
  /** "bn" shows Bangla digits. */
  locale?: string;
  height?: number;
}) {
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");
  const format = (n: number) => nf.format(n);
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0];
  const a = active !== null ? data[active] : null;

  return (
    <figure className="relative">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex gap-2">
        {/* y axis */}
        <div className="flex flex-col justify-between py-0.5 text-right text-[11px] tabular-nums text-stone-400" style={{ height }}>
          {ticks.map((v, i) => (
            <span key={i}>{format(v)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* recessive grid */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between" style={{ height }}>
            {ticks.map((_, i) => (
              <div key={i} className="border-t border-dashed border-stone-200" />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setActive(null)}>
            {data.map((d, i) => {
              const h = d.value > 0 ? Math.max(3, (d.value / max) * height) : 0;
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-label={`${d.label}: ${format(d.value)} ${valueLabel}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group flex h-full min-w-0 flex-1 items-end outline-none"
                >
                  <span
                    className={`block w-full rounded-t-[4px] transition-colors ${active === i ? "bg-emerald-700" : "bg-emerald-500 group-focus-visible:bg-emerald-700"}`}
                    style={{ height: h }}
                  />
                </button>
              );
            })}
          </div>
          {a && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
            >
              <span className="block text-stone-500">{a.label}</span>
              <span className="font-semibold tabular-nums text-stone-900">
                {format(a.value)} {valueLabel}
              </span>
            </div>
          )}
          <div className="mt-1.5 flex justify-between text-[11px] text-stone-400">
            <span>{data[0]?.label}</span>
            <span>{data.at(-1)?.label}</span>
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
