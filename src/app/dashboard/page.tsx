import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatMoney, formatNumber, monthStart, today } from "@/lib/format";
import type { FlockStats } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { supabase, farm } = await requireFarm();
  const day = today();
  const weekAgo = today(-6);

  const [cattleRes, milkRes, flocksRes, statsRes, eggsRes, txnRes] = await Promise.all([
    farm.has_dairy
      ? supabase
          .from("cattle")
          .select("category", { count: "exact" })
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
