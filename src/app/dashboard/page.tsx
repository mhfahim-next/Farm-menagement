import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatMoney, formatNumber, monthStart, today } from "@/lib/format";
import { loadBreedingBoard } from "@/lib/breeding-data";
import { dueItems, dueLabel } from "@/lib/health";
import type { FlockStats, HealthRecord } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const breedingAlertText = {
  heat_expected: "Heat expected",
  return_to_heat: "Watch for return to heat",
  pregnancy_check: "Pregnancy check due",
  dry_off: "Dry off",
  calving_soon: "Calving soon",
  service_overdue: "Not yet inseminated after calving",
} as const;

export default async function OverviewPage() {
  const { supabase, farm } = await requireFarm();
  const day = today();
  const weekAgo = today(-6);

  const [cattleRes, milkRes, flocksRes, statsRes, eggsRes, txnRes, scheduleRes, board] = await Promise.all([
    farm.has_dairy
      ? supabase
          .from("cattle")
          .select("id, tag_number, name, category", { count: "exact" })
          .eq("farm_id", farm.id)
          .eq("status", "active")
          .is("deleted_at", null)
      : null,
    farm.has_dairy
      ? supabase
          .from("milk_records")
          .select("record_date, quantity_liters")
          .eq("farm_id", farm.id)
          .gte("record_date", weekAgo)
      : null,
    farm.has_layer
      ? supabase
          .from("flocks")
          .select("id")
          .eq("farm_id", farm.id)
          .eq("status", "active")
          .is("deleted_at", null)
      : null,
    farm.has_layer
      ? supabase.from("flock_stats").select("*").eq("farm_id", farm.id)
      : null,
    farm.has_layer
      ? supabase
          .from("flock_daily_logs")
          .select("log_date, eggs_collected")
          .eq("farm_id", farm.id)
          .gte("log_date", weekAgo)
      : null,
    supabase
      .from("transactions")
      .select("txn_type, amount")
      .eq("farm_id", farm.id)
      .gte("txn_date", monthStart()),
    farm.has_dairy
      ? supabase
          .from("health_records")
          .select("*")
          .eq("farm_id", farm.id)
          .not("next_due_date", "is", null)
      : null,
    farm.has_dairy ? loadBreedingBoard({ supabase, farm }) : null,
  ]);

  const cattle = cattleRes?.data ?? [];
  const milkingCows = cattle.filter((c) => c.category === "cow").length;
  const milk = milkRes?.data ?? [];
  const activeFlockIds = new Set((flocksRes?.data ?? []).map((f) => f.id));
  const birds = ((statsRes?.data ?? []) as FlockStats[])
    .filter((s) => activeFlockIds.has(s.flock_id))
    .reduce((sum, s) => sum + s.current_count, 0);
  const eggs = eggsRes?.data ?? [];
  const txns = txnRes.data ?? [];

  const milkToday = milk
    .filter((m) => m.record_date === day)
    .reduce((s, m) => s + Number(m.quantity_liters), 0);
  const eggsToday = eggs
    .filter((e) => e.log_date === day)
    .reduce((s, e) => s + e.eggs_collected, 0);
  const income = txns.filter((t) => t.txn_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txns.filter((t) => t.txn_type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Reminders: health schedules + breeding alerts, most urgent first.
  const cowName = new Map(
    cattle.map((c) => [c.id, `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`]),
  );
  // Only active animals — sold or dead ones shouldn't raise reminders.
  const healthDue = dueItems((scheduleRes?.data ?? []) as HealthRecord[], day, 14).filter((d) =>
    cowName.has(d.record.cattle_id),
  );
  const reminders = [
    ...healthDue.map((d) => ({
      key: `h-${d.record.id}`,
      cattleId: d.record.cattle_id,
      title: `${d.record.product ?? d.record.description} (${d.record.record_type.replace(/_/g, " ")})`,
      status: dueLabel(d.daysUntilDue),
      days: d.daysUntilDue,
      tone: d.overdue ? ("red" as const) : ("amber" as const),
      href: "/dashboard/health",
    })),
    ...(board?.cows ?? []).flatMap((c) =>
      c.alerts.map((a) => ({
        key: `b-${c.id}-${a.kind}`,
        cattleId: c.id,
        title: breedingAlertText[a.kind],
        status: a.date ? dueLabel(a.daysUntil) : "Review",
        days: a.date ? a.daysUntil : 0,
        tone: a.kind === "service_overdue" || a.daysUntil < 0 ? ("red" as const) : ("blue" as const),
        href: "/dashboard/breeding",
      })),
    ),
  ].sort((a, b) => a.days - b.days);

  const days = Array.from({ length: 7 }, (_, i) => today(i - 6));
  const milkByDay = days.map((d) => ({
    day: d,
    value: milk.filter((m) => m.record_date === d).reduce((s, m) => s + Number(m.quantity_liters), 0),
  }));
  const eggsByDay = days.map((d) => ({
    day: d,
    value: eggs.filter((e) => e.log_date === d).reduce((s, e) => s + e.eggs_collected, 0),
  }));

  return (
    <>
      <PageHeader title="Overview" description={`Today on ${farm.name}`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {farm.has_dairy && (
          <>
            <StatCard
              label="Active cattle"
              value={formatNumber(cattleRes?.count ?? 0)}
              hint={`${milkingCows} cows`}
            />
            <StatCard label="Milk today" value={`${formatNumber(milkToday, 1)} L`} />
          </>
        )}
        {farm.has_layer && (
          <>
            <StatCard
              label="Live birds"
              value={formatNumber(birds)}
              hint={`${activeFlockIds.size} active flocks`}
            />
            <StatCard
              label="Eggs today"
              value={formatNumber(eggsToday)}
              hint={birds > 0 ? `${formatNumber((eggsToday / birds) * 100, 1)}% hen-day` : undefined}
            />
          </>
        )}
        <StatCard label="Income this month" value={formatMoney(income, farm.currency)} tone="good" />
        <StatCard label="Expenses this month" value={formatMoney(expense, farm.currency)} tone="bad" />
        <StatCard
          label="Profit this month"
          value={formatMoney(income - expense, farm.currency)}
          tone={income - expense >= 0 ? "good" : "bad"}
        />
      </div>

      {farm.has_dairy && (
        <Card
          className="mt-6"
          title="Needs attention"
          description="Vaccines, pest control, heats, pregnancy checks and calvings coming up."
          action={
            <div className="flex gap-2">
              <ButtonLink href="/dashboard/health" variant="secondary">Health</ButtonLink>
              <ButtonLink href="/dashboard/breeding" variant="secondary">Breeding</ButtonLink>
            </div>
          }
        >
          {reminders.length === 0 ? (
            <p className="text-sm text-stone-500">All caught up — nothing is due in the next two weeks.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {reminders.slice(0, 8).map((r) => (
                <li key={r.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <Link href={`/dashboard/cattle/${r.cattleId}`} className="font-medium text-emerald-700 hover:underline">
                      {cowName.get(r.cattleId) ?? "Animal"}
                    </Link>{" "}
                    <span className="text-stone-600">— {r.title}</span>
                  </span>
                  <Badge tone={r.tone}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          {reminders.length > 8 && (
            <p className="mt-2 text-xs text-stone-500">+ {reminders.length - 8} more on the Health and Breeding pages.</p>
          )}
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {farm.has_dairy && (
          <Card
            title="Milk — last 7 days"
            action={<ButtonLink href="/dashboard/milk" variant="secondary">Record milk</ButtonLink>}
          >
            <MiniBars data={milkByDay} unit="L" />
          </Card>
        )}
        {farm.has_layer && (
          <Card
            title="Eggs — last 7 days"
            action={<ButtonLink href="/dashboard/flocks" variant="secondary">Log eggs</ButtonLink>}
          >
            <MiniBars data={eggsByDay} unit="" />
          </Card>
        )}
      </div>

      {farm.has_dairy && !cattleRes?.count && (
        <div className="mt-6">
          <EmptyState title="Start by adding your animals">
            <Link href="/dashboard/cattle" className="text-emerald-700 hover:underline">
              Add your first cow
            </Link>{" "}
            {farm.has_layer && (
              <>
                or{" "}
                <Link href="/dashboard/flocks" className="text-emerald-700 hover:underline">
                  add a layer flock
                </Link>
              </>
            )}
          </EmptyState>
        </div>
      )}
    </>
  );
}

function MiniBars({ data, unit }: { data: { day: string; value: number }[]; unit: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => (
        <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-1">
          <span className="text-xs tabular-nums text-stone-500">
            {d.value ? formatNumber(d.value, 0) + unit : ""}
          </span>
          <div className="relative w-full flex-1">
            <div
              className="absolute inset-x-0 bottom-0 rounded-t bg-emerald-600"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
              title={`${d.day}: ${d.value}${unit}`}
            />
          </div>
          <span className="text-xs text-stone-500">
            {new Date(d.day + "T00:00:00Z").toLocaleDateString("en-GB", {
              weekday: "short",
              timeZone: "UTC",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
