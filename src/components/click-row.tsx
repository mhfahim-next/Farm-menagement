"use client";

import { useRouter } from "next/navigation";
import { announceNavigation } from "./nav-progress";
import type { ReactNode } from "react";

/**
 * A table row that opens `href` when clicked anywhere (or activated with
 * Enter/Space). Real links, buttons and form fields inside the row keep
 * their own behaviour.
 */
export function ClickRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  const interactive = (el: EventTarget | null) =>
    el instanceof Element && el.closest("a, button, input, select, textarea, label, form") !== null;

  return (
    <tr
      tabIndex={0}
      onClick={(e) => {
        if (interactive(e.target)) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else {
          announceNavigation();
          router.push(href);
        }
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          announceNavigation();
          router.push(href);
        }
      }}
      className="cursor-pointer hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-600"
    >
      {children}
    </tr>
  );
}
