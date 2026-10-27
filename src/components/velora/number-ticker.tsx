"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  startValue?: number;
  /** Seconds to wait after entering the viewport */
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  /** Number format locale, e.g. "bn-BD" for Bangla digits (FarmFlows addition). */
  locale?: string;
}

/** Counts up to `value` once it scrolls into view (plain requestAnimationFrame, ease-out). */
export function NumberTicker({
  value,
  startValue = 0,
  delay = 0,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  locale = "en-US",
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
    const show = (n: number) => {
      el.textContent = `${prefix}${fmt.format(n)}${suffix}`;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      show(value);
      return;
    }
    let frame = 0;
    let timer = 0;
    const run = () => {
      const start = performance.now();
      const duration = 1400;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        show(startValue + (value - startValue) * eased);
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(run, delay * 1000);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, startValue, delay, decimalPlaces, prefix, suffix, locale]);

  const initial = `${prefix}${new Intl.NumberFormat(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(startValue)}${suffix}`;
  const final = `${prefix}${new Intl.NumberFormat(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(value)}${suffix}`;
  return (
    <span data-slot="number-ticker" className={cn("inline-block tabular-nums", className)} {...props}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden>
        {initial}
      </span>
    </span>
  );
}
