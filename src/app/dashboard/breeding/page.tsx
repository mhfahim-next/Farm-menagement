import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedingForm } from "@/components/breeding-form";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { daysBetween, heatSignsText, type BreedingAlertKind } from "@/lib/breeding";
import { loadBreedingBoard, type CowRepro } from "@/lib/breeding-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { logBreedingEvent } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("breeding.meta") };
}

const alertTone: Record<BreedingAlertKind, "amber" | "red" | "blue" | "green"> = {
  heat_expected: "amber",
  return_to_heat: "amber",
  pregnancy_check: "blue",
  dry_off: "blue",
  calving_soon: "green",
  service_overdue: "red",
};

const stateTone = { pregnant: "green", inseminated: "blue", open: "default" } as const;

export default async function BreedingPage() {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();

  const { t, f, o } = await getI18n();
  const day = today();
  const when = (days: number) => {
    if (days === 0) return t("breeding.whenToday");
    if (days === 1) return t("breeding.whenTomorrow");
    if (days === -1) return t("breeding.whenYesterday");
    return days > 0 ? t("breeding.whenIn", { n: days }) : t("breeding.whenAgo", { n: -days });
  };
  const { cows, events, checkDays } = await loadBreedingBoard({ supabase, farm });
  const byId = new Map(cows.map((c) => [c.id, c]));
  const cowLabel = (c: Pick<CowRepro, "tag_number" | "name">) => `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`;

  const attention = cows
    .flatMap((c) => c.alerts.map((a) => ({ cow: c, alert: a })))
    .sort((a, b) => a.alert.daysUntil - b.alert.daysUntil);

  const count = (s: "pregnant" | "inseminated" | "open") => cows.filter((c) => c.status.state === s).length;
  const recent = events.slice(0, 30);

  return (
    <>
      <PageHeader title={t("breeding.title")} description={t("breeding.desc")} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("breeding.pregnant")} value={f.number(count("pregnant"))} tone="good" />
        <StatCard label={t("breeding.inseminatedWaiting")} value={f.number(count("inseminated"))} />
        <StatCard label={t("breeding.open")} value={f.number(count("open"))} />
        <StatCard label={t("breeding.needAttention")} value={f.number(attention.length)} tone={attention.length ? "bad" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card title={t("breeding.attentionTitle")} description={t("breeding.attentionDesc", { days: checkDays })}>
            {attention.length === 0 ? (
              <EmptyState title={t("breeding.attentionEmpty")} />
            ) : (
              <Table head={[t("breeding.colCow"), t("breeding.colWhat"), t("breeding.colWhen")]}>
                {attention.map(({ cow, alert }) => (
                  <tr key={`${cow.id}-${alert.kind}`}>
                    <Td>
                      <Link href={`/dashboard/cattle/${cow.id}`} className="font-medium text-emerald-700 hover:underline">
                        {cowLabel(cow)}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={alertTone[alert.kind]}>{t(`breeding.alert.${alert.kind}`)}</Badge>
                    </Td>
                    <Td>
                      {alert.date ? (
                        <>
                          {f.date(alert.date)}
                          <span className="block text-xs text-stone-500">{when(alert.daysUntil)}</span>
                        </>
                      ) : cow.status.daysOpen != null ? (
                        <span className="text-xs text-stone-500">{t("breeding.sinceCalving", { n: cow.status.daysOpen })}</span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title={t("breeding.herdTitle")}>
            {cows.length === 0 ? (
              <EmptyState title={t("breeding.noCowsTitle")}>{t("breeding.noCowsBody")}</EmptyState>
            ) : (
              <Table head={[t("breeding.colCow"), t("breeding.colStatus"), t("breeding.colLastHeat"), t("breeding.colLastAi"), t("breeding.colNext"), t("breeding.colCalving")]}>
                {cows.map((c) => {
                  const s = c.status;
                                    const next =
                    s.state === "open"
                      ? s.nextHeatExpected
                        ? t("breeding.nextHeat", { date: f.date(s.nextHeatExpected) })
                        : s.lastCalving
                          ? t("breeding.recordHeat")
                          : "—"
                      : s.state === "inseminated"
                        ? t("breeding.checkOn", { date: f.date(s.pregnancyCheckDue) })
                        : s.dryOffDue
                          ? t("breeding.dryOffOn", { date: f.date(s.dryOffDue) })
                          : "—";
                  return (
                    <tr key={c.id}>
                      <Td>
                        <Link href={`/dashboard/cattle/${c.id}`} className="font-medium text-emerald-700 hover:underline">
                          {cowLabel(c)}
                        </Link>
                        <span className="block text-xs text-stone-500">{o("cattle_category", c.category)}</span>
                      </Td>
                      <Td>
                        <Badge tone={stateTone[s.state]}>{t(`breeding.state.${s.state}`)}</Badge>
                        {s.inseminationCount > 1 && (
                          <span className="block text-xs text-stone-500">{t("breeding.services", { n: s.inseminationCount })}</span>
                        )}
                      </Td>
                      <Td>{f.date(s.lastHeat)}</Td>
                      <Td>{f.date(s.lastInsemination)}</Td>
                      <Td>{next}</Td>
                      <Td>
                        {s.expectedCalving ? (
                          <>
                            {f.date(s.expectedCalving)}
                            <span className="block text-xs text-stone-500">{when(daysBetween(day, s.expectedCalving))}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>

          <Card title={t("breeding.recentTitle")}>
            {recent.length === 0 ? (
              <EmptyState title={t("breeding.noEvents")} />
            ) : (
              <Table head={[t("breeding.colDate"), t("breeding.colCow"), t("breeding.colEvent"), t("breeding.colDetails"), ""]}>
                {recent.map((ev) => {
                  const cow = byId.get(ev.cattle_id);
                  const details = [
                    ev.bull_or_semen,
                    ev.technician && t("breeding.by", { name: ev.technician }),
                    ev.event_type === "pregnancy_check" && ev.result ? o("pregnancy_result", ev.result) : null,
                    heatSignsText(o, ev.heat_signs),
                    ev.expected_calving_date && t("breeding.calvingOn", { date: f.date(ev.expected_calving_date) }),
                  ].filter(Boolean);
                  return (
                    <tr key={ev.id}>
                      <Td>
                    {f.date(ev.event_date)}
                    {ev.event_time && <span className="block text-xs text-stone-500">{f.time(ev.event_time)}</span>}
                  </Td>
                      <Td>{cow ? cowLabel(cow) : "—"}</Td>
                      <Td>{o("breeding_event", ev.event_type)}</Td>
                      <Td className="text-xs">{details.join(" · ") || "—"}</Td>
                      <Td className="text-right">
                        <Link href={`/dashboard/breeding/${ev.id}/edit`} className="text-sm text-emerald-700 hover:underline" data-testid="edit-breeding">
                          {t("common.edit")}
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </div>

        <Card title={t("breeding.recordTitle")}>
          {cows.length === 0 ? (
            <EmptyState title={t("breeding.noCowsTitle")} />
          ) : (
            <BreedingForm
              action={logBreedingEvent}
              today={day}
              currency={farm.currency}
              checkDays={checkDays}
              cows={cows.map((c) => ({ id: c.id, label: cowLabel(c) }))}
            />
          )}
        </Card>
      </div>
    </>
  );
}
