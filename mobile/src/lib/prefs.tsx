// Language and light/dark choice, remembered on the phone.
import { getLocales } from "expo-localization";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { formatDate, formatMoney, formatMonth, formatNumber, isLocale, translate, type Locale } from "./i18n/core";
import type { MessageKey } from "./i18n/en";
import { getItem, KEYS, setItem } from "./storage";

export type ThemeMode = "system" | "light" | "dark";

type Prefs = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  dark: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  n: (v: number, digits?: number) => string;
  money: (v: number, currency: string) => string;
  date: (iso: string | null | undefined, short?: boolean) => string;
  month: (iso: string | null | undefined) => string;
};

const Ctx = createContext<Prefs | null>(null);

function firstLocale(): Locale {
  const saved = getItem(KEYS.locale);
  if (isLocale(saved)) return saved;
  // Bangla when the phone is set to Bangla or the region is Bangladesh.
  const l = getLocales()[0];
  return l?.languageCode === "bn" || l?.regionCode === "BD" ? "bn" : "en";
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(firstLocale);
  const [themeMode, setThemeState] = useState<ThemeMode>(() => {
    const v = getItem(KEYS.theme);
    return v === "light" || v === "dark" ? v : "system";
  });
  const scheme = useColorScheme();
  const dark = themeMode === "system" ? scheme === "dark" : themeMode === "dark";

  const setLocale = useCallback((l: Locale) => {
    setItem(KEYS.locale, l);
    setLocaleState(l);
  }, []);
  const setThemeMode = useCallback((m: ThemeMode) => {
    setItem(KEYS.theme, m);
    setThemeState(m);
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      locale,
      setLocale,
      themeMode,
      setThemeMode,
      dark,
      t: (key, vars) => translate(locale, key, vars),
      n: (v, digits = 0) => formatNumber(v, locale, digits),
      money: (v, currency) => formatMoney(v, currency, locale),
      date: (iso, short) => formatDate(iso, locale, short),
      month: (iso) => formatMonth(iso, locale),
    }),
    [locale, setLocale, themeMode, setThemeMode, dark],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}
