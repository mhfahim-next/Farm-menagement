import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { ageFrom, formatDate, formatMoney, formatNumber, label, today } from "@/lib/format";
import type { BreedingEvent, Cattle, HealthRecord, MilkRecord } from "@/lib/types";
import { addBreedingEvent, addHealthRecord, updateCattle } from "../actions";
import { breedingTypeOptions, categoryOptions, healthTypeOptions, statusOptions } from "../options";

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
  const nextCalving = breeding.find((b) => b.expected_calving_date && b.expected_calving_date >= today());

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
          value={nextCalving ? formatDate(nextCalving.expected_calving_date) : "—"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Health records">
          {health.length === 0 ? (
            <EmptyState title="No health records yet" />
          ) : (
            <Table head={["Date", "Type", "Details", "Cost"]}>
              {health.map((h) => (
                <tr key={h.id}>
                  <Td>{formatDate(h.record_date)}</Td>
                  <Td>
                    <Badge tone={h.record_type === "vaccination" ? "blue" : "default"}>{label(h.record_type)}</Badge>
                  </Td>
                  <Td>
                    {h.description}
                    {h.medicine && <span className="block text-xs text-stone-500">{h.medicine}</span>}
                  </Td>
                  <Td>{h.cost != null ? formatMoney(h.cost, farm.currency) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
          <details className="mt-4 border-t border-stone-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-emerald-700">Add health record</summary>
            <ActionForm action={addHealthRecord} className="mt-4 grid gap-3">
              <input type="hidden" name="cattle_id" value={cow.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <Input name="record_date" type="date" defaultValue={today()} required />
                </Field>
                <Field label="Type">
                  <Select name="record_type" options={healthTypeOptions} />
                </Field>
              </div>
              <Field label="What was done">
                <Input name="description" placeholder="e.g. FMD vaccine, mastitis treatment" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Medicine">
                  <Input name="medicine" />
                </Field>
                <Field label="Vet">
                  <Input name="vet_name" />
                </Field>
                <Field label={`Cost (${farm.currency})`}>
                  <Input name="cost" type="number" min="0" step="0.01" />
                </Field>
                <Field label="Milk withdrawal until">
                  <Input name="withdrawal_until" type="date" />
                </Field>
              </div>
            </ActionForm>
          </details>
        </Card>

        <Card title="Breeding">
          {breeding.length === 0 ? (
            <EmptyState title="No breeding events yet" />
          ) : (
            <Table head={["Date", "Event", "Details", "Expected calving"]}>
              {breeding.map((b) => (
                <tr key={b.id}>
                  <Td>{formatDate(b.event_date)}</Td>
                  <Td>{label(b.event_type)}</Td>
                  <Td>{[b.bull_or_semen, b.result].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td>{formatDate(b.expected_calving_date)}</Td>
                </tr>
              ))}
            </Table>
          )}
          <details className="mt-4 border-t border-stone-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-emerald-700">Add breeding event</summary>
            <ActionForm action={addBreedingEvent} className="mt-4 grid gap-3">
              <input type="hidden" name="cattle_id" value={cow.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <Input name="event_date" type="date" defaultValue={today()} required />
                </Field>
                <Field label="Event">
                  <Select name="event_type" options={breedingTypeOptions} />
                </Field>
                <Field label="Bull / semen">
                  <Input name="bull_or_semen" />
                </Field>
                <Field label="Result">
                  <Input name="result" placeholder="e.g. Positive" />
                </Field>
              </div>
              <Field label="Expected calving" hint="Filled automatically (283 days) for inseminations if left empty.">
                <Input name="expected_calving_date" type="date" />
              </Field>
            </ActionForm>
          </details>
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
