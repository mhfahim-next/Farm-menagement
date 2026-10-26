import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClickRow } from "@/components/click-row";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { today } from "@/lib/format";
import { dueItems, dueLabel } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import type { HealthRecord } from "@/lib/types";
import { renewHealth } from "./actions";
import { keepsAnimals } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.meta") };
}

const typeTone = {
  vaccination: "blue",
  parasite_control: "amber",
  deworming: "amber",
  treatment: "default",
  checkup: "default",
} as const;

export default async function HealthPage({ searchParams }: PageProps<"/dashboard/health">) {
  const { supabase, farm } = await requireFarm();
  if (!keepsAnimals(farm)) notFound();
  const { t, f, o, options } = await getI18n();

  const sp = await searchParams;
  const typeOptions = options("health_type");
  const typeFilter = typeOptions.find((o) => o.value === sp.type)?.value;

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
      <PageHeader
        title={t("health.title")}
        description={t("health.desc")}
        action={<ButtonLink href="/dashboard/health/new">+ {t("health.recordTitle")}</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t("health.overdue")} value={f.number(overdue.length)} tone={overdue.length ? "bad" : "good"} hint={t("health.overdueHint")} />
        <StatCard label={t("health.due7")} value={f.number(soon.length)} />
        <StatCard label={t("health.due30")} value={f.number(due.length - overdue.length)} />
      </div>

      <div className="mt-6">
        <div className="grid content-start gap-6">
          <Card title={t("health.dueTitle")} description={t("health.dueDesc")}>
            {due.length === 0 ? (
              <EmptyState title={t("health.dueEmptyTitle")}>{t("health.dueEmptyBody")}</EmptyState>
            ) : (
              <Table head={[t("health.colAnimal"), t("health.colWhat"), t("health.colStatus"), ""]}>
                {due.map((d) => (
                  <ClickRow key={d.record.id} href={`/dashboard/cattle/${d.record.cattle_id}`}>
                    <Td>
                      <Link href={`/dashboard/cattle/${d.record.cattle_id}`} className="font-medium text-emerald-700 hover:underline">
                        {animalLabel(d.record.cattle_id)}
                      </Link>
                    </Td>
                    <Td>
                      {d.record.product ?? d.record.description}
                      <span className="block text-xs text-stone-500">{o("health_type", d.record.record_type)}</span>
                    </Td>
                    <Td>
                      <Badge tone={d.overdue ? "red" : d.daysUntilDue <= 7 ? "amber" : "default"}>{dueLabel(t, d.daysUntilDue)}</Badge>
                      <span className="block text-xs text-stone-500">{f.date(d.record.next_due_date)}</span>
                    </Td>
                    <Td className="text-right">
                      <ConfirmForm action={renewHealth} fields={{ id: d.record.id }} label={t("health.doneToday")} />
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
                <Select
                  name="type"
                  defaultValue={typeFilter ?? ""}
                  className="w-auto"
                  options={[{ value: "", label: t("health.allTypes") }, ...typeOptions]}
                />
                <button className="rounded-lg border border-stone-300 px-3 text-sm hover:bg-stone-50">{t("common.filter")}</button>
              </form>
            }
          >
            {history.length === 0 ? (
              <EmptyState title={t("health.noRecords")} />
            ) : (
              <Table head={[t("health.colDate"), t("health.colAnimal"), t("health.colWhat"), t("health.colNextDue"), t("health.colCost"), ""]}>
                {history.map((h) => (
                  <ClickRow key={h.id} href={`/dashboard/health/${h.id}/edit`}>
                    <Td>{f.date(h.record_date)}</Td>
                    <Td>
                      <Link href={`/dashboard/cattle/${h.cattle_id}`} className="text-emerald-700 hover:underline">
                        {animalLabel(h.cattle_id)}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={typeTone[h.record_type]}>{o("health_type", h.record_type)}</Badge>
                      <span className="mt-0.5 block">{h.product ?? h.description}</span>
                      {h.dose && <span className="block text-xs text-stone-500">{h.dose}</span>}
                    </Td>
                    <Td>{f.date(h.next_due_date)}</Td>
                    <Td>{h.cost != null ? f.money(h.cost, farm.currency) : "—"}</Td>
                    <Td className="text-right">
                      <Link href={`/dashboard/health/${h.id}/edit`} className="text-sm text-emerald-700 hover:underline" data-testid="edit-health">
                        {t("common.edit")}
                      </Link>
                    </Td>
                  </ClickRow>
                ))}
              </Table>
            )}
          </Card>
        </div>

      </div>
    </>
  );
}
