import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { formatDate, formatNumber, label, today } from "@/lib/format";
import type { Flock, FlockStats } from "@/lib/types";
import { addFlock } from "./actions";
import { flockAgeWeeks } from "./utils";

export const metadata: Metadata = { title: "Layer flocks" };

export default async function FlocksPage() {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_layer) notFound();

  const [flocksRes, statsRes, todayRes] = await Promise.all([
    supabase
      .from("flocks")
      .select("*")
      .eq("farm_id", farm.id)
      .is("deleted_at", null)
      .order("status")
      .order("placed_date", { ascending: false }),
    supabase.from("flock_stats").select("*").eq("farm_id", farm.id),
    supabase.from("flock_daily_logs").select("flock_id, eggs_collected").eq("farm_id", farm.id).eq("log_date", today()),
  ]);

  const flocks = (flocksRes.data ?? []) as Flock[];
  const stats = new Map(((statsRes.data ?? []) as FlockStats[]).map((s) => [s.flock_id, s]));
  const eggsToday = new Map((todayRes.data ?? []).map((l) => [l.flock_id, l.eggs_collected]));

  return (
    <>
      <PageHeader title="Layer flocks" description="Each batch of hens is tracked as one flock." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {flocks.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="No flocks yet">Add your first batch with the form.</EmptyState>
            </div>
          )}
          {flocks.map((f) => {
            const s = stats.get(f.id);
            const live = s?.current_count ?? f.initial_count;
            const eggs = eggsToday.get(f.id);
            return (
              <Link
                key={f.id}
                href={`/dashboard/flocks/${f.id}`}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="text-sm text-stone-500">
                      {[f.breed, f.shed && `Shed ${f.shed}`].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Badge tone={f.status === "active" ? "green" : "default"}>{label(f.status)}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-stone-500">Birds</dt>
                    <dd className="font-semibold tabular-nums">{formatNumber(live)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Age</dt>
                    <dd className="font-semibold">{flockAgeWeeks(f)} wk</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Eggs today</dt>
                    <dd className="font-semibold tabular-nums">
                      {eggs != null ? (
                        <>
                          {formatNumber(eggs)}{" "}
                          <span className="font-normal text-stone-500">
                            ({live ? formatNumber((eggs / live) * 100, 0) : 0}%)
                          </span>
                        </>
                      ) : (
                        <span className="font-normal text-amber-700">Not logged</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-stone-500">Placed {formatDate(f.placed_date)}</p>
              </Link>
            );
          })}
        </div>

        <Card title="Add flock">
          <ActionForm action={addFlock} submitLabel="Add flock">
            <Field label="Flock name">
              <Input name="name" placeholder="e.g. Batch 2026-A" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Breed">
                <Input name="breed" placeholder="e.g. ISA Brown" />
              </Field>
              <Field label="Shed">
                <Input name="shed" />
              </Field>
              <Field label="Birds placed">
                <Input name="initial_count" type="number" min="1" required />
              </Field>
              <Field label="Age at placement (wk)">
                <Input name="age_at_placement_weeks" type="number" min="0" defaultValue="0" />
              </Field>
            </div>
            <Field label="Placed on">
              <Input name="placed_date" type="date" defaultValue={today()} required />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
