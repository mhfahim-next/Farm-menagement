import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { AutoLoad } from "@/components/auto-load";
import { ButtonLink, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Flock, FlockDailyLog } from "@/lib/types";
import { saveDailyLog } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.logTitle") };
}

export default async function FlockLogPage({ params, searchParams }: PageProps<"/dashboard/flocks/[id]/log">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, farm } = await requireRole(STAFF);
  const { t, f } = await getI18n();

  const [flockRes, logsRes, feedRes] = await Promise.all([
    supabase.from("flocks").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("flock_daily_logs").select("*").eq("flock_id", id),
    // Feed in stock that can be measured in kg (sold per kg, or bags with a known weight).
    supabase
      .from("inventory_stock")
      .select("id, name, unit, unit_kg, on_hand")
      .eq("farm_id", farm.id)
      .eq("archived", false)
      .in("kind", ["feed", "supplement"])
      .in("module", ["layer", "general"])
      .order("name"),
  ]);
  const flock = flockRes.data as Flock | null;
  if (!flock) notFound();
  const logs = (logsRes.data ?? []) as FlockDailyLog[];

  const logDate = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const existing = logs.find((l) => l.log_date === logDate);
  const feeds = ((feedRes.data ?? []) as { id: string; name: string; unit: string; unit_kg: number | null; on_hand: number }[]).filter(
    (x) => x.unit === "kg" || (x.unit_kg ?? 0) > 0,
  );
  // Default to the feed used most recently for this flock.
  const lastFeed = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).find((l) => l.feed_item_id)?.feed_item_id ?? "";
  const kgLeft = (x: (typeof feeds)[number]) => (x.unit === "kg" ? Number(x.on_hand) : Number(x.on_hand) * Number(x.unit_kg));

  return (
    <>
      <PageHeader
        title={flock.name}
        description={existing ? t("flocks.logTitleEdit", { date: f.date(logDate) }) : t("flocks.logTitle")}
        action={<ButtonLink href={`/dashboard/flocks/${flock.id}`} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl" description={t("flocks.logDesc")}>
            <ActionForm action={saveDailyLog} submitLabel={t("flocks.saveLog")} key={logDate} successHref={`/dashboard/flocks/${flock.id}`}>
              <input type="hidden" name="flock_id" value={flock.id} />
              <Field label={t("common.date")} className="mb-3">
                <AutoLoad name="log_date" param="date" defaultValue={logDate} max={today()} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("flocks.eggsCollected")}>
                  <Input name="eggs_collected" type="number" min="0" inputMode="numeric" defaultValue={existing?.eggs_collected ?? ""} required />
                </Field>
                <Field label={t("flocks.eggsBroken")}>
                  <Input name="eggs_broken" type="number" min="0" inputMode="numeric" defaultValue={existing?.eggs_broken ?? ""} />
                </Field>
                <Field label={t("flocks.deaths")}>
                  <Input name="mortality" type="number" min="0" inputMode="numeric" defaultValue={existing?.mortality ?? ""} />
                </Field>
                <Field label={t("flocks.culled")}>
                  <Input name="culled" type="number" min="0" inputMode="numeric" defaultValue={existing?.culled ?? ""} />
                </Field>
                <Field label={t("flocks.feedKg")}>
                  <Input name="feed_kg" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={existing?.feed_kg ?? ""} />
                </Field>
                <Field label={t("flocks.waterL")}>
                  <Input name="water_liters" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={existing?.water_liters ?? ""} />
                </Field>
              </div>
              {feeds.length > 0 && (
                <Field label={t("stock.feedFrom")} hint={t("stock.feedFromHint")}>
                  <Select
                    name="feed_item_id"
                    defaultValue={existing ? (existing.feed_item_id ?? "") : lastFeed}
                    options={[
                      { value: "", label: t("stock.feedNone") },
                      ...feeds.map((x) => ({ value: x.id, label: `${x.name} · ${t("stock.kgLeft", { n: f.number(kgLeft(x), 1) })}` })),
                    ]}
                  />
                </Field>
              )}
              <Field label={t("common.notes")}>
                <Input name="notes" defaultValue={existing?.notes ?? ""} />
              </Field>
            </ActionForm>
      </Card>
    </>
  );
}
