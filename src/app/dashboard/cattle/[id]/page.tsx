import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea } from "@/components/ui";
import { dueItems, dueLabel } from "@/lib/health";
import { requireFarm } from "@/lib/auth";
import { ageFrom, formatDate, formatMoney, formatNumber, label, today } from "@/lib/format";
import type { BreedingEvent, Cattle, HealthRecord, MilkRecord } from "@/lib/types";
import { BreedingForm } from "@/components/breeding-form";
import { HealthForm } from "@/components/health-form";
import { reproStatus } from "@/lib/breeding";
import { logBreedingEvent } from "../../breeding/actions";
import { recordHealth } from "../../health/actions";
import { updateCattle } from "../actions";
import { categoryOptions, statusOptions } from "../options";

export const metadata: Metadata = { title: "Animal" };

export default async function CattleDetailPage({ params }: PageProps<"/dashboard/cattle/[id]">) {
  const { id } = await params;
  const { supabase, farm } = await requireFarm();

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

  return (
    <>
      <PageHeader
        title={`${cow.tag_number}${cow.name ? ` · ${cow.name}` : ""}`}
        description={[label(cow.category), cow.breed, ageFrom(cow.date_of_birth)].filter(Boolean).join(" · ")}
        action={
          <Link href="/dashboard/cattle" className="text-sm text-stone-500 hover:text-stone-900">
            ← All cattle
          </Link>
        }
      />

      {withdrawal && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠ Milk withdrawal period until <strong>{formatDate(withdrawal.withdrawal_until)}</strong> (
          {withdrawal.medicine ?? withdrawal.description}). Do not sell this animal&apos;s milk.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Milk, last 30 days" value={`${formatNumber(milkTotal, 1)} L`} />
        <StatCard
          label="Average per day"
          value={`${formatNumber(milkDays ? milkTotal / milkDays : 0, 1)} L`}
          hint={`${milkDays} days recorded`}
        />
        <StatCard
          label="Expected calving"
          value={formatDate(repro.expectedCalving)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Health records">
          {dues.length > 0 && (
            <ul className="mb-4 grid gap-1.5">
              {dues.map((d) => (
                <li key={d.record.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                  <span>{d.record.product ?? d.record.description}</span>
                  <Badge tone={d.overdue ? "red" : d.daysUntilDue <= 7 ? "amber" : "default"}>{dueLabel(d.daysUntilDue)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {health.length === 0 ? (
            <EmptyState title="No health records yet" />
          ) : (
            <Table head={["Date", "What", "Next due", "Cost"]}>
              {health.map((h) => (
                <tr key={h.id}>
                  <Td>{formatDate(h.record_date)}</Td>
                  <Td>
                    <Badge tone={h.record_type === "vaccination" ? "blue" : h.record_type === "treatment" || h.record_type === "checkup" ? "default" : "amber"}>
                      {label(h.record_type)}
                    </Badge>
                    <span className="mt-0.5 block">{h.product ?? h.description}</span>
                  </Td>
                  <Td>{formatDate(h.next_due_date)}</Td>
                  <Td>{h.cost != null ? formatMoney(h.cost, farm.currency) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
          <details className="mt-4 border-t border-stone-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-emerald-700">Record vaccine / treatment</summary>
            <div className="mt-4">
              <HealthForm action={recordHealth} today={today()} currency={farm.currency} cattleId={cow.id} />
            </div>
          </details>
        </Card>

        <Card title="Breeding">
          {cow.sex === "female" && (
            <p className="mb-4 text-sm text-stone-600">
              <Badge tone={repro.state === "pregnant" ? "green" : repro.state === "inseminated" ? "blue" : "default"}>
                {repro.state === "pregnant" ? "Pregnant" : repro.state === "inseminated" ? "Inseminated" : "Open"}
              </Badge>{" "}
              {repro.state === "open" && repro.nextHeatExpected && <>Next heat expected around {formatDate(repro.nextHeatExpected)}.</>}
              {repro.state === "inseminated" && <>Pregnancy check due {formatDate(repro.pregnancyCheckDue)}.</>}
              {repro.state === "pregnant" && (
                <>
                  Calving {formatDate(repro.expectedCalving)} · dry off {formatDate(repro.dryOffDue)}.
                </>
              )}
            </p>
          )}
          {breeding.length === 0 ? (
            <EmptyState title="No breeding events yet" />
          ) : (
            <Table head={["Date", "Event", "Details"]}>
              {breeding.map((b) => (
                <tr key={b.id}>
                  <Td>{formatDate(b.event_date)}</Td>
                  <Td>{label(b.event_type)}</Td>
                  <Td className="text-xs">
                    {[
                      b.bull_or_semen,
                      b.technician && `by ${b.technician}`,
                      b.event_type === "pregnancy_check" && b.result ? label(b.result) : null,
                      b.heat_signs,
                      b.expected_calving_date && `calving ${formatDate(b.expected_calving_date)}`,
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
              <summary className="cursor-pointer text-sm font-medium text-emerald-700">Record heat / AI / pregnancy / calving</summary>
              <div className="mt-4">
                <BreedingForm action={logBreedingEvent} today={today()} currency={farm.currency} cattleId={cow.id} />
              </div>
            </details>
          )}
        </Card>

        <Card title="Milk, last 30 days">
          {milk.length === 0 ? (
            <EmptyState title="No milk recorded">
              <Link href="/dashboard/milk" className="text-emerald-700 hover:underline">Record milk</Link>
            </EmptyState>
          ) : (
            <Table head={["Date", "Session", "Litres", "Fat %"]}>
              {milk.map((m) => (
                <tr key={m.id}>
                  <Td>{formatDate(m.record_date)}</Td>
                  <Td>{label(m.session)}</Td>
                  <Td className="tabular-nums">{formatNumber(Number(m.quantity_liters), 2)}</Td>
                  <Td>{m.fat_percent ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Details">
          <ActionForm action={updateCattle} submitLabel="Save changes" submitVariant="secondary">
            <input type="hidden" name="id" value={cow.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input name="name" defaultValue={cow.name ?? ""} />
              </Field>
              <Field label="Breed">
                <Input name="breed" defaultValue={cow.breed ?? ""} />
              </Field>
              <Field label="Category">
                <Select name="category" defaultValue={cow.category} options={categoryOptions} />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={cow.status} options={statusOptions} />
              </Field>
            </div>
            <Field label="Date of birth">
              <Input name="date_of_birth" type="date" defaultValue={cow.date_of_birth ?? ""} />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" defaultValue={cow.notes ?? ""} />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
