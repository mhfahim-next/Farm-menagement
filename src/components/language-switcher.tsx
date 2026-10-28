"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/core";
import { useI18n } from "./i18n-provider";
import { NAV_ICONS, type NavIconName } from "./nav-icons";

const Icon = ({ name, className }: { name: NavIconName; className: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={`fill-current ${className}`}>
    <path d={NAV_ICONS[name]} />
  </svg>
);

/** Each language in its own script, with the other one underneath, and a short badge. */
const LANGS: { code: Locale; name: string; other: string; short: string }[] = [
  { code: "bn", name: "বাংলা", other: "Bangla", short: "বা" },
  { code: "en", name: "English", other: "ইংরেজি", short: "EN" },
];

/** Language button: a globe and the current language; opens a small menu with both languages. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (l: Locale) => {
    setOpen(false);
    if (l !== locale) startTransition(() => setLocale(l));
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("common.language")}: ${current.name}`}
        data-testid="lang-toggle"
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 sm:px-3 ${pending ? "opacity-60" : ""}`}
      >
        <Icon name="globe" className="h-[18px] w-[18px] text-emerald-700" />
        <span className="sm:hidden">{current.short}</span>
        <span className="max-sm:hidden">{current.name}</span>
        <Icon name="chevronDown" className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" aria-label={t("common.language")} className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl">
          {LANGS.map((l) => {
            const on = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                lang={l.code}
                data-testid={`lang-${l.code}`}
                onClick={() => choose(l.code)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${on ? "bg-emerald-50" : "hover:bg-stone-100"}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-emerald-700">{l.short}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-900">{l.name}</span>
                  <span className="block text-xs text-stone-500">{l.other}</span>
                </span>
                {on && <Icon name="check" className="h-[18px] w-[18px] text-emerald-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
