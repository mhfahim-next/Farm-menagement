"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass } from "./ui";

export type PublicLink = { href: string; label: string; primary?: boolean };

/** Phone-only hamburger for the public pages: opens a side drawer with the site links. */
export function PublicMenu({ links, closeLabel, menuLabel }: { links: PublicLink[]; closeLabel: string; menuLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigating
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        data-testid="public-menu-toggle"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-stone-700 hover:bg-stone-100"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <button type="button" aria-label={closeLabel} className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}
      <aside
        data-testid="public-menu"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-stone-200 bg-white shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 px-4">
          <span className="font-semibold text-stone-900">{menuLabel}</span>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <nav className="grid gap-1 overflow-y-auto p-3 safe-bottom">
          {links.map((l) =>
            l.primary ? (
              <Link key={l.href} href={l.href} className={`${buttonClass("primary")} mt-3 text-center`} tabIndex={open ? 0 : -1}>
                {l.label}
              </Link>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                tabIndex={open ? 0 : -1}
                className="rounded-lg px-3 py-3 text-base font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </aside>
    </div>
  );
}
