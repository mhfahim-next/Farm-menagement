"use client";

import { useTransition } from "react";
import { sendSentryTest } from "@/app/admin/actions";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button } from "./ui";

/** Super admin: buttons that send a test error from the server and from this browser. */
export function SentryTest({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const server = () =>
    start(async () => {
      const r = await sendSentryTest();
      if (r?.error) toast("error", r.error);
      else if (r?.success) toast("success", r.success);
    });

  const browser = () =>
    start(async () => {
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(new Error("FarmFlows Sentry test (browser)"));
        const ok = await Sentry.flush(5000);
        toast(ok ? "success" : "error", ok ? t("adminsentry.sent") : t("adminsentry.failed"));
      } catch {
        toast("error", t("adminsentry.failed"));
      }
    });

  return (
    <div className="flex flex-wrap gap-2" data-testid="sentry-test">
      <Button type="button" variant="secondary" onClick={server} disabled={!enabled || pending}>
        {t("adminsentry.testServer")}
      </Button>
      <Button type="button" variant="secondary" onClick={browser} disabled={!enabled || pending}>
        {t("adminsentry.testBrowser")}
      </Button>
    </div>
  );
}
