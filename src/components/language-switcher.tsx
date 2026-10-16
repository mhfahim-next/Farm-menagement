"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/core";
import { useI18n } from "./i18n-provider";

/** Switches between English and Bangla. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const options: Locale[] = ["en", "bn"];

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={`inline-flex rounded-lg border border-stone-200 p-0.5 text-sm ${pending ? "opacity-60" : ""} ${className}`}
    >
      {options.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={locale === l}
          onClick={() => locale !== l && startTransition(() => setLocale(l))}
          className={`rounded-md px-2.5 py-1.5 font-medium sm:py-1 transition-colors ${
            locale === l
              ? "bg-emerald-700 text-white max-sm:hidden"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          }`}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
