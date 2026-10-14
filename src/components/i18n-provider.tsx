"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createI18n, type I18n, type Locale, type Messages } from "@/lib/i18n/core";

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => createI18n(locale, messages), [locale, messages]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

/** `const { t, e, f, locale } = useI18n()` in client components. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
