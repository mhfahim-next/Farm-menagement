import { useEffect, useSyncExternalStore } from "react";
import { farmToday } from "./dates";
import { notifyOn, notifyStore, schedule } from "./notify";
import { morningBody, planNotes } from "./notify-plan";
import { usePrefs } from "./prefs";
import { useReminders } from "./reminders";
import { useSession } from "./session";
import { supabase } from "./supabase";

/** Keeps the phone's reminder notifications in step with today's list. */
export function useNotifySchedule() {
  const { t, locale } = usePrefs();
  const farm = useSession().current?.farm;
  const { data } = useReminders(farm?.id, locale);
  const on = useSyncExternalStore(notifyStore.subscribe, notifyStore.get);

  useEffect(() => {
    if (!farm || !data || !notifyOn()) return;
    let cancelled = false;
    (async () => {
      const day = farmToday();
      const count = async (table: "milk_records" | "flock_daily_logs", col: string) =>
        (await supabase.from(table).select("id", { count: "exact", head: true }).eq("farm_id", farm.id).eq(col, day)).count ?? null;
      const [milk, eggs] = await Promise.all([farm.has_dairy ? count("milk_records", "record_date") : null, farm.has_layer ? count("flock_daily_logs", "log_date") : null]).catch(
        () => [null, null],
      );
      const titles = data.open.filter((r) => r.kind !== "milk_missing" && r.kind !== "eggs_missing").map((r) => r.title);
      const missing = milk === 0 || eggs === 0;
      if (cancelled) return;
      await schedule(
        planNotes(new Date(), {
          morning: titles.length ? { title: t("notify.morningTitle", { n: titles.length }), body: morningBody(titles) } : null,
          nudge: { title: "FarmFlows", body: t("notify.nudge") },
          evening: missing ? { title: t("notify.eveningTitle"), body: t(milk === 0 ? "notify.eveningMilk" : "notify.eveningEggs") } : null,
        }),
      ).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [farm, data, on, t]);
}
