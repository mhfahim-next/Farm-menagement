import type { ReactNode } from "react";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { InstallBanner } from "@/components/pwa";
import { Sidebar, SidebarToggle } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu, type MenuUser } from "@/components/user-menu";

/**
 * Left sidebar + top bar used by both the farm dashboard and the admin panel.
 * Language and theme toggles sit beside the avatar menu.
 */
export function AppShell({
  logoHref,
  title,
  subtitle,
  titleSlot,
  nav,
  user,
  inAdmin = false,
  banner,
  actions,
  children,
}: {
  logoHref: string;
  title: string;
  subtitle?: string;
  /** Replaces the plain title (e.g. the farm switcher). */
  titleSlot?: ReactNode;
  nav: NavItem[];
  user: MenuUser;
  inAdmin?: boolean;
  banner?: ReactNode;
  /** Extra buttons in the top bar, before the language switch (e.g. the reminders bell). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Sidebar header={<Logo href={logoHref} />} sidebar={<DashboardNav items={nav} />}>
      <header className="print:hidden sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarToggle />
            {titleSlot ? (
              <div className="min-w-0">{titleSlot}</div>
            ) : (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900">{title}</p>
                {subtitle && <p className="truncate text-xs text-stone-500">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {actions}
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu user={user} inAdmin={inAdmin} />
          </div>
        </div>
      </header>

      <div className="print:hidden">
        <InstallBanner />
        {banner}
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 print:p-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </Sidebar>
  );
}
