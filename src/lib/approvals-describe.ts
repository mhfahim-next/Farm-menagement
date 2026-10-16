import "server-only";
import type { FarmContext } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import type { I18n } from "@/lib/i18n/core";
import { fieldsOf, type PendingEntry } from "./approvals";

export type Described = { title: string; lines: string[] };

/** Plain-language summary of every queued entry (animals and records looked up by id). */
export async function describeEntries(
  ctx: Pick<FarmContext, "supabase" | "farm"> & { i18n: I18n },
  entries: PendingEntry[],
): Promise<Map<string, Described>> {
  const { supabase, farm, i18n } = ctx;
  const { t, f, o, maybe } = i18n;

  const cattleIds = new Set<string>();
  const healthIds = new Set<string>();
  const breedingIds = new Set<string>();
  for (const e of entries) {
    const { get, all } = fieldsOf(e.payload);
    all("cattle_id").forEach((id) => cattleIds.add(id));
    const rid = get("id");
    if (rid && (e.kind === "renew_health" || e.kind === "update_health")) healthIds.add(rid);
    if (rid && e.kind === "update_breeding") breedingIds.add(rid);
  }

  const [health, breeding] = await Promise.all([
    healthIds.size ? supabase.from("health_records").select("id, cattle_id, product, description, record_type").eq("farm_id", farm.id).in("id", [...healthIds]) : { data: [] },
    breedingIds.size ? supabase.from("breeding_events").select("id, cattle_id, event_type, event_date").eq("farm_id", farm.id).in("id", [...breedingIds]) : { data: [] },
  ]);
  const healthById = new Map((health.data ?? []).map((h) => [h.id as string, h]));
  const breedingById = new Map((breeding.data ?? []).map((b) => [b.id as string, b]));
  (health.data ?? []).forEach((h) => cattleIds.add(h.cattle_id as string));
  (breeding.data ?? []).forEach((b) => cattleIds.add(b.cattle_id as string));

  const { data: cattle } = cattleIds.size
    ? await supabase.from("cattle").select("id, tag_number, name").eq("farm_id", farm.id).in("id", [...cattleIds])
    : { data: [] };
  const animal = new Map((cattle ?? []).map((c) => [c.id as string, animalLabel(c as { tag_number: string; name: string | null })]));
  const who = (id: string | null | undefined) => (id ? (animal.get(id) ?? "—") : "—");

  const out = new Map<string, Described>();
  for (const e of entries) {
    const { get, all } = fieldsOf(e.payload);
    const lines: string[] = [];
    let title = "";

    if (e.kind === "record_health" || e.kind === "update_health") {
      const product = get("product") ?? "—";
      const type = get("record_type");
      const rec = e.kind === "update_health" ? healthById.get(get("id") ?? "") : null;
      title = t(e.kind === "record_health" ? "approvals.k.recordHealth" : "approvals.k.updateHealth", { type: type ? o("health_type", type) : "", product });
      const animals = e.kind === "record_health" ? all("cattle_id").map(who) : [who(rec?.cattle_id as string | undefined)];
      lines.push(animals.join(", "));
      if (get("record_date")) lines.push(f.date(get("record_date")));
      if (get("interval_days")) lines.push(t("ai.p.repeat", { n: Number(get("interval_days")) }));
      if (get("dose")) lines.push(`${t("health.dose")}: ${get("dose")}`);
      if (get("cost")) lines.push(f.money(Number(get("cost")), farm.currency));
      if (get("withdrawal_until")) lines.push(`${t("health.withdrawalUntil")}: ${f.date(get("withdrawal_until"))}`);
      if (get("description")) lines.push(get("description")!);
    } else if (e.kind === "renew_health") {
      const rec = healthById.get(get("id") ?? "");
      title = t("approvals.k.renewHealth", { product: (rec?.product ?? rec?.description ?? "—") as string });
      lines.push(who(rec?.cattle_id as string | undefined));
    } else {
      const rec = e.kind === "update_breeding" ? breedingById.get(get("id") ?? "") : null;
      const type = (e.kind === "log_breeding" ? get("event_type") : (rec?.event_type as string | undefined)) ?? "";
      const cow = who(e.kind === "log_breeding" ? get("cattle_id") : (rec?.cattle_id as string | undefined));
      title = t(e.kind === "log_breeding" ? "approvals.k.logBreeding" : "approvals.k.updateBreeding", { event: type ? o("breeding_event", type) : "", cow });
      const when = [get("event_date") ? f.date(get("event_date")) : null, get("event_time") ? f.time(get("event_time")) : null].filter(Boolean).join(" · ");
      if (when) lines.push(when);
      if (get("bull_or_semen")) lines.push(get("bull_or_semen")!);
      if (get("technician")) lines.push(t("breeding.by", { name: get("technician")! }));
      if (get("result")) lines.push(o("pregnancy_result", get("result")));
      const signs = all("heat_sign").map((s) => maybe(`heat.${s}`) ?? o("heat_sign", s));
      if (signs.length) lines.push(signs.join(", "));
      if (get("expected_calving_date")) lines.push(t("breeding.calvingOn", { date: f.date(get("expected_calving_date")) }));
      if (get("calf_tag")) lines.push(t("ai.p.calf", { tag: get("calf_tag")! }));
      if (get("notes")) lines.push(get("notes")!);
    }
    out.set(e.id, { title, lines: lines.filter(Boolean) });
  }
  return out;
}
