"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { switchFarm } from "@/lib/farm-actions";
import { useI18n } from "./i18n-provider";

export type SwitcherFarm = { id: string; name: string; role: string };

/** The farm name in the top bar; a dropdown when the user has several farms or may add one. */
export function FarmSwitcher({
  farms,
  currentId,
  canAdd,
  addLockedHint,
}: {
  farms: SwitcherFarm[];
  currentId: string;
  canAdd: boolean;
  addLockedHint: string | null;
}) {
  const { t, o } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const current = farms.find((f) => f.id === currentId) ?? farms[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("farm.switch")}
        data-testid="farm-switcher"
        className="flex max-w-56 items-center gap-1.5 rounded-lg px-2 py-1 text-left hover:bg-stone-100"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-stone-900">{current?.name}</span>
          <span className="block truncate text-xs text-stone-500">{current ? o("member_role", current.role) : ""}</span>
        </span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-stone-500">{t("farm.switch")}</p>
          {farms.map((f) => (
            <button
              key={f.id}
              role="menuitem"
              type="button"
              disabled={pending}
              onClick={() => (f.id === currentId ? setOpen(false) : startTransition(() => switchFarm(f.id)))}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                f.id === currentId ? "bg-emerald-50 text-emerald-800" : "text-stone-700"
              }`}
            >
              <span className="truncate font-medium">{f.name}</span>
              <span className="shrink-0 text-xs text-stone-500">{o("member_role", f.role)}</span>
            </button>
          ))}
          {(canAdd || addLockedHint) && (
            <div className="mt-1 border-t border-stone-100 pt-1">
              {canAdd ? (
                <Link role="menuitem" href="/dashboard/farms/new" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-stone-100">
                  + {t("farm.addAnother")}
                </Link>
              ) : (
                <Link href="/dashboard/plan" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-xs text-stone-500 hover:bg-stone-100">
                  {addLockedHint}
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
