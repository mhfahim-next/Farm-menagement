import Link from "next/link";
import type { FarmContext } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { loadMyReminders } from "@/lib/reminders-data";

/** Bell icon with the number of open reminders (streams in after the page). */
export async function NotificationBell({ ctx }: { ctx: Pick<FarmContext, "supabase" | "farm" | "role" | "user"> }) {
  const { t, f } = await getI18n();
  let count = 0;
  let urgent = false;
  try {
    const { open } = await loadMyReminders(ctx.supabase, ctx.farm, ctx.role, ctx.user.id);
    count = open.length;
    urgent = open.some((r) => r.tone === "red");
  } catch (e) {
    console.error("Reminders failed:", (e as Error).message);
  }
  return <BellLink label={count > 0 ? t("notif.bellCount", { n: count }) : t("notif.bell")} count={count > 0 ? f.number(Math.min(count, 99)) + (count > 99 ? "+" : "") : null} urgent={urgent} />;
}

export function BellLink({ label, count, urgent = false }: { label: string; count: string | null; urgent?: boolean }) {
  return (
    <Link
      href="/dashboard/notifications"
      aria-label={label}
      title={label}
      data-testid="bell"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count && (
        <span
          data-testid="bell-count"
          className={`absolute -right-0.5 -top-0.5 min-w-[1.15rem] rounded-full px-1 text-center text-[11px] font-bold leading-[1.15rem] text-white ${urgent ? "bg-red-600" : "bg-amber-500"}`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
