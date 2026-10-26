import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ClickRow } from "@/components/click-row";
import { Badge, ButtonLink, Card, EmptyState, Field, Input, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireRole, STAFF } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { loadFattening } from "@/lib/fattening-data";
import { today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { fattens, keepsCattle } from "@/lib/modules";
import { saveFatteningSettings, startFattening } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("fatten.title") };
}

export default async function FatteningPage() {
  const { supabase, farm, role } = await requireRole(STAFF);
  if (!fattens(farm)) notFound();
  const { t, f, o } = await getI18n();
  const canSet = MANAGERS.includes(role);
  const { settings, rows } = await loadFattening(supabase, farm.id);
  const money = (n: number) => f.money(n, farm.currency);
  const kg = (n: number | null, d = 1) => (n === null ? "—" : t("weight.kgShort", { n: f.number(n, d) }));

  const active = rows.filter((r) => r.animal.status === "active");
  const sold = rows.filter((r) => r.stats.saleAmount !== null);
  const days = settings.targetDate ? Math.round((Date.parse(settings.targetDate) - Date.parse(today())) / 86_400_000) : null;
  const total = (pick: (r: (typeof rows)[number]) => number | null) => active.reduce((s, r) => s + (pick(r) ?? 0), 0);
  const anyPrice = settings.pricePerKg.cattle > 0 || settings.pricePerKg.small > 0;

  // Animals that could be put on fattening: active, not already on it.
  const { data: candidates } = await supabase
    .from("cattle")
    .select("id, tag_number, name, category, species")
    .eq("farm_id", farm.id)
    .eq("status", "active")
    .eq("is_fattening", false)
    .in("species", [...(keepsCattle(farm) ? ["cattle"] : []), ...(farm.has_goat ? ["goat", "sheep"] : [])])
    .is("deleted_at", null)
    .order("tag_number")
    .limit(300);

  return (
    <>
      <PageHeader
        title={t("fatten.title")}
        description={t("fatten.desc")}
        action={
          <div className="flex flex-wrap gap-2">
            {keepsCattle(farm) && <ButtonLink href="/dashboard/cattle/new?fattening=1">+ {t("fatten.buyCattle")}</ButtonLink>}
            {farm.has_goat && (
              <ButtonLink href="/dashboard/cattle/new?species=goat&fattening=1" variant={keepsCattle(farm) ? "secondary" : "primary"}>
                + {t("fatten.buyGoat")}
              </ButtonLink>
            )}
          </div>
        }
      />

      {settings.targetDate && days !== null && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-emerald-50 px-5 py-4" data-testid="countdown">
          <div>
            <p className="text-sm font-medium text-amber-900">
              {settings.raw.target_date ? t("fatten.saleDay") : t("fatten.qurbani")} · {f.date(settings.targetDate)}
            </p>
            <p className="text-2xl font-extrabold text-stone-900">
              {days > 0 ? t("fatten.daysLeft", { n: f.number(days) }) : days === 0 ? t("fatten.today") : t("fatten.passed")}
            </p>
          </div>
          {!settings.raw.target_date && <p className="max-w-sm text-xs text-stone-600">{t("fatten.qurbaniNote")}</p>}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("fatten.onFeed")} value={f.number(active.length)} />
        <StatCard label={t("fatten.liveNow")} value={kg(total((r) => r.stats.currentKg), 0)} />
        <StatCard label={t("fatten.projectedValue")} value={anyPrice ? money(total((r) => r.stats.estValue)) : "—"} hint={anyPrice ? undefined : t("fatten.setPrice")} />
        <StatCard
          label={t("fatten.estProfit")}
          value={anyPrice ? money(total((r) => r.stats.estProfit)) : "—"}
          tone={anyPrice ? (total((r) => r.stats.estProfit) >= 0 ? "good" : "bad") : "default"}
          hint={t("fatten.costSoFar", { amount: money(total((r) => r.stats.costSoFar)) })}
        />
      </div>

      <Card title={t("fatten.listTitle")} description={t("fatten.listDesc")}>
        {active.length === 0 ? (
          <EmptyState title={t("fatten.emptyTitle")}>{t("fatten.emptyBody")}</EmptyState>
        ) : (
          <Table
            head={[
              t("cattle.colTag"),
              t("fatten.colDays"),
              t("fatten.colWeight"),
              t("fatten.colAdg"),
              t("fatten.colProjected"),
              t("fatten.colCost"),
              t("fatten.colBreakEven"),
              t("fatten.colProfit"),
            ]}
          >
            {active.map(({ animal: a, stats: s }) => (
              <ClickRow key={a.id} href={`/dashboard/cattle/${a.id}`}>
                <Td>
                  <Link href={`/dashboard/cattle/${a.id}`} className="font-medium text-emerald-700 hover:underline">
                    {animalLabel(a)}
                  </Link>
                  <span className="block text-xs text-stone-500">{o("cattle_category", a.category)}</span>
                </Td>
                <Td className="tabular-nums">{f.number(s.daysOnFeed)}</Td>
                <Td className="tabular-nums">
                  {s.startKg !== null && s.currentKg !== null && s.startKg !== s.currentKg ? `${f.number(s.startKg, 0)} → ${kg(s.currentKg, 0)}` : kg(s.currentKg, 0)}
                </Td>
                <Td className={`tabular-nums ${s.adg !== null && s.adg < 0 ? "text-red-600" : ""}`}>{s.adg !== null ? t("fatten.adgValue", { n: f.number(s.adg, 2) }) : "—"}</Td>
                <Td className="tabular-nums">{kg(s.projectedKg, 0)}</Td>
                <Td className="tabular-nums">{money(s.costAtTarget)}</Td>
                <Td className="tabular-nums">{s.breakEvenPerKg !== null ? t("fatten.perKg", { amount: money(s.breakEvenPerKg) }) : "—"}</Td>
                <Td className={`tabular-nums font-semibold ${s.estProfit === null ? "" : s.estProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {s.estProfit !== null ? money(s.estProfit) : "—"}
                </Td>
              </ClickRow>
            ))}
          </Table>
        )}
        <p className="mt-3 text-xs text-stone-500">{t("fatten.howNote")}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("fatten.settingsTitle")} description={t("fatten.settingsDesc")}>
          <ActionForm action={saveFatteningSettings} submitLabel={t("fatten.saveSettings")} submitVariant="secondary">
            <fieldset disabled={!canSet} className="grid gap-3 disabled:opacity-70">
              <Field label={t("fatten.targetDate")} hint={settings.qurbaniDate ? t("fatten.targetDateHint", { date: f.date(settings.qurbaniDate) }) : undefined}>
                <Input name="target_date" type="date" defaultValue={settings.raw.target_date ?? ""} data-testid="target-date" />
              </Field>
              {keepsCattle(farm) && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("fatten.dailyCostCattle", { cur: farm.currency })}>
                    <Input name="daily_cost_cattle" type="number" min="0" step="1" inputMode="decimal" defaultValue={settings.raw.daily_cost_cattle ?? ""} data-testid="daily-cattle" />
                  </Field>
                  <Field label={t("fatten.priceKgCattle", { cur: farm.currency })}>
                    <Input name="price_kg_cattle" type="number" min="0" step="1" inputMode="decimal" defaultValue={settings.raw.price_kg_cattle ?? ""} data-testid="price-cattle" />
                  </Field>
                </div>
              )}
              {farm.has_goat && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("fatten.dailyCostGoat", { cur: farm.currency })}>
                    <Input name="daily_cost_goat" type="number" min="0" step="1" inputMode="decimal" defaultValue={settings.raw.daily_cost_goat ?? ""} />
                  </Field>
                  <Field label={t("fatten.priceKgGoat", { cur: farm.currency })}>
                    <Input name="price_kg_goat" type="number" min="0" step="1" inputMode="decimal" defaultValue={settings.raw.price_kg_goat ?? ""} />
                  </Field>
                </div>
              )}
              <p className="text-xs text-stone-500">{t("fatten.settingsHint")}</p>
            </fieldset>
          </ActionForm>
        </Card>

        <Card title={t("fatten.addExisting")} description={t("fatten.addExistingDesc")}>
          {(candidates ?? []).length === 0 ? (
            <p className="text-sm text-stone-500">{t("fatten.noCandidates")}</p>
          ) : (
            <ActionForm action={startFattening} submitLabel={t("fatten.startSelected")} submitVariant="secondary">
              <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-stone-200 p-2" data-testid="candidates">
                {(candidates ?? []).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-50">
                    <input type="checkbox" name="ids" value={c.id} className="accent-emerald-700" />
                    {animalLabel(c)} <span className="text-stone-500">— {o("cattle_category", c.category)}</span>
                  </label>
                ))}
              </div>
              <Field label={t("fatten.startDate")}>
                <Input name="start_date" type="date" defaultValue={today()} max={today()} className="max-w-48" />
              </Field>
            </ActionForm>
          )}
        </Card>
      </div>

      {sold.length > 0 && (
        <Card title={t("fatten.soldTitle")} className="mt-6">
          <Table head={[t("cattle.colTag"), t("fatten.colDays"), t("fatten.colCost"), t("fatten.colSale"), t("fatten.colProfit")]}>
            {sold.map(({ animal: a, stats: s }) => (
              <ClickRow key={a.id} href={`/dashboard/cattle/${a.id}`}>
                <Td>
                  {animalLabel(a)} <Badge>{o("cattle_status", a.status)}</Badge>
                </Td>
                <Td className="tabular-nums">{f.number(s.daysOnFeed)}</Td>
                <Td className="tabular-nums">{money(s.costSoFar)}</Td>
                <Td className="tabular-nums">{money(s.saleAmount ?? 0)}</Td>
                <Td className={`tabular-nums font-semibold ${(s.realProfit ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(s.realProfit ?? 0)}</Td>
              </ClickRow>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}
