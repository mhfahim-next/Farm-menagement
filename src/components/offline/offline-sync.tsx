"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  isNetworkError,
  listEntries,
  markFailed,
  OUTBOX_EVENT,
  removeEntry,
  toFormData,
  type OutboxEntry,
} from "@/lib/offline/outbox";
import { OUTBOX_ACTIONS } from "./actions";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** This user's saved-offline entries, kept up to date as they are added, sent or discarded. */
export function useOutbox(userId: string) {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => listEntries(userId).then((e) => alive && setEntries(e));
    load();
    window.addEventListener(OUTBOX_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(OUTBOX_EVENT, load);
    };
  }, [userId]);
  return entries;
}

const WARM_KEY = "offline-warm-at";
const WARM_EVERY = 5 * 60_000;

/** Asks the service worker to keep a fresh copy of the quick-entry page (and its files) for offline use. */
function warmOfflinePage(force = false) {
  try {
    const last = Number(localStorage.getItem(WARM_KEY) ?? 0);
    if (!force && Date.now() - last < WARM_EVERY) return;
    navigator.serviceWorker?.ready.then((reg) => {
      reg.active?.postMessage({ type: "warm-offline" });
      localStorage.setItem(WARM_KEY, String(Date.now()));
    });
  } catch {}
}

/**
 * Sends saved-offline entries once the phone is back online, and shows a thin
 * status bar: offline, sending, entries waiting for another farm, or entries
 * the server refused. Mounted once in the dashboard layout.
 */
export function OfflineSync({ userId, farmId }: { userId: string; farmId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const online = useOnline();
  const entries = useOutbox(userId);
  const busy = useRef(false);
  const [sending, setSending] = useState(false);

  const flush = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    busy.current = true;
    setSending(true);
    let sent = 0;
    try {
      for (const entry of await listEntries(userId)) {
        if (entry.error || entry.farmId !== farmId) continue;
        try {
          const result = await OUTBOX_ACTIONS[entry.kind](null, toFormData(entry));
          if (result?.error) await markFailed(entry, result.error);
          else {
            await removeEntry(entry.id);
            sent++;
          }
        } catch (e) {
          if (isNetworkError(e)) break; // still offline: try again later
          await markFailed(entry, e instanceof Error ? e.message : String(e));
        }
      }
    } finally {
      busy.current = false;
      setSending(false);
    }
    if (sent > 0) router.refresh();
  }, [userId, farmId, router]);

  useEffect(() => {
    if (!online) return;
    flush();
    warmOfflinePage();
    const timer = setInterval(flush, 60_000);
    window.addEventListener(OUTBOX_EVENT, flush);
    return () => {
      clearInterval(timer);
      window.removeEventListener(OUTBOX_EVENT, flush);
    };
  }, [online, flush]);

  const here = entries.filter((e) => e.farmId === farmId);
  const waiting = here.filter((e) => !e.error).length;
  const failed = here.filter((e) => e.error).length;
  const otherFarms = [...new Set(entries.filter((e) => e.farmId !== farmId).map((e) => e.farmName))];

  const link = (
    <Link href="/dashboard/quick" className="font-medium underline">
      {t("offline.open")}
    </Link>
  );

  if (!online) {
    return (
      <div role="status" data-testid="offline-bar" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        📴 {t("offline.offlineBar")}
        {waiting > 0 && ` · ${t("offline.waiting", { n: waiting })}`} · {link}
      </div>
    );
  }
  if (waiting === 0 && failed === 0 && otherFarms.length === 0) return null;
  return (
    <div
      role="status"
      data-testid="offline-bar"
      className={`border-b px-4 py-2 text-center text-sm ${failed ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-900"}`}
    >
      {waiting > 0 && <span>{sending ? t("offline.sending", { n: waiting }) : t("offline.waiting", { n: waiting })} </span>}
      {failed > 0 && <span>⚠ {t("offline.failedBar", { n: failed })} </span>}
      {otherFarms.length > 0 && <span>{t("offline.otherFarm", { farm: otherFarms.join(", ") })} </span>}
      {link}
    </div>
  );
}
