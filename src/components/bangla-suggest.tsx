"use client";

import { useEffect, useState } from "react";
import { LOCALE_COOKIE } from "@/lib/i18n/core";
import { isSitePath, localePath, rememberLocale } from "@/lib/i18n/paths";
import { useI18n } from "./i18n-provider";

const DISMISSED = "ff-bn-suggest-dismissed";

/**
 * On an English public page, visitors whose browser prefers Bangla see a small
 * "বাংলায় দেখুন" bar linking to the same page in Bangla. Nobody is redirected
 * automatically, so search engines and people who chose English keep English.
 */
export function BanglaSuggest() {
  const { locale } = useI18n();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (locale !== "en" || !isSitePath(window.location.pathname)) return;
    const prefersBn = (navigator.languages ?? [navigator.language]).some((l) => l?.toLowerCase().startsWith("bn"));
    const choseEnglish = document.cookie.split("; ").includes(`${LOCALE_COOKIE}=en`);
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {}
    if (!prefersBn || choseEnglish || dismissed) return;
    // Shown after the page has loaded, only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(localePath(window.location.pathname, "bn") + window.location.search);
  }, [locale]);

  if (!href) return null;
  const close = () => {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
    setHref(null);
  };
  return (
    <div lang="bn" role="region" aria-label="বাংলা" data-testid="bn-suggest" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-xl sm:bottom-5">
      <p className="min-w-0 flex-1 text-sm text-stone-700">এই পাতাটি বাংলাতেও আছে।</p>
      <a href={href} onClick={() => rememberLocale("bn")} className="shrink-0 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
        বাংলায় দেখুন
      </a>
      <button type="button" onClick={close} aria-label="বন্ধ করুন" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100">
        ✕
      </button>
    </div>
  );
}
