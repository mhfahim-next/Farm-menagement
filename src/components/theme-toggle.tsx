"use client";

import { useI18n } from "./i18n-provider";

export function ThemeToggle() {
  const { t } = useI18n();

  function toggle() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
      className="grid h-9 w-9 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
    >
      {/* Both icons are rendered; CSS shows the right one, so there is no flash. */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
