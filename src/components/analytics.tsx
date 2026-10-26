"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const KEY = "ff_vid";

/** Sends one tiny page-view beacon per page (first-party, no cookies for visitors, honours Do Not Track). */
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (navigator.doNotTrack === "1") return;
    let visitor = "";
    try {
      visitor = localStorage.getItem(KEY) ?? "";
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem(KEY, visitor);
      }
    } catch {
      /* storage blocked */
    }
    // Campaign tags from links such as ?utm_source=facebook&utm_campaign=day3 (kept short).
    const q = new URLSearchParams(window.location.search);
    const tag = (k: string) => (q.get(k) ?? "").slice(0, 80);
    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer,
      visitor,
      locale: document.documentElement.lang,
      utm_source: tag("utm_source"),
      utm_medium: tag("utm_medium"),
      utm_campaign: tag("utm_campaign"),
    });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
