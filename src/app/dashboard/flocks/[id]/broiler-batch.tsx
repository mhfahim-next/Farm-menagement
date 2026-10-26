import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ClickRow } from "@/components/click-row";
import { ButtonLink, Card, EmptyState, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { loadBatchStats } from "@/lib/broiler-data";
import type { getI18n } from "@/lib/i18n/server";
import type { createClient } from "@/lib/supabase/server";
import type { Farm, Flock, FlockHealthRecord } from "@/lib/types";
import { updateFlockStatus } from "../actions";

/** A broiler / Sonali batch: age, live birds, weight, FCR, cost per kg, sales and profit. */
export async function BroilerBatch({
  supabase,
  farm,
  flock,
  health,
  i18n,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  farm: Farm;
  flock: Flock;
  health: FlockHealthRecord[];
  i18n: Awaited<ReturnType<typeof getI18n>>;
}) {
  const { t, f, o, options } = i18n;
  const loaded = (await loadBatchStats(supabase, farm.id, [flock])).get(flock.id)!;
  const s = loaded.stats;
  const logs = [...loaded.logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, 40);
  const money = (n: number) => f.money(n, farm.currency);
  const kg = (n: number, d = 1) => t("flocks.kg", { n: f.number(n, d) });
  const { data: sales } = await supabase
    .from("sales")
    .select("id, sale_date, head_count, quantity, amount, buyer_id")
    .eq("flock_id", flock.id)
    .eq("product", "birds")
    .order("sale_date", { ascending: false });

  return (
    <>
      <PageHeader
        title={flock.name}
        description={[
          t(`broiler.kind.${flock.kind === "sonali" ? "sonali" : "broiler"}`),
          flock.breed ? o("flock_breed", flock.breed) : null,
          flock.shed && t("flocks.shed", { s: flock.shed }),
          t("broiler.dayN", { n: f.number(s.ageDays) }),
          o("flock_status", flock.status),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/broilers" className="text-sm text-stone-500 hover:text-stone-900">
              {t("broiler.allBatches")}
            </Link>
            {flock.status === "active" && s.live > 0 && (
              <ButtonLink href={`/dashboard/sales/new?product=birds&flock=${flock.id}`} variant="secondary" data-testid="sell-birds">
                {t("broiler.sell")}
              </ButtonLink>
            )}
            <ButtonLink href={`/dashboard/flocks/${flock.id}/log`}>+ {t("broiler.logTitle")}</ButtonLink>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="batch-stats">
        <StatCard label={t("broiler.liveBirds")} value={f.number(s.live)} hint={t("broiler.ofChicks", { n: f.number(flock.initial_count) })} />
        <StatCard
          label={t("flocks.mortality")}
          value={`${f.number(s.mortalityPct, 1)}%`}
          hint={t("flocks.birdsCount", { n: f.number(s.deaths) })}
          tone={s.mortalityPct > 5 ? "bad" : "default"}
        />
        <StatCard
          label={t("broiler.weight")}
          value={s.latestWeightG ? t("broiler.grams", { n: f.number(s.latestWeightG) }) : "—"}
          hint={s.latestWeightDate ? t("broiler.weighedOn", { date: f.date(s.latestWeightDate) }) : t("broiler.weighHint")}
        />
        <StatCard label="FCR" value={s.fcr ? f.number(s.fcr, 2) : "—"} hint={t("broiler.fcrHint")} />
        <StatCard label={t("broiler.feedUsed")} value={kg(s.feedKg)} />
        <StatCard label="EPEF" value={s.epef ? f.number(s.epef, 0) : "—"} hint={t("broiler.epefHint")} />
        <StatCard label={t("broiler.costPerKg")} value={s.costPerKg ? money(s.costPerKg) : "—"} hint={t("broiler.totalCost", { amount: money(s.totalCost) })} />
        <StatCard
          label={t("broiler.profit")}
          value={money(s.profit)}
          tone={s.salesAmount > 0 ? (s.profit >= 0 ? "good" : "bad") : "default"}
          hint={t("broiler.salesSoFar", { amount: money(s.salesAmount) })}
        />
      </div>
      <p className="mt-2 text-xs text-stone-500">{t("broiler.costNote")}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card title={t("broiler.logsTitle")}>
          {logs.length === 0 ? (
            <EmptyState title={t("flocks.logsEmptyTitle")}>{t("broiler.logsEmptyBody")}</EmptyState>
          ) : (
            <Table head={[t("flocks.colDate"), t("broiler.colDay"), t("flocks.colDeaths"), t("flocks.colFeed"), t("broiler.colWeight")]}>
              {logs.map((l) => (
                <ClickRow key={l.id} href={`/dashboard/flocks/${flock.id}/log?date=${l.log_date}`}>
                  <Td>{f.date(l.log_date)}</Td>
                  <Td className="tabular-nums">{f.number(Math.round((Date.parse(l.log_date) - Date.parse(flock.placed_date)) / 86_400_000))}</Td>
                  <Td className={l.mortality ? "tabular-nums text-red-600" : "tabular-nums"}>{l.mortality + l.culled ? f.number(l.mortality + l.culled) : "—"}</Td>
                  <Td className="tabular-nums">{l.feed_kg != null ? kg(Number(l.feed_kg)) : "—"}</Td>
                  <Td className="tabular-nums">{l.avg_weight_g ? t("broiler.grams", { n: f.number(Number(l.avg_weight_g)) }) : "—"}</Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card title={t("broiler.salesTitle")}>
            {(sales ?? []).length === 0 ? (
              <p className="text-sm text-stone-500">{t("broiler.noSales")}</p>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm" data-testid="batch-sales">
                {(sales ?? []).map((x) => (
                  <li key={x.id} className="flex justify-between gap-2 py-2">
                    <span>
                      {t("broiler.saleLine", { birds: f.number(Number(x.head_count ?? 0)), kg: f.number(Number(x.quantity), 1) })}
                      <span className="block text-xs text-stone-500">{f.date(x.sale_date)}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{money(Number(x.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={t("flockHealth.title")}
            action={<ButtonLink href={`/dashboard/flock-health/new?flock=${flock.id}`} variant="secondary">+ {t("flockHealth.recordShort")}</ButtonLink>}
          >
            {health.length === 0 ? (
              <p className="text-sm text-stone-500">{t("flockHealth.noneYet")}</p>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm">
                {health.map((h) => (
                  <li key={h.id}>
                    <Link href={`/dashboard/flock-health/${h.id}/edit`} className="flex items-start justify-between gap-2 py-2 hover:text-emerald-700">
                      <span>
                        {h.product}
                        <span className="block text-xs text-stone-500">{o("health_type", h.record_type)} · {f.date(h.record_date)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("broiler.statusTitle")} description={t("broiler.statusHint")}>
            <ActionForm action={updateFlockStatus} submitLabel={t("flocks.update")} submitVariant="secondary" className="flex items-end gap-2">
              <input type="hidden" name="id" value={flock.id} />
              <Select name="status" defaultValue={flock.status} options={options("flock_status", flock.status)} />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
