import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PushToggle } from "@/components/push-toggle";
import { Badge, Card, EmptyState, Field, PageHeader, Select } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { emailReady } from "@/lib/notify";
import { kindsForRole, REMINDER_GROUPS, reminderText, type ReminderGroup } from "@/lib/reminders";
import { loadMyReminders } from "@/lib/reminders-data";
import { dismissReminder, saveReminderPrefs, undoReminder } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("notif.title") };
}

const DOT = { red: "bg-red-500", amber: "bg-amber-500", blue: "bg-sky-500" };
const BADGE = { red: "red", amber: "amber", blue: "blue" } as const;

export default async function NotificationsPage() {
  const { supabase, farm, role, user } = await requireFarm();
  const i18n = await getI18n();
  const { t, f } = i18n;

  const [{ open, done }, { data: prefs }, { count: devices }] = await Promise.all([
    loadMyReminders(supabase, farm, role, user.id),
    supabase.from("notification_prefs").select("morning, evening, email, muted").eq("user_id", user.id).maybeSingle(),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const muted = new Set<string>(prefs?.muted ?? []);
  const mine = new Set(kindsForRole(role));
  const groups = (Object.keys(REMINDER_GROUPS) as ReminderGroup[]).filter((g) => REMINDER_GROUPS[g].some((k) => mine.has(k)));
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;

  return (
    <>
      <PageHeader title={t("notif.title")} description={t("notif.desc")} />

      <Card className="mb-6">
        {open.length === 0 ? (
          <EmptyState title={`✓ ${t("notif.emptyTitle")}`}>{t("notif.emptyBody")}</EmptyState>
        ) : (
          <ul className="divide-y divide-stone-100" data-testid="reminders">
            {open.map((r) => {
              const tx = reminderText(r, i18n);
              return (
                <li key={r.key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3" data-kind={r.kind}>
                  <Link href={r.href} className="flex min-w-0 flex-1 items-start gap-2.5 font-medium text-stone-900 hover:text-emerald-700 hover:underline">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[r.tone]}`} aria-hidden="true" />
                    <span className="min-w-0">{tx.title}</span>
                  </Link>
                  <div className="flex items-center justify-between gap-3 pl-5 sm:justify-end sm:pl-0">
                    <Badge tone={BADGE[r.tone]}>{tx.when}</Badge>
                    <ConfirmForm action={dismissReminder} fields={{ key: r.key }} label={`✓ ${t("notif.done")}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {done.length > 0 && (
          <details className="mt-4 border-t border-stone-100 pt-3">
            <summary className="cursor-pointer text-sm font-medium text-stone-600">
              {t("notif.doneTitle")} ({f.number(done.length)})
            </summary>
            <ul className="mt-2 divide-y divide-stone-100">
              {done.map((r) => (
                <li key={r.key} className="flex flex-wrap items-center gap-3 py-2 text-sm text-stone-500">
                  <span className="min-w-0 flex-1 line-through">{reminderText(r, i18n).title}</span>
                  <ConfirmForm action={undoReminder} fields={{ key: r.key }} label={t("notif.undo")} variant="ghost" />
                </li>
              ))}
            </ul>
          </details>
        )}
        <p className="mt-4 text-xs text-stone-500">{t("notif.doneNote")}</p>
      </Card>

      <Card title={t("notif.settingsTitle")} description={t("notif.settingsDesc")}>
        <div className="mb-6 rounded-xl border border-stone-200 p-4">
          <p className="font-semibold text-stone-900">{t("notif.pushTitle")}</p>
          <p className="mb-3 text-sm text-stone-500">{t("notif.pushDesc")}</p>
          <PushToggle vapidKey={vapidKey} />
          {(devices ?? 0) > 0 && <p className="mt-2 text-xs text-stone-500">{t("notif.devices", { n: devices ?? 0 })}</p>}
        </div>

        <ActionForm action={saveReminderPrefs} submitLabel={t("notif.save")} submitVariant="secondary">
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="morning" defaultChecked={prefs?.morning ?? true} className="h-4 w-4 accent-emerald-700" data-testid="pref-morning" />
              {t("notif.morning")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="evening" defaultChecked={prefs?.evening ?? true} className="h-4 w-4 accent-emerald-700" />
              {t("notif.evening")}
            </label>
          </div>
          <Field label={t("notif.emailLabel")} hint={emailReady() ? undefined : t("notif.emailOff")}>
            <Select
              name="email"
              defaultValue={prefs?.email ?? "off"}
              className="max-w-xs"
              data-testid="pref-email"
              options={(["off", "daily", "weekly"] as const).map((v) => ({ value: v, label: t(`notif.email.${v}`) }))}
            />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">{t("notif.kinds")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="offered" value={g} />
                  <input type="checkbox" name="groups" value={g} defaultChecked={!muted.has(g)} className="h-4 w-4 accent-emerald-700" data-testid={`group-${g}`} />
                  {t(`notif.group.${g}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </Card>
    </>
  );
}
