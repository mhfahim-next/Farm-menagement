"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";

/** 1–5 star picker; submits as `name`. Keyboard: arrow keys move through the radio group. */
export function StarInput({ name, defaultValue = 5 }: { name: string; defaultValue?: number }) {
  const { t } = useI18n();
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div role="radiogroup" aria-label={t("review.rating")} className="flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => setValue(n)} className="peer sr-only" />
          <span className="sr-only">{t("review.stars", { n })}</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className={`size-8 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-emerald-600 ${n <= shown ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`}
          >
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
          </svg>
        </label>
      ))}
    </div>
  );
}

/** Read-only stars. */
export function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" aria-hidden className={`size-4 ${n <= rating ? "fill-amber-400" : "fill-stone-200"}`}>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}
