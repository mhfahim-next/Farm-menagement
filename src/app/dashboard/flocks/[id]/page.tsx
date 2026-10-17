import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ClickRow } from "@/components/click-row";
import { ButtonLink, Card, EmptyState, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { Flock, FlockDailyLog } from "@/lib/types";
import { updateFlockStatus } from "../actions";
import { flockAgeWeeks, withDailyStats } from "../utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.detailMeta") };
}

export default async function FlockDetailPage({ params }: PageProps<"/dashboard/flocks/[id]">) {
  const { id } = await params;
  const { supabase, farm } = await requireRole(STAFF);
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

  return (
    <>
      <PageHeader
        title={flock.name}
        description={[
          flock.breed ? o("flock_breed", flock.breed) : null,
          flock.shed && t("flocks.shed", { s: flock.shed }),
          t("flocks.weeksOld", { n: flockAgeWeeks(flock) }),
          o("flock_status", flock.status),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/flocks" className="text-sm text-stone-500 hover:text-stone-900">
              {t("flocks.allFlocks")}
            </Link>
            <ButtonLink href={`/dashboard/flocks/${flock.id}/log`}>+ {t("flocks.logTitle")}</ButtonLink>
          </div>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
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
                <ClickRow key={r.id} href={`/dashboard/flocks/${flock.id}/log?date=${r.log_date}`}>
                  <Td>{f.date(r.log_date)}</Td>
                  <Td className="tabular-nums">{f.number(r.eggs_collected)}</Td>
                  <Td className="tabular-nums">{r.eggs_broken ? f.number(r.eggs_broken) : "—"}</Td>
                  <Td className="tabular-nums">{f.number(r.henDay, 1)}%</Td>
                  <Td className={r.mortality ? "tabular-nums text-red-600" : "tabular-nums"}>
                    {r.mortality + r.culled ? f.number(r.mortality + r.culled) : "—"}
                  </Td>
                  <Td className="tabular-nums">{r.feed_kg != null ? t("flocks.kg", { n: f.number(Number(r.feed_kg), 1) }) : "—"}</Td>
                  <Td className="tabular-nums">{r.feedPerBird != null ? f.number(r.feedPerBird, 0) : "—"}</Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>

        <div className="grid content-start gap-6">
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
