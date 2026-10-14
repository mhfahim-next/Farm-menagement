import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HealthForm } from "@/components/health-form";
import { Badge, Button, Card, EmptyState, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatDate, formatMoney, label, today } from "@/lib/format";
import { dueItems, dueLabel, healthTypeOptions } from "@/lib/health";
import type { HealthRecord } from "@/lib/types";
import { recordHealth, renewHealth } from "./actions";

export const metadata: Metadata = { title: "Health" };

const typeTone = {
  vaccination: "blue",
  parasite_control: "amber",
  deworming: "amber",
  treatment: "default",
  checkup: "default",
} as const;

export default async function HealthPage({ searchParams }: PageProps<"/dashboard/health">) {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_dairy) notFound();

  const sp = await searchParams;
  const typeFilter = healthTypeOptions.find((o) => o.value === sp.type)?.value;

  let historyQuery = supabase
    .from("health_records")
    .select("*")
    .eq("farm_id", farm.id)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);
  if (typeFilter) historyQuery = historyQuery.eq("record_type", typeFilter);

  const [cattleRes, scheduleRes, historyRes] = await Promise.all([
    supabase.from("cattle").select("id, tag_number, name, category, status").eq("farm_id", farm.id).is("deleted_at", null).order("tag_number"),
    supabase.from("health_records").select("*").eq("farm_id", farm.id).not("next_due_date", "is", null),
    historyQuery,
  ]);

  const cattle = cattleRes.data ?? [];
  const byId = new Map(cattle.map((c) => [c.id, c]));
  const active = cattle.filter((c) => c.status === "active");
  const animalLabel = (id: string) => {
    const c = byId.get(id);
    return c ? `${c.tag_number}${c.name ? ` · ${c.name}` : ""}` : "—";
  };

  const day = today();
  const due = dueItems((scheduleRes.data ?? []) as HealthRecord[], day, 30).filter(
    (d) => byId.get(d.record.cattle_id)?.status === "active",
  );
  const overdue = due.filter((d) => d.overdue);
  const soon = due.filter((d) => !d.overdue && d.daysUntilDue <= 7);
  const history = (historyRes.data ?? []) as HealthRecord[];

  return (
    <>
      <PageHeader title="Health" description="Vaccines, parasite control and treatments — with automatic reminders." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Overdue" value={overdue.length} tone={overdue.length ? "bad" : "good"} hint="vaccines & pest control" />
        <StatCard label="Due in 7 days" value={soon.length} />
        <StatCard label="Due in 30 days" value={due.length - overdue.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card title="Due & overdue" description="Next 30 days. Tap “Done today” after you give it — the next date is set for you.">
            {due.length === 0 ? (
              <EmptyState title="Nothing due">
                Record a vaccine or tick spray with a repeat interval and it will show up here before it is due.
              </EmptyState>
            ) : (
              <Table head={["Animal", "What", "Status", ""]}>
                {due.map((d) => (
                  <tr key={d.record.id}>
                    <Td>
                      <Link href={`/dashboard/cattle/${d.record.cattle_id}`} className="font-medium text-emerald-700 hover:underline">
                        {animalLabel(d.record.cattle_id)}
                      </Link>
                    </Td>
                    <Td>
                      {d.record.product ?? d.record.description}
                      <span className="block text-xs text-stone-500">{label(d.record.record_type)}</span>
                    </Td>
                    <Td>
                      <Badge tone={d.overdue ? "red" : d.daysUntilDue <= 7 ? "amber" : "default"}>{dueLabel(d.daysUntilDue)}</Badge>
                      <span className="block text-xs text-stone-500">{formatDate(d.record.next_due_date)}</span>
                    </Td>
                    <Td className="text-right">
                      <form action={renewHealth}>
                        <input type="hidden" name="id" value={d.record.id} />
                        <Button type="submit" variant="secondary" className="px-3 py-1.5">
                          Done today
                        </Button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card
            title="History"
            action={
              <form className="flex gap-2">
                <Select
                  name="type"
                  defaultValue={typeFilter ?? ""}
                  className="w-auto"
                  options={[{ value: "", label: "All types" }, ...healthTypeOptions]}
                />
                <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">Filter</button>
              </form>
            }
          >
            {history.length === 0 ? (
              <EmptyState title="No records yet" />
            ) : (
              <Table head={["Date", "Animal", "What", "Next due", "Cost"]}>
                {history.map((h) => (
                  <tr key={h.id}>
                    <Td>{formatDate(h.record_date)}</Td>
                    <Td>
                      <Link href={`/dashboard/cattle/${h.cattle_id}`} className="text-emerald-700 hover:underline">
                        {animalLabel(h.cattle_id)}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={typeTone[h.record_type]}>{label(h.record_type)}</Badge>
                      <span className="mt-0.5 block">{h.product ?? h.description}</span>
                      {h.dose && <span className="block text-xs text-stone-500">{h.dose}</span>}
                    </Td>
                    <Td>{formatDate(h.next_due_date)}</Td>
                    <Td>{h.cost != null ? formatMoney(h.cost, farm.currency) : "—"}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <Card title="Record vaccine / treatment" description="Select one animal or the whole herd.">
          {active.length === 0 ? (
            <EmptyState title="No active animals">Add cattle first.</EmptyState>
          ) : (
            <HealthForm
              action={recordHealth}
              today={day}
              currency={farm.currency}
              animals={active.map((c) => ({
                id: c.id,
                label: `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`,
                category: c.category,
              }))}
            />
          )}
        </Card>
      </div>
    </>
  );
}
