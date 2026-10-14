import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { Logo } from "@/components/logo";
import { requireFarm } from "@/lib/auth";
import { label } from "@/lib/format";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { farm, user, role } = await requireFarm();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    ...(farm.has_dairy
      ? [
          { href: "/dashboard/cattle", label: "Cattle" },
          { href: "/dashboard/milk", label: "Milk" },
          { href: "/dashboard/health", label: "Health" },
          { href: "/dashboard/breeding", label: "Breeding" },
        ]
      : []),
    ...(farm.has_layer ? [{ href: "/dashboard/flocks", label: "Layer flocks" }] : []),
    { href: "/dashboard/finance", label: "Finance" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block">
          <Logo href="/dashboard" />
          <div className="mt-0 text-right lg:mt-5 lg:text-left">
            <p className="truncate text-sm font-semibold text-stone-900">{farm.name}</p>
            <p className="text-xs text-stone-500">{label(role)}</p>
          </div>
        </div>
        <div className="px-3 pb-3 lg:flex-1">
          <DashboardNav items={items} />
        </div>
        <div className="hidden border-t border-stone-200 px-4 py-4 lg:block">
          <p className="truncate text-xs text-stone-500">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button className="mt-1 text-sm font-medium text-stone-700 hover:text-red-600">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
