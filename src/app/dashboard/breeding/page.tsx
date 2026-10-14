import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedingForm } from "@/components/breeding-form";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { daysBetween, type BreedingAlertKind } from "@/lib/breeding";
import { loadBreedingBoard, type CowRepro } from "@/lib/breeding-data";
import { formatDate, label, today } from "@/lib/format";
import { logBreedingEvent } from "./actions";

export const metadata: Metadata = { title: "Breeding" };

const alertText: Record<BreedingAlertKind, string> = {
  heat_expected: "Heat expected",
  return_to_heat: "Watch for return to heat",
  pregnancy_check: "Pregnancy check due",
  dry_off: "Dry off",
  calving_soon: "Calving soon",
  service_overdue: "Not yet inseminated",
};

const alertTone: Record<BreedingAlertKind, "amber" | "red" | "blue" | "green"> = {
  heat_expected: "amber",
  return_to_heat: "amber",
  pregnancy_check: "blue",
  dry_off: "blue",
  calving_soon: "green",
  service_overdue: "red",
};

function when(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

const stateBadge = {
  pregnant: { tone: "green", text: "Pregnant" },
  inseminated: { tone: "blue", text: "Inseminated" },
  open: { tone: "default", text: "Open" },
} as const;

export default async function BreedingPage() {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();

  const day = today();
  const { cows, events } = await loadBreedingBoard({ supabase, farm });
  const byId = new Map(cows.map((c) => [c.id, c]));
  const cowLabel = (c: Pick<CowRepro, "tag_number" | "name">) => `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`;

  const attention = cows
    .flatMap((c) => c.alerts.map((a) => ({ cow: c, alert: a })))
    .sort((a, b) => a.alert.daysUntil - b.alert.daysUntil);

  const count = (s: "pregnant" | "inseminated" | "open") => cows.filter((c) => c.status.state === s).length;
  const recent = events.slice(0, 30);

  return (
    <>
      <PageHeader title="Breeding" description="Heat, artificial insemination, pregnancy and calving." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Pregnant" value={count("pregnant")} tone="good" />
        <StatCard label="Inseminated, waiting" value={count("inseminated")} />
        <StatCard label="Open" value={count("open")} />
        <StatCard label="Need attention" value={attention.length} tone={attention.length ? "bad" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card title="Needs attention" description="Based on heat cycles (21 days), a pregnancy check about 45 days after AI, and 283 days of gestation.">
            {attention.length === 0 ? (
              <EmptyState title="Nothing needs attention right now" />
            ) : (
              <Table head={["Cow", "What", "When"]}>
                {attention.map(({ cow, alert }) => (
                  <tr key={`${cow.id}-${alert.kind}`}>
                    <Td>
                      <Link href={`/dashboard/cattle/${cow.id}`} className="font-medium text-emerald-700 hover:underline">
                        {cowLabel(cow)}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={alertTone[alert.kind]}>{alertText[alert.kind]}</Badge>
                    </Td>
                    <Td>
                      {alert.date ? (
                        <>
                          {formatDate(alert.date)}
                          <span className="block text-xs text-stone-500">{when(alert.daysUntil)}</span>
                        </>
                      ) : cow.status.daysOpen != null ? (
                        <span className="text-xs text-stone-500">{cow.status.daysOpen} days since calving</span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Herd status">
            {cows.length === 0 ? (
              <EmptyState title="No cows or heifers yet">Add females on the Cattle page.</EmptyState>
            ) : (
              <Table head={["Cow", "Status", "Last heat", "Last AI", "Next step", "Calving"]}>
                {cows.map((c) => {
                  const s = c.status;
                  const badge = stateBadge[s.state];
                  const next =
                    s.state === "open"
                      ? s.nextHeatExpected
                        ? `Heat ~${formatDate(s.nextHeatExpected)}`
                        : s.lastCalving
                          ? "Record heat"
                          : "—"
                      : s.state === "inseminated"
                        ? `Check ${formatDate(s.pregnancyCheckDue)}`
                        : s.dryOffDue
                          ? `Dry off ${formatDate(s.dryOffDue)}`
                          : "—";
                  return (
                    <tr key={c.id}>
                      <Td>
                        <Link href={`/dashboard/cattle/${c.id}`} className="font-medium text-emerald-700 hover:underline">
                          {cowLabel(c)}
                        </Link>
                        <span className="block text-xs text-stone-500">{label(c.category)}</span>
                      </Td>
                      <Td>
                        <Badge tone={badge.tone}>{badge.text}</Badge>
                        {s.inseminationCount > 1 && (
                          <span className="block text-xs text-stone-500">{s.inseminationCount} services</span>
                        )}
                      </Td>
                      <Td>{formatDate(s.lastHeat)}</Td>
                      <Td>{formatDate(s.lastInsemination)}</Td>
                      <Td>{next}</Td>
                      <Td>
                        {s.expectedCalving ? (
                          <>
                            {formatDate(s.expectedCalving)}
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

          <Card title="Recent events">
            {recent.length === 0 ? (
              <EmptyState title="No breeding events yet" />
            ) : (
              <Table head={["Date", "Cow", "Event", "Details"]}>
                {recent.map((e) => {
                  const cow = byId.get(e.cattle_id);
                  const details = [
                    e.bull_or_semen,
                    e.technician && `by ${e.technician}`,
                    e.event_type === "pregnancy_check" && e.result ? label(e.result) : null,
                    e.heat_signs,
                    e.expected_calving_date && `calving ${formatDate(e.expected_calving_date)}`,
                  ].filter(Boolean);
                  return (
                    <tr key={e.id}>
                      <Td>{formatDate(e.event_date)}</Td>
                      <Td>{cow ? cowLabel(cow) : "—"}</Td>
                      <Td>{label(e.event_type)}</Td>
                      <Td className="text-xs">{details.join(" · ") || "—"}</Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </div>

        <Card title="Record event">
          {cows.length === 0 ? (
            <EmptyState title="No cows or heifers yet" />
          ) : (
            <BreedingForm
              action={logBreedingEvent}
              today={day}
              currency={farm.currency}
              cows={cows.map((c) => ({ id: c.id, label: cowLabel(c) }))}
            />
          )}
        </Card>
      </div>
    </>
  );
}
