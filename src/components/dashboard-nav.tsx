"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./ui";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Fixed-size slot so the spinner never shifts the label. */
function PendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className={`ml-auto grid h-4 w-4 place-items-center transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}>
      <Spinner className="h-3.5 w-3.5 text-emerald-700" />
    </span>
  );
}

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/dashboard" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-800"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {item.label}
            <PendingHint />
          </Link>
        );
      })}
    </nav>
  );
}
