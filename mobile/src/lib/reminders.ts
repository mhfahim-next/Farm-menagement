// Today's work, from the website's reminder engine (the same list as the bell
// on the website), read with the signed-in person's session.
import { useCached } from "./cache";
import { siteLink } from "./env";
import type { Locale } from "./i18n/core";
import { supabase } from "./supabase";

export type AppReminder = { key: string; kind: string; tone: "red" | "amber" | "blue"; days: number; href: string; title: string; when: string };

export async function fetchReminders(farmId: string, locale: Locale): Promise<{ open: AppReminder[]; done: number }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("signed out");
  const res = await fetch(siteLink(`/api/app/reminders?farm=${farmId}&lang=${locale}`), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `HTTP ${res.status}`);
  return res.json();
}

export const useReminders = (farmId: string | undefined, locale: Locale) =>
  useCached(farmId ? `reminders.${farmId}.${locale}` : null, () => fetchReminders(farmId!, locale));

/** Marks a reminder done for this person (the same tick as on the website). */
export async function markDone(userId: string, farmId: string, key: string) {
  const { error } = await supabase.from("reminder_dismissals").upsert({ user_id: userId, farm_id: farmId, key }, { onConflict: "user_id,farm_id,key", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

/** Where a reminder leads inside the app; null = open it on the website. */
export function appRoute(href: string): string | null {
  const animal = /\/dashboard\/cattle\/([0-9a-f-]{36})/i.exec(href);
  if (animal) return `/animal/${animal[1]}`;
  if (/\/dashboard\/sales/.test(href)) return "/sales";
  if (/\/dashboard\/(milk|flocks|quick)/.test(href)) return "/entry";
  return null;
}
