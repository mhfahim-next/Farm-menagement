"use client";

import { useSyncExternalStore } from "react";
import { currencyFor, type Currency } from "@/lib/payments";

/** Cookie the proxy sets from the hosting edge's geo header (two-letter country code). */
export const COUNTRY_COOKIE = "ff-cc";

function read(): string | null {
  // ?cc=IN previews the page for another country.
  const cc = new URLSearchParams(window.location.search).get("cc");
  if (cc && /^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
  const c = document.cookie.split("; ").find((x) => x.startsWith(`${COUNTRY_COOKIE}=`));
  const v = c?.slice(COUNTRY_COOKIE.length + 1);
  return v && /^[A-Z]{2}$/.test(v) ? v : null;
}

const noop = () => () => {};

/**
 * The visitor's country in the browser, null when unknown (and in the static
 * HTML, so the first render matches the server).
 */
export function useVisitorCountry() {
  return useSyncExternalStore(noop, read, () => null);
}

/**
 * Taka in Bangladesh, dollars elsewhere. Until the country is known (no
 * JavaScript, search engines, local development) the page's language decides:
 * Bangla pages show taka, English pages dollars.
 */
export function useVisitorCurrency(fallback: Currency): Currency {
  const country = useVisitorCountry();
  return country ? currencyFor(country) : fallback;
}

/** A price in both currencies; shows the visitor's one. */
export function GeoPrice({ bdt, usd, fallback }: { bdt: string; usd: string; fallback: Currency }) {
  return <>{useVisitorCurrency(fallback) === "USD" ? usd : bdt}</>;
}
