import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Flock, FlockDailyLog } from "@/lib/types";
import { saveDailyLog, updateFlockStatus } from "../actions";
import { flockAgeWeeks, withDailyStats } from "../utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.detailMeta") };
}

export default async function FlockDetailPage({ params, searchParams }: PageProps<"/dashboard/flocks/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, farm } = await requireFarm();
  const { t, f, o, options } = await getI18n();

  const [flockRes, logsRes] = await Promise.all([
    supabase.from("flocks").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("flock_daily_logs").select("*").eq("flock_id", id).order("log_date", { ascending: true }),
  ]);
  const flock = flockRes.data as Flock | null;
  if (!flock) notFound();
  const logs = (logsRes.data ?? []) as FlockDailyLog[];

  const { rows, alive } = withDailyStats(flock.initial_count, logs);
  const recent = rows.slice(-30).reverse();
  const last7 = rows.slice(-7);
  const avgHenDay = last7.length ? last7.reduce((s, r) => s + r.henDay, 0) / last7.length : 0;
  const totalMortality = logs.reduce((s, l) => s + l.mortality, 0);
  const totalEggs = logs.reduce((s, l) => s + l.eggs_collected, 0);
  const totalFeed = logs.reduce((s, l) => s + Number(l.feed_kg ?? 0), 0);

  const logDate = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();
  const existing = logs.find((l) => l.log_date === logDate);

  return (
    <>
      <PageHeader
        title={flock.name}
        description={[
          flock.breed,
          flock.shed && t("flocks.shed", { s: flock.shed }),
          t("flocks.weeksOld", { n: flockAgeWeeks(flock) }),
          o("flock_status", flock.status),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <Link href="/dashboard/flocks" className="text-sm text-stone-500 hover:text-stone-900">
            {t("flocks.allFlocks")}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("flocks.liveBirds")} value={f.number(alive)} hint={t("flocks.ofPlaced", { n: f.number(flock.initial_count) })} />
        <StatCard
          label={t("flocks.henDay7")}
          value={`${f.number(avgHenDay, 1)}%`}
          tone={avgHenDay >= 80 ? "good" : avgHenDay > 0 && avgHenDay < 60 ? "bad" : "default"}
        />
        <StatCard
          label={t("flocks.mortality")}
          value={`${f.number((totalMortality / flock.initial_count) * 100, 2)}%`}
          hint={t("flocks.birdsCount", { n: f.number(totalMortality) })}
        />
        <StatCard
          label={t("flocks.feedPerDozen")}
          value={totalEggs ? t("flocks.kg", { n: f.number(totalFeed / (totalEggs / 12), 2) }) : "—"}
          hint={t("flocks.eggsTotal", { n: f.number(totalEggs) })}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={t("flocks.logsTitle")} description={t("flocks.logsDesc")}>
          {recent.length === 0 ? (
            <EmptyState title={t("flocks.logsEmptyTitle")}>{t("flocks.logsEmptyBody")}</EmptyState>
          ) : (
            <Table
              head={[
                t("flocks.colDate"),
                t("flocks.colEggs"),
                t("flocks.colBroken"),
                t("flocks.colHenDay"),
                t("flocks.colDeaths"),
                t("flocks.colFeed"),
                t("flocks.colGramsBird"),
              ]}
            >
              {recent.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <Link href={`?date=${r.log_date}`} className="text-emerald-700 hover:underline">
                      {f.date(r.log_date)}
                    </Link>
                  </Td>
                  <Td className="tabular-nums">{f.number(r.eggs_collected)}</Td>
                  <Td className="tabular-nums">{r.eggs_broken ? f.number(r.eggs_broken) : "—"}</Td>
                  <Td className="tabular-nums">{f.number(r.henDay, 1)}%</Td>
                  <Td className={r.mortality ? "tabular-nums text-red-600" : "tabular-nums"}>
                    {r.mortality + r.culled ? f.number(r.mortality + r.culled) : "—"}
                  </Td>
                  <Td className="tabular-nums">{r.feed_kg != null ? t("flocks.kg", { n: f.number(Number(r.feed_kg), 1) }) : "—"}</Td>
                  <Td className="tabular-nums">{r.feedPerBird != null ? f.number(r.feedPerBird, 0) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card
            title={existing ? t("flocks.logTitleEdit", { date: f.date(logDate) }) : t("flocks.logTitle")}
            description={t("flocks.logDesc")}
          >
            <form className="mb-3 flex items-end gap-2">
              <Field label={t("common.date")} className="flex-1">
                <Input name="date" type="date" defaultValue={logDate} max={today()} />
              </Field>
              <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">{t("common.load")}</button>
            </form>
            <ActionForm action={saveDailyLog} submitLabel={t("flocks.saveLog")} key={logDate}>
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

          <Card title={t("flocks.statusTitle")}>
            <ActionForm action={updateFlockStatus} submitLabel={t("flocks.update")} submitVariant="secondary" className="flex items-end gap-2">
              <input type="hidden" name="id" value={flock.id} />
              <Select
                name="status"
                defaultValue={flock.status}
                options={options("flock_status", flock.status)}
              />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
