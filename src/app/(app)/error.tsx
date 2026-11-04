"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button, ButtonLink } from "@/components/ui";
import { reportError } from "@/lib/report-error";

/** Shown when a page fails: the error is reported and the farmer can try again. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-16 text-center" data-testid="error-page">
      <p className="text-5xl" aria-hidden>
        🐄💤
      </p>
      <h1 className="mt-5 text-2xl font-bold">{t("error.title")}</h1>
      <p className="mt-3 text-stone-600">{t("error.body")}</p>
      {error.digest && <p className="mt-2 text-xs text-stone-400">{t("error.code", { code: error.digest })}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          {t("error.retry")}
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          {t("error.home")}
        </ButtonLink>
      </div>
    </main>
  );
}
