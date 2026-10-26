import "server-only";
// The scheduled reminder run (see src/app/api/cron/reminders): for everyone
// with a phone subscribed or email turned on, works out their reminders on each
// of their farms and sends one notification / email. reminder_sends makes sure
// a person gets at most one per channel per slot per day, even if the job is
// called twice.
import { emailReady, digestEmail, pushReady, sendEmail, sendPush, type DigestSection } from "@/lib/notify";
import { farmClock, today } from "@/lib/format";
import { createI18n, isLocale, type Locale } from "@/lib/i18n/core";
import { messagesFor } from "@/lib/i18n/server";
import { loadFarmReminders } from "@/lib/reminders-data";
import { DUES_WEEKDAY, forPerson, forSlot, reminderText, summaryCounts, type Reminder, type Slot } from "@/lib/reminders";
import { SITE_URL } from "@/lib/site";
import { serviceClient } from "@/lib/supabase/service";
import type { Farm, Role } from "@/lib/types";

type Prefs = { user_id: string; locale: string; morning: boolean; evening: boolean; email: string; muted: string[] };
const DEFAULT_PREFS = { locale: "bn", morning: true, evening: true, email: "off", muted: [] as string[] };

export type JobResult = { slot: Slot; people: number; pushed: number; emailed: number; failed: number; skipped: number };

