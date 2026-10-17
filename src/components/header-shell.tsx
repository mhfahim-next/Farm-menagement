"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Sticky public header that turns into a blurred, bordered bar once the page scrolls. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      data-scrolled={scrolled || undefined}
      className={`sticky top-0 z-30 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-stone-200 bg-white/85 shadow-sm backdrop-blur-md dark:bg-stone-50/85"
          : "border-transparent bg-white dark:bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}

/** Center nav link that highlights when its page is open. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
    >
      {children}
    </a>
  );
}
