"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SidebarContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

/**
 * Left sidebar: always visible from `md` up; on phones it is a slide-in drawer
 * opened from <SidebarToggle /> in the top bar. The drawer closes on navigation.
 */
export function Sidebar({
  header,
  sidebar,
  children,
}: {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
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
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen flex-1">
        {open && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          data-testid="sidebar"
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center border-b border-stone-200 px-4">{header}</div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{sidebar}</div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarToggle() {
  const { open, setOpen } = useContext(SidebarContext);
  return (
    <button
      type="button"
      aria-label="Menu"
      aria-expanded={open}
      data-testid="sidebar-toggle"
      onClick={() => setOpen(!open)}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-stone-700 hover:bg-stone-100 md:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
