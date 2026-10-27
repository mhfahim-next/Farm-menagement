import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { redirect } from "next/navigation";
import { requireFarm } from "@/lib/auth";
import { loadBreedingBoard } from "@/lib/breeding-data";
import { milkingCategories } from "@/lib/cattle";
import { monthStart, today } from "@/lib/format";
import { dueItems, dueLabel } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import type { FlockStats, HealthRecord } from "@/lib/types";
import { breedsAnimals, fattens, keepsAnimals, keepsCattle, keepsPoultry } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("overview.meta") };
}

export default async function OverviewPage() {
  const [{ supabase, farm, role }, { t, f, o, rows }] = await Promise.all([requireFarm(), getI18n()]);
  if (role === "vet") redirect("/dashboard/health");
  const day = today();
  const weekAgo = today(-6);

  // Everything on the page in one round trip: money to collect, stock running low, herd, flocks, money, reminders.
  const [{ data: owingRows }, { data: stockRows }, cattleRes, milkRes, flocksRes, statsRes, eggsRes, txnRes, scheduleRes, board] = await Promise.all([
    supabase.from("buyer_balances").select("id, name, due").eq("farm_id", farm.id).gt("due", 0).order("due", { ascending: false }),
    supabase.from("inventory_stock").select("id, name, unit, on_hand, low_stock").eq("farm_id", farm.id).eq("archived", false).not("low_stock", "is", null),
    keepsAnimals(farm)
      ? supabase
          .from("cattle")
          .select("id, tag_number, name, category, species, is_fattening", { count: "exact" })
          .eq("farm_id", farm.id)
          .eq("status", "active")
          .is("deleted_at", null)
      : null,
    farm.has_dairy
      ? supabase
          .from("milk_records")
          .select("record_date, quantity_liters")
          .eq("farm_id", farm.id)
          .gte("record_date", weekAgo)
      : null,
    keepsPoultry(farm)
      ? supabase
          .from("flocks")
          .select("id, kind")
          .eq("farm_id", farm.id)
          .eq("status", "active")
          .is("deleted_at", null)
      : null,
    keepsPoultry(farm)
      ? supabase.from("flock_stats").select("*").eq("farm_id", farm.id)
      : null,
    farm.has_layer
      ? supabase
          .from("flock_daily_logs")
          .select("log_date, eggs_collected")
          .eq("farm_id", farm.id)
          .gte("log_date", weekAgo)
      : null,
    supabase
      .from("finance_ledger")
      .select("txn_type, amount")
      .eq("farm_id", farm.id)
      .gte("txn_date", monthStart()),
    keepsAnimals(farm)
      ? supabase
          .from("health_records")
          .select("*")
          .eq("farm_id", farm.id)
          .not("next_due_date", "is", null)
      : null,
    breedsAnimals(farm) ? loadBreedingBoard({ supabase, farm }) : null,
  ]);
  const owing = (owingRows ?? []) as { id: string; name: string; due: number }[];
  const dueTotal = owing.reduce((s, b) => s + Number(b.due), 0);
  const lowStock = ((stockRows ?? []) as { id: string; name: string; unit: string; on_hand: number; low_stock: number }[]).filter(
    (i) => Number(i.on_hand) <= Number(i.low_stock),
  );

  const animals = cattleRes?.data ?? [];
  const cattle = animals.filter((c) => (c.species ?? "cattle") === "cattle");
  const smallCount = animals.length - cattle.length;
  const fatteningCount = animals.filter((c) => c.is_fattening).length;
  const milkingTypes = milkingCategories(rows);
  const milkingCows = cattle.filter((c) => milkingTypes.includes(c.category)).length;
  const milk = milkRes?.data ?? [];
  const activeFlocks = (flocksRes?.data ?? []) as { id: string; kind: string | null }[];
  const activeFlockIds = new Set(activeFlocks.filter((fl) => (fl.kind ?? "layer") === "layer").map((fl) => fl.id));
  const meatIds = new Set(activeFlocks.filter((fl) => fl.kind && fl.kind !== "layer").map((fl) => fl.id));
  const flockStats = (statsRes?.data ?? []) as FlockStats[];
  const birds = flockStats.filter((s) => activeFlockIds.has(s.flock_id)).reduce((sum, s) => sum + s.current_count, 0);
  const meatBirds = flockStats.filter((s) => meatIds.has(s.flock_id)).reduce((sum, s) => sum + s.current_count, 0);
  const eggs = eggsRes?.data ?? [];
  const txns = txnRes.data ?? [];

  const milkToday = milk
    .filter((m) => m.record_date === day)
    .reduce((s, m) => s + Number(m.quantity_liters), 0);
  const eggsToday = eggs
    .filter((x) => x.log_date === day)
    .reduce((s, x) => s + x.eggs_collected, 0);
  const income = txns.filter((x) => x.txn_type === "income").reduce((s, x) => s + Number(x.amount), 0);
  const expense = txns.filter((x) => x.txn_type === "expense").reduce((s, x) => s + Number(x.amount), 0);

  // Reminders: health schedules + breeding alerts, most urgent first.
  const animalName = new Map(
    animals.map((c) => [c.id, `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`]),
  );
  // Only active animals — sold or dead ones shouldn't raise reminders.
  const healthDue = dueItems((scheduleRes?.data ?? []) as HealthRecord[], day, 14).filter((d) =>
    animalName.has(d.record.cattle_id),
  );
  const reminders = [
    ...healthDue.map((d) => ({
      key: `h-${d.record.id}`,
      cattleId: d.record.cattle_id,
      title: `${d.record.product ?? d.record.description} (${o("health_type", d.record.record_type)})`,
      status: dueLabel(t, d.daysUntilDue),
      days: d.daysUntilDue,
      tone: d.overdue ? ("red" as const) : ("amber" as const),
    })),
    ...(board?.cows ?? []).flatMap((c) =>
      c.alerts.map((a) => ({
        key: `b-${c.id}-${a.kind}`,
        cattleId: c.id,
        title: t(a.kind === "service_overdue" ? "breeding.alert.service_overdue_long" : `breeding.alert.${a.kind}`),
        status: a.date ? dueLabel(t, a.daysUntil) : t("overview.review"),
        days: a.date ? a.daysUntil : 0,
        tone: a.kind === "service_overdue" || a.daysUntil < 0 ? ("red" as const) : ("blue" as const),
      })),
    ),
  ].sort((a, b) => a.days - b.days);

  const days = Array.from({ length: 7 }, (_, i) => today(i - 6));
  const milkByDay = days.map((d) => ({
    day: d,
    value: milk.filter((m) => m.record_date === d).reduce((s, m) => s + Number(m.quantity_liters), 0),
  }));
  const eggsByDay = days.map((d) => ({
    day: d,
    value: eggs.filter((x) => x.log_date === d).reduce((s, x) => s + x.eggs_collected, 0),
  }));

  return (
    <>
      <PageHeader title={t("overview.meta")} description={t("overview.today", { farm: farm.name })} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {keepsCattle(farm) && (
          <StatCard
            label={t("overview.activeCattle")}
            value={f.number(cattle.length)}
            hint={farm.has_dairy ? t("overview.cows", { n: milkingCows }) : undefined}
          />
        )}
        {farm.has_dairy && <StatCard label={t("overview.milkToday")} value={t("common.litersShort", { n: f.number(milkToday, 1) })} />}
        {farm.has_goat && <StatCard label={t("nav.goats")} value={f.number(smallCount)} />}
        {fattens(farm) && (
          <Link href="/dashboard/fattening" className="contents">
            <StatCard label={t("fatten.onFeed")} value={f.number(fatteningCount)} />
          </Link>
        )}
        {farm.has_broiler && (
          <Link href="/dashboard/broilers" className="contents">
            <StatCard label={t("broiler.liveBirds")} value={f.number(meatBirds)} hint={t("broiler.runningCount", { n: f.number(meatIds.size) })} />
          </Link>
        )}
        {farm.has_layer && (
          <>
            <StatCard
              label={t("overview.liveBirds")}
              value={f.number(birds)}
              hint={t("overview.activeFlocks", { n: activeFlockIds.size })}
            />
            <StatCard
              label={t("overview.eggsToday")}
              value={f.number(eggsToday)}
              hint={birds > 0 ? t("overview.henDay", { pct: f.number((eggsToday / birds) * 100, 1) }) : undefined}
            />
          </>
        )}
        <StatCard label={t("overview.incomeMonth")} value={f.money(income, farm.currency)} tone="good" />
        <StatCard label={t("overview.expensesMonth")} value={f.money(expense, farm.currency)} tone="bad" />
        <StatCard
          label={t("overview.profitMonth")}
          value={f.money(income - expense, farm.currency)}
          tone={income - expense >= 0 ? "good" : "bad"}
        />
      </div>

      {(owing.length > 0 || lowStock.length > 0) && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {owing.length > 0 && (
            <Card
              title={t("overview.duesTitle", { amount: f.money(dueTotal, farm.currency) })}
              description={t("overview.duesDesc")}
              action={<ButtonLink href="/dashboard/sales" variant="secondary">{t("nav.sales")}</ButtonLink>}
            >
              <ul className="divide-y divide-stone-100 text-sm">
                {owing.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/dashboard/sales/buyers/${b.id}`} className="font-medium text-emerald-700 hover:underline">{b.name}</Link>
                    <span className="tabular-nums text-amber-800">{f.money(Number(b.due), farm.currency)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {lowStock.length > 0 && (
            <Card
              title={t("overview.lowStockTitle")}
              description={t("overview.lowStockDesc")}
              action={<ButtonLink href="/dashboard/inventory" variant="secondary">{t("nav.inventory")}</ButtonLink>}
            >
              <ul className="divide-y divide-stone-100 text-sm">
                {lowStock.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/dashboard/inventory/${i.id}`} className="font-medium text-emerald-700 hover:underline">{i.name}</Link>
                    <span className="tabular-nums text-red-700">
                      {f.number(Number(i.on_hand), 2)} {t(`stock.unit.${i.unit as "kg"}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {keepsAnimals(farm) && (
        <Card
          className="mt-6"
          title={t("overview.attentionTitle")}
          description={t("overview.attentionDesc")}
          action={
            <div className="flex gap-2">
              <ButtonLink href="/dashboard/health" variant="secondary">{t("nav.health")}</ButtonLink>
              {breedsAnimals(farm) && <ButtonLink href="/dashboard/breeding" variant="secondary">{t("nav.breeding")}</ButtonLink>}
            </div>
          }
        >
          {reminders.length === 0 ? (
            <p className="text-sm text-stone-500">{t("overview.allCaughtUp")}</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {reminders.slice(0, 8).map((r) => (
                <li key={r.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <Link href={`/dashboard/cattle/${r.cattleId}`} className="font-medium text-emerald-700 hover:underline">
                      {animalName.get(r.cattleId) ?? t("overview.animal")}
                    </Link>{" "}
                    <span className="text-stone-600">— {r.title}</span>
                  </span>
                  <Badge tone={r.tone}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          {reminders.length > 8 && (
            <p className="mt-2 text-xs text-stone-500">{t("overview.more", { n: reminders.length - 8 })}</p>
          )}
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {farm.has_dairy && (
          <Card
            title={t("overview.milk7")}
            action={<ButtonLink href="/dashboard/milk" variant="secondary">{t("overview.recordMilk")}</ButtonLink>}
          >
            <MiniBars data={milkByDay} format={(v) => f.number(v, 0)} weekday={f.weekday} />
          </Card>
        )}
        {farm.has_layer && (
          <Card
            title={t("overview.eggs7")}
            action={<ButtonLink href="/dashboard/flocks" variant="secondary">{t("overview.logEggs")}</ButtonLink>}
          >
            <MiniBars data={eggsByDay} format={(v) => f.number(v, 0)} weekday={f.weekday} />
          </Card>
        )}
      </div>

      {keepsCattle(farm) && cattle.length === 0 && (
        <div className="mt-6">
          <EmptyState title={t("overview.startTitle")}>
            <Link href="/dashboard/cattle" className="text-emerald-700 hover:underline">
              {t("overview.addFirstCow")}
            </Link>{" "}
            {farm.has_layer && (
              <>
                {t("overview.or")}{" "}
                <Link href="/dashboard/flocks" className="text-emerald-700 hover:underline">
                  {t("overview.addFlock")}
                </Link>
              </>
            )}
          </EmptyState>
        </div>
      )}
    </>
  );
}

function MiniBars({
  data,
  format,
  weekday,
}: {
  data: { day: string; value: number }[];
  format: (v: number) => string;
  weekday: (day: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => (
        <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-1">
          <span className="text-xs tabular-nums text-stone-500">{d.value ? format(d.value) : ""}</span>
          <div className="relative w-full flex-1">
            <div
              className="absolute inset-x-0 bottom-0 rounded-t bg-emerald-600"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
              title={`${d.day}: ${d.value}`}
            />
          </div>
          <span className="text-xs text-stone-500">{weekday(d.day)}</span>
        </div>
      ))}
    </div>
  );
}
