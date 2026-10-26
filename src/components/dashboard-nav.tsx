"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./ui";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  /** Heading shown above this item when it starts a new group. */
  group?: string;
  /** A count shown as a small pill (things waiting for the person); hidden when 0. */
  badge?: number;
};

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
      {items.map((item, i) => {
        const heading = item.group && item.group !== items[i - 1]?.group ? item.group : null;
        const active =
          item.href === "/dashboard" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2 ${
              active
                ? "bg-emerald-50 text-emerald-800"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span
                data-testid="nav-badge"
                aria-label={`${item.badge}`}
                className="ml-2 inline-grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
            <PendingHint />
          </Link>
        );
        return heading ? (
          <div key={item.href} className="mt-3 flex flex-col gap-1 first:mt-0">
            <p className="px-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{heading}</p>
            {link}
          </div>
        ) : (
          link
        );
      })}
    </nav>
  );
}
