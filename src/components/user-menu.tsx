"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { useI18n } from "./i18n-provider";

export type MenuUser = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isDoctor?: boolean;
};

/** Avatar button with a dropdown: Dashboard, Profile, Admin panel, Log out. */
export function UserMenu({ user, inAdmin = false }: { user: MenuUser; inAdmin?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

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

  const item =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("menu.account")}
        data-testid="user-menu-button"
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 ring-emerald-600/30 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 sm:pr-3"
      >
        <Avatar url={user.avatarUrl} name={user.name} email={user.email} size={34} />
        <span className="hidden max-w-32 truncate text-sm font-medium text-stone-800 sm:block">
          {user.name ?? user.email}
        </span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-2 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-stone-100 px-3 pb-3 pt-2">
            <Avatar url={user.avatarUrl} name={user.name} email={user.email} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
              {user.isSuperAdmin && (
                <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  {t("menu.superAdmin")}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            {user.isDoctor ? (
              <Link role="menuitem" href="/doctor" className={item} onClick={() => setOpen(false)}>
                {t("doctor.consoleNav")}
              </Link>
            ) : (
              <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}>
                {t("menu.dashboard")}
              </Link>
            )}
            <Link role="menuitem" href={user.isDoctor ? "/doctor/profile" : "/dashboard/profile"} className={item} onClick={() => setOpen(false)}>
              {t("menu.profile")}
            </Link>
            {user.isSuperAdmin && !inAdmin && (
              <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
                {t("menu.admin")}
              </Link>
            )}
          </div>

          <form action="/auth/signout" method="post" className="border-t border-stone-100 pt-1">
            <button role="menuitem" type="submit" className={`${item} hover:text-red-600`}>
              {t("menu.logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
