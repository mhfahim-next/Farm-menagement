import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatDate, formatNumber, label, today } from "@/lib/format";
import type { Flock, FlockDailyLog } from "@/lib/types";
import { saveDailyLog, updateFlockStatus } from "../actions";
import { flockAgeWeeks, withDailyStats } from "../utils";

export const metadata: Metadata = { title: "Flock" };

export default async function FlockDetailPage({ params, searchParams }: PageProps<"/dashboard/flocks/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, farm } = await requireFarm();

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
        description={[flock.breed, flock.shed && `Shed ${flock.shed}`, `${flockAgeWeeks(flock)} weeks old`, label(flock.status)]
          .filter(Boolean)
          .join(" · ")}
        action={
          <Link href="/dashboard/flocks" className="text-sm text-stone-500 hover:text-stone-900">
            ← All flocks
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live birds" value={formatNumber(alive)} hint={`of ${formatNumber(flock.initial_count)} placed`} />
        <StatCard
          label="Hen-day production (7 d)"
          value={`${formatNumber(avgHenDay, 1)}%`}
          tone={avgHenDay >= 80 ? "good" : avgHenDay > 0 && avgHenDay < 60 ? "bad" : "default"}
        />
        <StatCard
          label="Mortality"
          value={`${formatNumber((totalMortality / flock.initial_count) * 100, 2)}%`}
          hint={`${formatNumber(totalMortality)} birds`}
        />
        <StatCard
          label="Feed per dozen eggs"
          value={totalEggs ? `${formatNumber(totalFeed / (totalEggs / 12), 2)} kg` : "—"}
          hint={`${formatNumber(totalEggs)} eggs total`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title="Daily logs" description="Last 30 entries">
          {recent.length === 0 ? (
            <EmptyState title="No logs yet">Use the form to record today.</EmptyState>
          ) : (
            <Table head={["Date", "Eggs", "Broken", "Hen-day", "Deaths", "Feed", "g/bird"]}>
              {recent.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <Link href={`?date=${r.log_date}`} className="text-emerald-700 hover:underline">
                      {formatDate(r.log_date)}
                    </Link>
                  </Td>
                  <Td className="tabular-nums">{formatNumber(r.eggs_collected)}</Td>
                  <Td className="tabular-nums">{r.eggs_broken || "—"}</Td>
                  <Td className="tabular-nums">{formatNumber(r.henDay, 1)}%</Td>
                  <Td className={r.mortality ? "tabular-nums text-red-600" : "tabular-nums"}>
                    {r.mortality + r.culled || "—"}
                  </Td>
                  <Td className="tabular-nums">{r.feed_kg != null ? `${formatNumber(Number(r.feed_kg), 1)} kg` : "—"}</Td>
                  <Td className="tabular-nums">{r.feedPerBird != null ? formatNumber(r.feedPerBird, 0) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card
            title={existing ? `Edit log · ${formatDate(logDate)}` : "Daily log"}
            description="Saving the same date again updates it."
          >
            <form className="mb-3 flex items-end gap-2">
              <Field label="Date" className="flex-1">
                <Input name="date" type="date" defaultValue={logDate} max={today()} />
              </Field>
              <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">Load</button>
            </form>
            <ActionForm action={saveDailyLog} submitLabel="Save log" key={logDate}>
              <input type="hidden" name="flock_id" value={flock.id} />
              <input type="hidden" name="log_date" value={logDate} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Eggs collected">
                  <Input name="eggs_collected" type="number" min="0" inputMode="numeric" defaultValue={existing?.eggs_collected ?? ""} required />
                </Field>
                <Field label="Broken / rejected">
                  <Input name="eggs_broken" type="number" min="0" inputMode="numeric" defaultValue={existing?.eggs_broken ?? ""} />
                </Field>
                <Field label="Deaths">
                  <Input name="mortality" type="number" min="0" inputMode="numeric" defaultValue={existing?.mortality ?? ""} />
                </Field>
                <Field label="Culled">
                  <Input name="culled" type="number" min="0" inputMode="numeric" defaultValue={existing?.culled ?? ""} />
                </Field>
                <Field label="Feed (kg)">
                  <Input name="feed_kg" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={existing?.feed_kg ?? ""} />
                </Field>
                <Field label="Water (L)">
                  <Input name="water_liters" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={existing?.water_liters ?? ""} />
                </Field>
              </div>
              <Field label="Notes">
                <Input name="notes" defaultValue={existing?.notes ?? ""} />
              </Field>
            </ActionForm>
          </Card>

          <Card title="Flock status">
            <ActionForm action={updateFlockStatus} submitLabel="Update" submitVariant="secondary" className="flex items-end gap-2">
              <input type="hidden" name="id" value={flock.id} />
              <Select
                name="status"
                defaultValue={flock.status}
                options={[
                  { value: "active", label: "Active" },
                  { value: "sold", label: "Sold" },
                  { value: "culled", label: "Culled (depleted)" },
                ]}
              />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
