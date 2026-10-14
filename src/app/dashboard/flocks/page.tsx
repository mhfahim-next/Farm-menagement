import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { requireFarm } from "@/lib/auth";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Flock, FlockStats } from "@/lib/types";
import { addFlock } from "./actions";
import { flockAgeWeeks } from "./utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("flocks.meta") };
}

export default async function FlocksPage() {
  const { supabase, farm } = await requireFarm();
  if (!farm.has_layer) notFound();
  const { t, f, o } = await getI18n();

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
      <PageHeader title={t("flocks.title")} description={t("flocks.desc")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {flocks.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title={t("flocks.emptyTitle")}>{t("flocks.emptyBody")}</EmptyState>
            </div>
          )}
          {flocks.map((fl) => {
            const s = stats.get(fl.id);
            const live = s?.current_count ?? fl.initial_count;
            const eggs = eggsToday.get(fl.id);
            return (
              <Link
                key={fl.id}
                href={`/dashboard/flocks/${fl.id}`}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{fl.name}</h3>
                    <p className="text-sm text-stone-500">
                      {[fl.breed, fl.shed && t("flocks.shed", { s: fl.shed })].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Badge tone={fl.status === "active" ? "green" : "default"}>{o("flock_status", fl.status)}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-stone-500">{t("flocks.birds")}</dt>
                    <dd className="font-semibold tabular-nums">{f.number(live)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">{t("flocks.age")}</dt>
                    <dd className="font-semibold">{t("flocks.weeksShort", { n: flockAgeWeeks(fl) })}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">{t("flocks.eggsToday")}</dt>
                    <dd className="font-semibold tabular-nums">
                      {eggs != null ? (
                        <>
                          {f.number(eggs)}{" "}
                          <span className="font-normal text-stone-500">
                            ({live ? f.number((eggs / live) * 100, 0) : f.number(0)}%)
                          </span>
                        </>
                      ) : (
                        <span className="font-normal text-amber-700">{t("flocks.notLogged")}</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-stone-500">{t("flocks.placed", { date: f.date(fl.placed_date) })}</p>
              </Link>
            );
          })}
        </div>

        <Card title={t("flocks.addTitle")}>
          <ActionForm action={addFlock} submitLabel={t("flocks.addSubmit")}>
            <Field label={t("flocks.flockName")}>
              <Input name="name" placeholder={t("flocks.flockNamePlaceholder")} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("common.breed")}>
                <Input name="breed" placeholder={t("flocks.breedPlaceholder")} />
              </Field>
              <Field label={t("flocks.shedLabel")}>
                <Input name="shed" />
              </Field>
              <Field label={t("flocks.birdsPlaced")}>
                <Input name="initial_count" type="number" min="1" required />
              </Field>
              <Field label={t("flocks.ageAtPlacement")}>
                <Input name="age_at_placement_weeks" type="number" min="0" defaultValue="0" />
              </Field>
            </div>
            <Field label={t("flocks.placedOn")}>
              <Input name="placed_date" type="date" defaultValue={today()} required />
            </Field>
            <Field label={t("common.notes")}>
              <Textarea name="notes" rows={2} />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
