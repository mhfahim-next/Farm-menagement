import type { Metadata } from "next";
import Link from "@/components/local-link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PrintButton } from "@/components/print-button";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { loadFeedPlans } from "@/lib/feed-data";
import { FEED_PRESETS, FEED_SPEC, presetOf, type FeedPreset, type FeedRule } from "@/lib/feed-plan";
import { kindLabel, ruleSummary } from "@/lib/feed-labels";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/core";
import { keepsCattle } from "@/lib/modules";
import { applyFeedPreset, resetFeedRule, saveFeedRule } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("feed.title") };
}

const GROUPS: { title: MessageKey; keys: (keyof FeedRule)[] }[] = [
  { title: "feed.g.milk", keys: ["maintPer100", "maintFixed", "firstLitres", "firstKg", "litresPerKg", "maxKg"] },
  { title: "feed.g.other", keys: ["dryExtraKg", "youngPer100", "fatPer100"] },
  { title: "feed.g.rough", keys: ["strawPer100", "greenPer100", "waterPer100", "waterPerLitre"] },
];

export default async function FeedPage() {
  const ctx = await requireFarm();
  const { farm, role } = ctx;
  if (!keepsCattle(farm)) notFound();
  const i18n = await getI18n();
  const { t, f } = i18n;
  const canEdit = MANAGERS.includes(role);
  const { rule, saved, rows, totals, month, dairyMix } = await loadFeedPlans(ctx);
  const preset = presetOf(rule);
  const kg = (n: number) => t("feed.kg", { n: f.number(n, 1) });
  const guessed = rows.filter((r) => r.plan.weightGuessed).length;

  return (
    <>
      <PageHeader
        title={t("feed.title")}
        description={t("feed.desc")}
        action={rows.length > 0 ? <PrintButton label={t("feed.print")} className="print:hidden" /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("feed.concentrate")} value={kg(totals.concentrateKg)} hint={t("feed.today")} />
        <StatCard label={t("feed.green")} value={kg(totals.greenKg)} hint={t("feed.today")} />
        <StatCard label={t("feed.straw")} value={kg(totals.strawKg)} hint={t("feed.today")} />
        <StatCard label={t("feed.water")} value={t("feed.litres", { n: f.number(totals.waterL) })} hint={t("feed.today")} />
      </div>

      <Card className="mt-6" title={t("feed.listTitle")} description={`${t("feed.ruleNow")}: ${ruleSummary(rule, i18n)}`}>
        {rows.length === 0 ? (
          <EmptyState title={t("feed.empty")} />
        ) : (
          <>
            <Table head={[t("feed.animal"), t("feed.state"), t("feed.weight"), t("feed.concentrate"), t("feed.green"), t("feed.straw"), t("feed.water")]}>
              {rows.map((r) => (
                <tr key={r.id} data-testid="feed-row">
                  <Td>
                    <Link href={`/dashboard/cattle/${r.id}`} className="font-medium text-emerald-700 hover:underline">
                      {r.tag_number}
                      {r.name ? ` · ${r.name}` : ""}
                    </Link>
                  </Td>
                  <Td>{kindLabel(r.plan, r.daysToCalving, i18n)}</Td>
                  <Td>
                    {f.number(r.plan.weightKg)} {t("feed.kgShort")}
                    {r.plan.weightGuessed && (
                      <span className="ml-1">
                        <Badge tone="amber">{t("feed.guess")}</Badge>
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="font-semibold text-stone-900">{kg(r.plan.concentrateKg)}</span>
                    {r.plan.capped && (
                      <span className="ml-1">
                        <Badge tone="red">{t("feed.capped")}</Badge>
                      </span>
                    )}
                    <span className="block text-xs text-stone-500">{t("feed.meals", { n: f.number(r.plan.concentrateKg / 2, 1) })}</span>
                  </Td>
                  <Td>{kg(r.plan.greenKg)}</Td>
                  <Td>{kg(r.plan.strawKg)}</Td>
                  <Td>{t("feed.litres", { n: f.number(r.plan.waterL) })}</Td>
                </tr>
              ))}
            </Table>
            {guessed > 0 && <p className="mt-3 text-sm text-amber-800">{t("feed.guessNote", { n: f.number(guessed) })}</p>}
          </>
        )}
      </Card>

      {rows.length > 0 && (
        <Card className="mt-6" title={t("feed.monthTitle")} description={t("feed.monthDesc")}>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {month.map((m) => (
              <li key={m.ingredient} className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
                <span>{t(`tools.ing.${m.ingredient}` as MessageKey)}</span>
                <span className="font-semibold tabular-nums">{kg(m.kg)}</span>
              </li>
            ))}
            <li className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2">
              <span>{t("feed.green")}</span>
              <span className="font-semibold tabular-nums">{kg(Math.round(totals.greenKg * 30))}</span>
            </li>
            <li className="flex justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span>{t("feed.straw")}</span>
              <span className="font-semibold tabular-nums">{kg(Math.round(totals.strawKg * 30))}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            {t("feed.mixNote", { mix: dairyMix.filter((m) => m.pct > 0).map((m) => `${t(`tools.ing.${m.ingredient}` as MessageKey)} ${f.number(m.pct)}%`).join(", ") })}
          </p>
        </Card>
      )}

      <Card className="mt-6 print:hidden" title={t("feed.ruleTitle")} description={t("feed.ruleDesc")}>
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
          <span className="font-medium">{t("feed.ruleNow")}:</span> {ruleSummary(rule, i18n)}{" "}
          {preset ? <Badge tone="green">{t(`feed.preset.${preset}`)}</Badge> : <Badge tone="blue">{t("feed.ownRule")}</Badge>}
        </p>
        {canEdit ? (
          <>
            <h3 className="mt-5 text-sm font-semibold text-stone-900">{t("feed.presetsTitle")}</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(Object.keys(FEED_PRESETS) as FeedPreset[]).map((p) => (
                <div key={p} className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-stone-900">{t(`feed.preset.${p}`)}</p>
                    <p className="text-xs text-stone-500">{t(`feed.presetHint.${p}`)}</p>
                  </div>
                  <ConfirmForm action={applyFeedPreset} fields={{ preset: p }} label={preset === p ? t("feed.inUse") : t("feed.use")} variant={preset === p ? "secondary" : "primary"} />
                </div>
              ))}
            </div>

            <details className="mt-5 rounded-lg border border-stone-200 p-4" open={!preset}>
              <summary className="cursor-pointer text-sm font-semibold text-emerald-800">{t("feed.ownTitle")}</summary>
              <ActionForm action={saveFeedRule} submitLabel={t("feed.save")} className="mt-4 grid gap-5">
                {GROUPS.map((g) => (
                  <fieldset key={g.title} className="grid gap-3">
                    <legend className="mb-2 text-sm font-semibold text-stone-900">{t(g.title)}</legend>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {g.keys.map((k) => (
                        <Field key={k} label={t(`feed.f.${k}`)} hint={t(`feed.h.${k}`)}>
                          <Input name={k} type="number" inputMode="decimal" min={FEED_SPEC[k].min} max={FEED_SPEC[k].max} step={FEED_SPEC[k].step} defaultValue={rule[k]} required />
                        </Field>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <Field label={t("feed.f.greenShare")} hint={t("feed.h.greenShare")}>
                  <Select
                    name="greenShare"
                    defaultValue={String(rule.greenShare)}
                    options={[
                      { value: "1", label: t("feed.greenAll") },
                      { value: "0.5", label: t("feed.greenSome") },
                      { value: "0", label: t("feed.greenNone") },
                    ]}
                  />
                </Field>
              </ActionForm>
            </details>
            {saved && (
              <div className="mt-4">
                <ConfirmForm action={resetFeedRule} fields={{}} label={t("feed.reset")} confirm={t("feed.resetConfirm")} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-stone-600">{t("feed.onlyManagers")}</p>
        )}
      </Card>

      <aside className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">{t("feed.careTitle")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>{t("feed.care1")}</li>
          <li>{t("feed.care2")}</li>
          <li>{t("feed.care3")}</li>
        </ul>
        <p className="mt-3 text-xs text-amber-900">{t("feed.sources")}</p>
      </aside>
    </>
  );
}
