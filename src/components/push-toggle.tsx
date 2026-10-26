"use client";

import { useEffect, useState, useTransition } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush, type PushSub } from "@/app/dashboard/notifications/actions";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner } from "./ui";

type State = "loading" | "unsupported" | "ios" | "denied" | "off" | "on";

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  // The service worker is registered on every page in production; make sure it is here too.
  await navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => null);
  return navigator.serviceWorker.ready;
}

/** Turns phone / browser notifications on or off for this device. */
export function PushToggle({ vapidKey }: { vapidKey: string | null }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [state, setState] = useState<State>("loading");
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      let next: State;
      if (!supported) {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        next = ios ? "ios" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        next = sub ? "on" : "off";
      }
      if (!cancelled) setState(next);
    })().catch(() => !cancelled && setState("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!vapidKey) return <p className="text-sm text-stone-500">{t("notif.pushOff")}</p>;
  if (state === "loading") return <Spinner />;
  if (state === "unsupported") return <p className="text-sm text-stone-500">{t("notif.pushUnsupported")}</p>;
  if (state === "ios") return <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">{t("notif.pushIos")}</p>;
  if (state === "denied") return <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("notif.pushDenied")}</p>;

  const turnOn = () =>
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "denied" : "off");
          return;
        }
        const reg = await registration();
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) }));
        const result = await savePushSubscription(JSON.parse(JSON.stringify(sub)) as PushSub, navigator.userAgent);
        if (result?.error) {
          toast("error", result.error);
          return;
        }
        setState("on");
        toast("success", t("notif.pushOn"));
      } catch {
        toast("error", t("notif.pushFailed"));
      }
    });

  const turnOff = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe().catch(() => false);
      }
      setState("off");
    });

  const test = () =>
    start(async () => {
      const r = await sendTestPush();
      if (r?.error) toast("error", r.error);
      else if (r?.success) toast("success", r.success);
    });

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="push-toggle" data-state={state}>
      {state === "on" ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">✓ {t("notif.pushOn")}</span>
          <Button type="button" variant="secondary" onClick={test} disabled={pending} data-testid="push-test">
            {t("notif.pushTest")}
          </Button>
          <Button type="button" variant="ghost" onClick={turnOff} disabled={pending}>
            {t("notif.pushDisable")}
          </Button>
        </>
      ) : (
        <Button type="button" onClick={turnOn} disabled={pending} data-testid="push-enable">
          {pending && <Spinner className="mr-2" />}🔔 {t("notif.pushEnable")}
        </Button>
      )}
    </div>
  );
}
