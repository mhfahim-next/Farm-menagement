import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { BreedingForm } from "@/components/breeding-form";
import { HealthForm } from "@/components/health-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { heatSignsText, reproStatus } from "@/lib/breeding";
import { ageInMonths, today } from "@/lib/format";
import { dueItems, dueLabel } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import type { BreedingEvent, Cattle, HealthRecord, MilkRecord } from "@/lib/types";
import { logBreedingEvent } from "../../breeding/actions";
import { recordHealth } from "../../health/actions";
import { updateCattle } from "../actions";
import { categoryOptions, statusOptions } from "../options";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.detailMeta") };
}

export default async function CattleDetailPage({ params }: PageProps<"/dashboard/cattle/[id]">) {
  const { id } = await params;
  const { supabase, farm } = await requireFarm();
  const { t, e, f } = await getI18n();

  const [cowRes, milkRes, healthRes, breedingRes] = await Promise.all([
    supabase.from("cattle").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase
      .from("milk_records")
      .select("*")
      .eq("cattle_id", id)
      .gte("record_date", today(-29))
      .order("record_date", { ascending: false }),
    supabase.from("health_records").select("*").eq("cattle_id", id).order("record_date", { ascending: false }),
    supabase.from("breeding_events").select("*").eq("cattle_id", id).order("event_date", { ascending: false }),
  ]);

  const cow = cowRes.data as Cattle | null;
  if (!cow) notFound();
  const milk = (milkRes.data ?? []) as MilkRecord[];
  const health = (healthRes.data ?? []) as HealthRecord[];
  const breeding = (breedingRes.data ?? []) as BreedingEvent[];

  const milkTotal = milk.reduce((s, m) => s + Number(m.quantity_liters), 0);
  const milkDays = new Set(milk.map((m) => m.record_date)).size;
  const withdrawal = health.find((h) => h.withdrawal_until && h.withdrawal_until >= today());
  const repro = reproStatus(breeding, today());
  const dues = dueItems(health, today(), 60);

  const months = ageInMonths(cow.date_of_birth);
  const ageText =
    months === null
      ? t("age.unknown")
      : months < 1
        ? t("age.lessThanMonth")
        : months < 24
          ? t("age.months", { n: months })
          : t("age.yearsMonths", { y: Math.floor(months / 12), m: months % 12 });

  const stateKey = `breeding.state.${repro.state}` as "breeding.state.open";

  return (
    <>
      <PageHeader
        title={`${cow.tag_number}${cow.name ? ` · ${cow.name}` : ""}`}
        description={[e(cow.category), cow.breed, ageText].filter(Boolean).join(" · ")}
        action={
          <Link href="/dashboard/cattle" className="text-sm text-stone-500 hover:text-stone-900">
            {t("cattle.allCattle")}
          </Link>
        }
      />

      {withdrawal && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("cattle.withdrawal", {
            date: f.date(withdrawal.withdrawal_until),
            what: withdrawal.medicine ?? withdrawal.description,
          })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("cattle.milk30")} value={t("common.litersShort", { n: f.number(milkTotal, 1) })} />
        <StatCard
          label={t("cattle.avgPerDay")}
          value={t("common.litersShort", { n: f.number(milkDays ? milkTotal / milkDays : 0, 1) })}
          hint={t("cattle.daysRecorded", { n: milkDays })}
        />
        <StatCard label={t("cattle.expectedCalving")} value={f.date(repro.expectedCalving)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("cattle.healthRecords")}>
          {dues.length > 0 && (
            <ul className="mb-4 grid gap-1.5">
              {dues.map((d) => (
                <li key={d.record.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                  <span>{d.record.product ?? d.record.description}</span>
                  <Badge tone={d.overdue ? "red" : d.daysUntilDue <= 7 ? "amber" : "default"}>{dueLabel(t, d.daysUntilDue)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {health.length === 0 ? (
            <EmptyState title={t("cattle.noHealth")} />
          ) : (
            <Table head={[t("cattle.colDate"), t("cattle.colWhat"), t("cattle.colNextDue"), t("cattle.colCost")]}>
              {health.map((h) => (
                <tr key={h.id}>
                  <Td>{f.date(h.record_date)}</Td>
                  <Td>
                    <Badge tone={h.record_type === "vaccination" ? "blue" : h.record_type === "treatment" || h.record_type === "checkup" ? "default" : "amber"}>
                      {e(h.record_type)}
                    </Badge>
                    <span className="mt-0.5 block">{h.product ?? h.description}</span>
                  </Td>
                  <Td>{f.date(h.next_due_date)}</Td>
                  <Td>{h.cost != null ? f.money(h.cost, farm.currency) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
          <details className="mt-4 border-t border-stone-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-emerald-700">{t("cattle.recordHealth")}</summary>
            <div className="mt-4">
              <HealthForm action={recordHealth} today={today()} currency={farm.currency} cattleId={cow.id} />
            </div>
          </details>
        </Card>

        <Card title={t("cattle.breeding")}>
          {cow.sex === "female" && (
            <p className="mb-4 text-sm text-stone-600">
              <Badge tone={repro.state === "pregnant" ? "green" : repro.state === "inseminated" ? "blue" : "default"}>
                {t(stateKey)}
              </Badge>{" "}
              {repro.state === "open" && repro.nextHeatExpected && (
                <>{t("cattle.nextHeatAround", { date: f.date(repro.nextHeatExpected) })}</>
              )}
              {repro.state === "inseminated" && <>{t("cattle.checkDue", { date: f.date(repro.pregnancyCheckDue) })}</>}
              {repro.state === "pregnant" && (
                <>{t("cattle.calvingDry", { date: f.date(repro.expectedCalving), date2: f.date(repro.dryOffDue) })}</>
              )}
            </p>
          )}
          {breeding.length === 0 ? (
            <EmptyState title={t("cattle.noBreeding")} />
          ) : (
            <Table head={[t("cattle.colDate"), t("cattle.colEvent"), t("cattle.colDetails")]}>
              {breeding.map((b) => (
                <tr key={b.id}>
                  <Td>{f.date(b.event_date)}</Td>
                  <Td>{e(b.event_type)}</Td>
                  <Td className="text-xs">
                    {[
                      b.bull_or_semen,
                      b.technician && t("breeding.by", { name: b.technician }),
                      b.event_type === "pregnancy_check" && b.result ? e(b.result) : null,
                      heatSignsText(t, b.heat_signs),
                      b.expected_calving_date && t("breeding.calvingOn", { date: f.date(b.expected_calving_date) }),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
          {cow.sex === "female" && (
            <details className="mt-4 border-t border-stone-100 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-emerald-700">{t("cattle.recordBreeding")}</summary>
              <div className="mt-4">
                <BreedingForm action={logBreedingEvent} today={today()} currency={farm.currency} cattleId={cow.id} />
              </div>
            </details>
          )}
        </Card>

        <Card title={t("cattle.milkTitle")}>
          {milk.length === 0 ? (
            <EmptyState title={t("cattle.noMilk")}>
              <Link href="/dashboard/milk" className="text-emerald-700 hover:underline">{t("overview.recordMilk")}</Link>
            </EmptyState>
          ) : (
            <Table head={[t("cattle.colDate"), t("cattle.colSession"), t("cattle.colLitres"), t("cattle.colFat")]}>
              {milk.map((m) => (
                <tr key={m.id}>
                  <Td>{f.date(m.record_date)}</Td>
                  <Td>{e(m.session)}</Td>
                  <Td className="tabular-nums">{f.number(Number(m.quantity_liters), 2)}</Td>
                  <Td>{m.fat_percent != null ? f.number(Number(m.fat_percent), 2) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={t("cattle.detailsTitle")}>
          <ActionForm action={updateCattle} submitLabel={t("cattle.saveChanges")} submitVariant="secondary">
            <input type="hidden" name="id" value={cow.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.name")}>
                <Input name="name" defaultValue={cow.name ?? ""} />
              </Field>
              <Field label={t("common.breed")}>
                <Input name="breed" defaultValue={cow.breed ?? ""} />
              </Field>
              <Field label={t("common.category")}>
                <Select name="category" defaultValue={cow.category} options={categoryOptions(e)} />
              </Field>
              <Field label={t("common.status")}>
                <Select name="status" defaultValue={cow.status} options={statusOptions(e)} />
              </Field>
            </div>
            <Field label={t("cattle.dob")}>
              <Input name="date_of_birth" type="date" defaultValue={cow.date_of_birth ?? ""} />
            </Field>
            <Field label={t("common.notes")}>
              <Textarea name="notes" defaultValue={cow.notes ?? ""} />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
