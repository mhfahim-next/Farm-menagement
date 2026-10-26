import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireRole, STAFF } from "@/lib/auth";
import { loadBatchStats } from "@/lib/broiler-data";
import { getI18n } from "@/lib/i18n/server";
import type { Flock } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("broiler.title") };
}

export default async function BroilersPage() {
  const { supabase, farm } = await requireRole(STAFF);
  if (!farm.has_broiler) notFound();
  const { t, f, o } = await getI18n();

  const { data } = await supabase
    .from("flocks")
    .select("*")
    .eq("farm_id", farm.id)
    .neq("kind", "layer")
    .is("deleted_at", null)
    .order("status")
    .order("placed_date", { ascending: false });
  const batches = (data ?? []) as Flock[];
  const stats = await loadBatchStats(supabase, farm.id, batches);
  const active = batches.filter((b) => b.status === "active");
  const liveNow = active.reduce((s, b) => s + (stats.get(b.id)?.stats.live ?? 0), 0);
  const closed = batches.filter((b) => b.status !== "active");
  const money = (n: number) => f.money(n, farm.currency);

  return (
    <>
      <PageHeader
        title={t("broiler.title")}
        description={t("broiler.desc")}
        action={<ButtonLink href="/dashboard/flocks/new?kind=broiler">+ {t("broiler.addTitle")}</ButtonLink>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("broiler.activeBatches")} value={f.number(active.length)} />
        <StatCard label={t("broiler.liveBirds")} value={f.number(liveNow)} />
        <StatCard
          label={t("broiler.closedProfit")}
          value={closed.length ? money(closed.reduce((s, b) => s + (stats.get(b.id)?.stats.profit ?? 0), 0)) : "—"}
          hint={t("broiler.closedCount", { n: f.number(closed.length) })}
        />
      </div>

      {batches.length === 0 ? (
        <EmptyState title={t("broiler.emptyTitle")}>{t("broiler.emptyBody")}</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {batches.map((b) => {
            const s = stats.get(b.id)?.stats;
            return (
              <Link
                key={b.id}
                href={`/dashboard/flocks/${b.id}`}
                data-testid="batch-card"
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    <p className="text-sm text-stone-500">
                      {[t(`broiler.kind.${b.kind === "sonali" ? "sonali" : "broiler"}`), b.breed ? o("flock_breed", b.breed) : null, b.shed && t("flocks.shed", { s: b.shed })]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge tone={b.status === "active" ? "green" : "default"}>{o("flock_status", b.status)}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <dt className="text-stone-500">{t("broiler.day")}</dt>
                    <dd className="font-semibold tabular-nums">{f.number(s?.ageDays ?? 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">{t("flocks.birds")}</dt>
                    <dd className="font-semibold tabular-nums">{f.number(s?.live ?? b.initial_count)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">{t("broiler.weight")}</dt>
                    <dd className="font-semibold tabular-nums">{s?.latestWeightG ? t("broiler.grams", { n: f.number(s.latestWeightG) }) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">FCR</dt>
                    <dd className="font-semibold tabular-nums">{s?.fcr ? f.number(s.fcr, 2) : "—"}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-stone-500">
                  {t("broiler.mortalityShort", { n: f.number(s?.mortalityPct ?? 0, 1) })} · {t("flocks.placed", { date: f.date(b.placed_date) })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
