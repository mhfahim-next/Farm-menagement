import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClickRow } from "@/components/click-row";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { flockDueItems } from "@/lib/flock-health";
import { today } from "@/lib/format";
import { dueLabel } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import type { FlockHealthRecord } from "@/lib/types";
import { renewFlockHealth } from "./actions";
import { keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flockHealth.meta") };
}

const typeTone = { vaccination: "blue", parasite_control: "amber", deworming: "amber", treatment: "default", checkup: "default" } as const;

export default async function FlockHealthPage({ searchParams }: PageProps<"/dashboard/flock-health">) {
  const { supabase, farm } = await requireRole(STAFF);
  if (!keepsPoultry(farm)) notFound();
  const { t, f, o, options } = await getI18n();

  const sp = await searchParams;
  const typeOptions = options("health_type");
  const typeFilter = typeOptions.find((x) => x.value === sp.type)?.value;

  let history = supabase
    .from("flock_health_records")
    .select("*")
    .eq("farm_id", farm.id)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);
  if (typeFilter) history = history.eq("record_type", typeFilter);

  const [flocksRes, scheduleRes, historyRes] = await Promise.all([
    supabase.from("flocks").select("id, name, status").eq("farm_id", farm.id).is("deleted_at", null),
    supabase.from("flock_health_records").select("*").eq("farm_id", farm.id).not("next_due_date", "is", null),
    history,
  ]);
  const flocks = flocksRes.data ?? [];
  const byId = new Map(flocks.map((fl) => [fl.id, fl]));
  const name = (id: string) => byId.get(id)?.name ?? "—";

  const day = today();
  const due = flockDueItems((scheduleRes.data ?? []) as FlockHealthRecord[], day, 30).filter(
    (d) => byId.get(d.record.flock_id)?.status === "active",
  );
  const overdue = due.filter((d) => d.overdue);
  const soon = due.filter((d) => !d.overdue && d.daysUntilDue <= 7);
  const records = (historyRes.data ?? []) as FlockHealthRecord[];
  const withdrawal = records.filter((r) => r.withdrawal_until && r.withdrawal_until >= day && byId.get(r.flock_id)?.status === "active");

  return (
    <>
      <PageHeader
        title={t("flockHealth.title")}
        description={t("flockHealth.desc")}
        action={<ButtonLink href="/dashboard/flock-health/new">+ {t("flockHealth.recordTitle")}</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("health.overdue")} value={f.number(overdue.length)} tone={overdue.length ? "bad" : "good"} hint={t("health.overdueHint")} />
        <StatCard label={t("health.due7")} value={f.number(soon.length)} />
        <StatCard label={t("health.due30")} value={f.number(due.length - overdue.length)} />
        <StatCard label={t("flockHealth.withdrawalNow")} value={f.number(withdrawal.length)} tone={withdrawal.length ? "bad" : "default"} hint={t("flockHealth.withdrawalNowHint")} />
      </div>

      <div className="mt-6 grid content-start gap-6">
        <Card title={t("flockHealth.dueTitle")} description={t("flockHealth.dueDesc")}>
          {due.length === 0 ? (
            <EmptyState title={t("health.dueEmptyTitle")}>{t("flockHealth.dueEmptyBody")}</EmptyState>
          ) : (
            <Table head={[t("flockHealth.colFlock"), t("health.colWhat"), t("health.colStatus"), ""]}>
              {due.map((d) => (
                <ClickRow key={d.record.id} href={`/dashboard/flocks/${d.record.flock_id}`}>
                  <Td>
                    <Link href={`/dashboard/flocks/${d.record.flock_id}`} className="font-medium text-emerald-700 hover:underline">
                      {name(d.record.flock_id)}
                    </Link>
                  </Td>
                  <Td>
                    {d.record.product}
                    <span className="block text-xs text-stone-500">{o("health_type", d.record.record_type)}</span>
                  </Td>
                  <Td>
                    <Badge tone={d.overdue ? "red" : d.daysUntilDue <= 7 ? "amber" : "default"}>{dueLabel(t, d.daysUntilDue)}</Badge>
                    <span className="block text-xs text-stone-500">{f.date(d.record.next_due_date)}</span>
                  </Td>
                  <Td className="text-right">
                    <ConfirmForm action={renewFlockHealth} fields={{ id: d.record.id }} label={t("health.doneToday")} />
                  </Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title={t("health.historyTitle")}
          action={
            <form className="flex gap-2">
              <Select name="type" defaultValue={typeFilter ?? ""} className="w-auto" options={[{ value: "", label: t("health.allTypes") }, ...typeOptions]} />
              <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">{t("common.filter")}</button>
            </form>
          }
        >
          {records.length === 0 ? (
            <EmptyState title={t("health.noRecords")} />
          ) : (
            <Table head={[t("health.colDate"), t("flockHealth.colFlock"), t("health.colWhat"), t("health.colNextDue"), t("health.colCost")]}>
              {records.map((r) => (
                <ClickRow key={r.id} href={`/dashboard/flock-health/${r.id}/edit`}>
                  <Td>{f.date(r.record_date)}</Td>
                  <Td>{name(r.flock_id)}</Td>
                  <Td>
                    <Badge tone={typeTone[r.record_type]}>{o("health_type", r.record_type)}</Badge>
                    <span className="mt-0.5 block">{r.product}</span>
                    {r.dose && <span className="block text-xs text-stone-500">{r.dose}</span>}
                  </Td>
                  <Td>{f.date(r.next_due_date)}</Td>
                  <Td>{r.cost != null ? f.money(r.cost, farm.currency) : "—"}</Td>
                </ClickRow>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
