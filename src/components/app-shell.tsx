import type { ReactNode } from "react";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu, type MenuUser } from "@/components/user-menu";

/**
 * Top bar + sidebar used by both the farm dashboard and the admin panel.
 * Language and theme toggles sit beside the avatar menu.
 */
export function AppShell({
  logoHref,
  title,
  subtitle,
  nav,
  user,
  inAdmin = false,
  banner,
  children,
}: {
  logoHref: string;
  title: string;
  subtitle?: string;
  nav: NavItem[];
  user: MenuUser;
  inAdmin?: boolean;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href={logoHref} />
            <div className="hidden min-w-0 border-l border-stone-200 pl-3 sm:block">
              <p className="truncate text-sm font-semibold text-stone-900">{title}</p>
              {subtitle && <p className="truncate text-xs text-stone-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu user={user} inAdmin={inAdmin} />
          </div>
        </div>
      </header>

      {banner}

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="border-b border-stone-200 bg-white px-3 py-2 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-4">
          <DashboardNav items={nav} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
