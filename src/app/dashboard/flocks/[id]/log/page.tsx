import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Card, Field, Input, PageHeader } from "@/components/ui";
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

  const [flockRes, logsRes] = await Promise.all([
    supabase.from("flocks").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("flock_daily_logs").select("*").eq("flock_id", id),
  ]);
  const flock = flockRes.data as Flock | null;
  if (!flock) notFound();
  const logs = (logsRes.data ?? []) as FlockDailyLog[];

  const logDate = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const existing = logs.find((l) => l.log_date === logDate);

  return (
    <>
      <PageHeader
        title={flock.name}
        description={existing ? t("flocks.logTitleEdit", { date: f.date(logDate) }) : t("flocks.logTitle")}
        action={<ButtonLink href={`/dashboard/flocks/${flock.id}`} variant="secondary">{t("common.back")}</ButtonLink>}
      />
      <Card className="max-w-2xl" description={t("flocks.logDesc")}>
            <form className="mb-3 flex items-end gap-2">
              <Field label={t("common.date")} className="flex-1">
                <Input name="date" type="date" defaultValue={logDate} max={today()} />
              </Field>
              <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.load")}</button>
            </form>
            <ActionForm action={saveDailyLog} submitLabel={t("flocks.saveLog")} key={logDate} successHref={`/dashboard/flocks/${flock.id}`}>
              <input type="hidden" name="flock_id" value={flock.id} />
              <input type="hidden" name="log_date" value={logDate} />
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
              <Field label={t("common.notes")}>
                <Input name="notes" defaultValue={existing?.notes ?? ""} />
              </Field>
            </ActionForm>
      </Card>
    </>
  );
}
