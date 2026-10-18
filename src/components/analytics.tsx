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
    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer,
      visitor,
      locale: document.documentElement.lang,
    });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
