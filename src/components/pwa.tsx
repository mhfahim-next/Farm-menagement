"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./i18n-provider";
import { Button } from "./ui";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "pwa-install-dismissed";

/** Registers the service worker (production only). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * "Install FarmFlows" banner. Chrome/Android shows the native install prompt;
 * on iPhone it explains Share → Add to Home Screen. Hidden once installed
 * or dismissed.
 */
export function InstallBanner() {
  const { t } = useI18n();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only facts read once after mount */
    setIos(isIos);
    setHidden(standalone || readDismissed());
    /* eslint-enable react-hooks/set-state-in-effect */

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!event && !ios)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div
      data-testid="install-banner"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900"
    >
      <span className="min-w-0 flex-1">{event ? t("pwa.installBody") : t("pwa.iosBody")}</span>
      <span className="flex items-center gap-2">
        {event && (
          <Button
            type="button"
            className="px-3 py-1.5"
            onClick={async () => {
              await event.prompt();
              const { outcome } = await event.userChoice;
              if (outcome === "accepted") setHidden(true);
              setEvent(null);
            }}
          >
            {t("pwa.installButton")}
          </Button>
        )}
        <button type="button" onClick={dismiss} className="rounded px-2 py-1 text-emerald-800 hover:bg-emerald-100" aria-label={t("pwa.dismiss")}>
          {t("pwa.dismiss")}
        </button>
      </span>
    </div>
  );
}
