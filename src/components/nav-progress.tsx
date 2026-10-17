"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "./i18n-provider";
import { DotsLoader } from "./velora/loaders";

const EVENT = "farmflow:navigate";

/** Tell the loading bar a navigation started (for router.push calls made in code). */
export function announceNavigation() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/**
 * Global "something is loading" feedback: a bar at the top and a small pill,
 * shown from the moment a link or row is clicked until the new page arrives.
 * Pages keep showing the old content while the next one loads, so without
 * this a slow click looks like nothing happened.
 */
export function NavProgress() {
  const { t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [loading, setLoading] = useState(false);

  // The new page has arrived.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the route changes
    setLoading(false);
  }, [pathname, search]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      setLoading(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setLoading(false), 20_000); // never get stuck
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick);
    window.addEventListener(EVENT, start);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(EVENT, start);
      clearTimeout(timeout);
    };
  }, []);

  if (!loading) return null;
  return (
    <div data-testid="nav-progress" className="pointer-events-none fixed inset-x-0 top-0 z-[60]">
      <div className="nav-progress-bar h-1 bg-gradient-to-r from-brand-from via-brand-via to-brand-to" />
      <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-md">
        <DotsLoader size="sm" label={t("common.loading")} className="text-emerald-600" />
        {t("common.loading")}
      </div>
    </div>
  );
}