export async function runReminderJob(slot: Slot, at = new Date()): Promise<JobResult | { error: string }> {
  const db = serviceClient();
  if (!db) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
  const day = today();
  const { weekday } = farmClock(at);
  const result: JobResult = { slot, people: 0, pushed: 0, emailed: 0, failed: 0, skipped: 0 };

  // Who can be reached: devices that still work, and email subscribers (morning only).
  const sendEmails = slot === "morning" && emailReady();
  type Device = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };
  const [subs, prefRows] = await Promise.all([
    pushReady() ? allRows<Device>((from, to) => db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").lt("failures", 5).order("id").range(from, to)) : [],
    allRows<Prefs>((from, to) => db.from("notification_prefs").select("user_id, locale, morning, evening, email, muted").order("user_id").range(from, to)),
  ]);
  const prefs = new Map(prefRows.map((p) => [p.user_id, p]));
  const devices = new Map<string, Device[]>();
  for (const s of subs) {
    const pr = prefs.get(s.user_id) ?? DEFAULT_PREFS;
    if (slot === "morning" ? !pr.morning : !pr.evening) continue;
    devices.set(s.user_id, [...(devices.get(s.user_id) ?? []), s]);
  }
  const emailUsers = new Set(
    sendEmails ? [...prefs.values()].filter((p) => p.email === "daily" || (p.email === "weekly" && weekday === DUES_WEEKDAY)).map((p) => p.user_id) : [],
  );
  const people = [...new Set([...devices.keys(), ...emailUsers])];
  result.people = people.length;
  if (people.length === 0) return result;

  // Their farms (not suspended) and anything they already ticked off, a few hundred people at a time.
  type Member = { user_id: string; role: Role; farm: Farm & { name: string } };
  const byUser = new Map<string, Member[]>();
  const done = new Set<string>();
  for (let i = 0; i < people.length; i += 200) {
    const ids = people.slice(i, i + 200);
    const [members, dismissed] = await Promise.all([
      allRows<Member>((from, to) =>
        db
          .from("farm_members")
          .select("user_id, role, farm:farms!inner(id, name, currency, has_dairy, has_layer, has_goat, has_fattening, has_broiler, plan, plan_expires_at, suspended)")
          .in("user_id", ids)
          .order("user_id")
          .order("farm_id")
          .range(from, to),
      ),
      allRows<{ user_id: string; farm_id: string; key: string }>((from, to) =>
        db.from("reminder_dismissals").select("user_id, farm_id, key").in("user_id", ids).order("user_id").order("key").range(from, to),
      ),
    ]);
    for (const m of members) {
      if (!m.farm || m.farm.suspended) continue;
      byUser.set(m.user_id, [...(byUser.get(m.user_id) ?? []), m]);
    }
    for (const d of dismissed) done.add(`${d.user_id}|${d.farm_id}|${d.key}`);
  }

  // Each farm is worked out once, however many people it has.
  const farmCache = new Map<string, Promise<Reminder[]>>();
  const farmReminders = (farm: Farm) => {
    if (!farmCache.has(farm.id)) farmCache.set(farm.id, loadFarmReminders(db, farm, at).catch((e: Error) => {
          console.error(`Reminders for farm ${farm.id} failed:`, e.message);
          return [];
        }));
    return farmCache.get(farm.id)!;
  };

  for (const userId of people) {
    const pr = prefs.get(userId) ?? { user_id: userId, ...DEFAULT_PREFS };
    const locale: Locale = isLocale(pr.locale) ? pr.locale : "bn";
    const i18n = createI18n(locale, messagesFor(locale));
    const farms = byUser.get(userId) ?? [];
    const sections: { farm: Member["farm"]; items: Reminder[] }[] = [];
    for (const m of farms) {
      const all = await farmReminders(m.farm);
      const mine = forSlot(forPerson(all, { role: m.role, muted: pr.muted }), slot, weekday).filter((r) => !done.has(`${userId}|${m.farm.id}|${r.key}`));
      if (mine.length) sections.push({ farm: m.farm, items: mine });
    }
    const total = sections.reduce((s, x) => s + x.items.length, 0);
    if (total === 0) {
      result.skipped++;
      continue;
    }

    // Phone: one notification with the count and the first few reminders.
    const mineDevices = devices.get(userId) ?? [];
    if (mineDevices.length && (await claim(db, userId, day, slot, "push", total))) {
      const lines = sections.flatMap((s) =>
        s.items.map((r) => {
          const tx = reminderText(r, i18n);
          return `${sections.length > 1 ? `${s.farm.name}: ` : ""}${tx.title} — ${tx.when}`;
        }),
      );
      const kinds = summaryCounts(sections.flatMap((s) => s.items));
      const single = total === 1 ? sections[0].items[0] : null;
      const msg = {
        title: slot === "evening" ? i18n.t("rem.push.evening") : i18n.t("rem.push.morning", { n: total }),
        body: lines.slice(0, 4).join("\n") + (lines.length > 4 ? `\n${i18n.t("rem.push.more", { n: lines.length - 4 })}` : ""),
        url: single && sections.length === 1 ? single.href : "/dashboard/notifications",
        tag: `ff-${slot}-${kinds.length}`,
      };
      let ok = false;
      for (const d of mineDevices) {
        const r = await sendPush(d, msg);
        if (r === "ok") ok = true;
        if (r === "gone") await db.from("push_subscriptions").delete().eq("id", d.id);
        else await db.rpc("push_mark_sent", { p_id: d.id, p_ok: r === "ok" });
      }
      await db.from("reminder_sends").update({ ok }).match({ user_id: userId, day, slot, channel: "push" });
      if (ok) result.pushed++;
      else result.failed++;
    }

    // Email: the whole list, grouped by farm.
    if (emailUsers.has(userId) && (await claim(db, userId, day, slot, "email", total))) {
      const { data: u } = await db.auth.admin.getUserById(userId);
      const to = u?.user?.email;
      let ok = false;
      if (to) {
        const digest: DigestSection[] = sections.map((s) => ({
          farm: s.farm.name,
          items: s.items.map((r) => ({ ...reminderText(r, i18n), url: new URL(r.href, SITE_URL).toString(), tone: r.tone })),
        }));
        const { html, text } = digestEmail({
          heading: i18n.t("rem.email.heading", { n: total }),
          intro: i18n.t("rem.email.intro", { date: i18n.f.date(day) }),
          sections: digest,
          button: i18n.t("rem.email.button"),
          footer: i18n.t("rem.email.footer"),
          lang: locale,
        });
        ok = await sendEmail({ to, subject: i18n.t("rem.email.subject", { n: total, date: i18n.f.date(day) }), html, text });
      }
      await db.from("reminder_sends").update({ ok }).match({ user_id: userId, day, slot, channel: "email" });
      if (ok) result.emailed++;
      else result.failed++;
    }
  }

  // Ticked-off reminders older than two months are no longer needed.
  await db.from("reminder_dismissals").delete().lt("created_at", new Date(at.getTime() - 60 * 86_400_000).toISOString());
  return result;
}

/** Reads every row of a query, a page at a time (the API returns at most 1,000 per request). */
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

/** Records the send first; false if this person already got this slot today. */
async function claim(db: NonNullable<ReturnType<typeof serviceClient>>, userId: string, day: string, slot: Slot, channel: "push" | "email", items: number) {
  const { error } = await db.from("reminder_sends").insert({ user_id: userId, day, slot, channel, items });
  if (error && error.code !== "23505") console.error("reminder_sends:", error.message);
  return !error;
}
