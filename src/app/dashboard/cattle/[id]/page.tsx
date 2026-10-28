import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionDisclosure } from "@/components/action-disclosure";
import { ActionForm } from "@/components/action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { DeleteButton } from "@/components/delete-animal";
import { BreedingForm } from "@/components/breeding-form";
import { ParentsFields } from "@/components/parents-fields";
import { HealthForm } from "@/components/health-form";
import { LineChart } from "@/components/charts/line-chart";
import { WeightForm } from "@/components/weight-form";
import { Badge, ButtonLink, Card, EmptyState, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { animalLabel, breedOptions, categoryOptions, groupOf, listHref, typeSexHint, type MotherCandidate } from "@/lib/cattle";
import { loadAnimalProfits } from "@/lib/animal-profit-data";
import { loadFattening } from "@/lib/fattening-data";
import { fattens } from "@/lib/modules";
import { heatSignsText, reproStatus } from "@/lib/breeding";
import { getAllBreedingRules } from "@/lib/breeding-data";
import { ageInMonths, today } from "@/lib/format";
import { dueItems, dueLabel } from "@/lib/health";
import { getI18n } from "@/lib/i18n/server";
import { getToolParams } from "@/lib/tool-params";
import { weightSummary, type WeightRecord } from "@/lib/weights";
import type { BreedingEvent, Cattle, HealthRecord, MilkRecord } from "@/lib/types";
import { deleteBreedingEvent, logBreedingEvent } from "../../breeding/actions";
import { deleteHealth, recordHealth } from "../../health/actions";
import { addWeight, archiveCattle, deleteCattle, deleteWeight, restoreCattle, updateCattle } from "../actions";
import { startFatteningOne, stopFattening } from "../../fattening/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("cattle.detailMeta") };
}

export default async function CattleDetailPage({ params }: PageProps<"/dashboard/cattle/[id]">) {
  const { id } = await params;
  const [{ supabase, farm, role }, i18n] = await Promise.all([requireFarm(), getI18n()]);
  const canWrite = role !== "vet";
  const canDelete = MANAGERS.includes(role);
  const { t, f, o, options } = i18n;
  const showProfit = role !== "vet" && farm.show_animal_profit !== false;

  // One round trip: the animal and its records, breeding rules, fattening numbers and profit.
  const [cowRes, milkRes, healthRes, breedingRes, femalesRes, calvesRes, weightsRes, rulesFor, fatRows, profits] = await Promise.all([
    supabase.from("cattle").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase
      .from("milk_records")
      .select("*")
      .eq("cattle_id", id)
      .gte("record_date", today(-29))
      .order("record_date", { ascending: false }),
    supabase.from("health_records").select("*").eq("cattle_id", id).order("record_date", { ascending: false }),
    supabase.from("breeding_events").select("*").eq("cattle_id", id).order("event_date", { ascending: false }).order("event_time", { ascending: false, nullsFirst: false }),
    supabase
      .from("cattle")
      .select("id, tag_number, name, category, status, species")
      .eq("farm_id", farm.id)
      .eq("sex", "female")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase
      .from("cattle")
      .select("id, tag_number, name, category, date_of_birth")
      .eq("farm_id", farm.id)
      .eq("mother_id", id)
      .is("deleted_at", null)
      .order("date_of_birth", { ascending: false }),
    supabase.from("cattle_weights").select("*").eq("cattle_id", id).order("weigh_date", { ascending: false }).order("created_at", { ascending: false }),
    getAllBreedingRules({ supabase }),
    fattens(farm) ? loadFattening(supabase, farm.id, id).catch(() => null) : null,
    // Profit over the last 12 months (owners, managers, workers; the farm can turn it off).
    showProfit ? loadAnimalProfits({ supabase, farm }, "12m").catch(() => null) : null,
  ]);
  const weights = (weightsRes.data ?? []) as WeightRecord[];
  const ws = weightSummary(weights);
  const kg = (n: number, d = 1) => t("weight.kgShort", { n: f.number(n, d) });
  const signed = (n: number, d = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${f.number(Math.abs(n), d)}`;

  const cow = cowRes.data as Cattle | null;
  if (!cow) notFound();
  const milk = (milkRes.data ?? []) as MilkRecord[];
  const health = (healthRes.data ?? []) as HealthRecord[];
  const breeding = (breedingRes.data ?? []) as BreedingEvent[];
  // A mother is a female of the same species.
  const females = ((femalesRes.data ?? []) as (MotherCandidate & { species?: string })[]).filter(
    (a) => (a.species ?? "cattle") === (cow.species ?? "cattle") || a.id === cow.mother_id,
  );
  const mother = females.find((a) => a.id === cow.mother_id) ?? null;
  const calves = calvesRes.data ?? [];

  const milkTotal = milk.reduce((s, m) => s + Number(m.quantity_liters), 0);
  const milkDays = new Set(milk.map((m) => m.record_date)).size;
  const withdrawal = health.find((h) => h.withdrawal_until && h.withdrawal_until >= today());
  const rules = rulesFor(cow.species);
  const group = groupOf(cow.species);
  const backHref = listHref(cow.species);
  const fat = cow.is_fattening ? (fatRows?.rows[0] ?? null) : null;
  const money = (n: number) => f.money(n, farm.currency);
  const profitIndex = profits ? profits.rows.findIndex((x) => x.id === cow.id) : -1;
  const profit =
    profits && profitIndex >= 0
      ? { row: profits.rows[profitIndex], rank: profitIndex + 1, of: profits.rows.length, milkPriceMissing: profits.milkPriceMissing }
      : null;
  const checkDays = rules.pregnancyCheckDays;
  const repro = reproStatus(breeding, today(), rules);
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
  // Bulls and steers: no milk and no breeding (heat, AI, pregnancy, calving) sections.
  // Goats and sheep: breeding, but no milk.
  const isFemale = cow.sex === "female";
  const milks = isFemale && group === "cattle";

  return (
    <>
      <PageHeader
        title={`${cow.tag_number}${cow.name ? ` · ${cow.name}` : ""}`}
        description={[o("cattle_category", cow.category), cow.breed ? o("cattle_breed", cow.breed) : null, ageText].filter(Boolean).join(" · ")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={`/dashboard/cattle/${cow.id}/report`} variant="secondary" data-testid="report-link">
              📄 {t("print.reportButton")}
            </ButtonLink>
            {canWrite &&
              (cow.status === "archived" ? (
                <ConfirmForm
                  action={restoreCattle}
                  fields={{ id: cow.id }}
                  label={t("cattle.restore")}
                  variant="secondary"
                />
              ) : (
                <ConfirmForm
                  action={archiveCattle}
                  fields={{ id: cow.id }}
                  label={t("cattle.archive")}
                  confirm={t("cattle.archiveConfirm", { tag: cow.tag_number })}
                  variant="secondary"
                />
              ))}
            {canDelete && (
              <DeleteButton
                action={deleteCattle}
                id={cow.id}
                label={t("cattle.delete")}
                confirm={t("cattle.deleteConfirm", { tag: cow.tag_number })}
                redirectTo={backHref}
              />
            )}
            <Link href={backHref} className="text-sm text-stone-500 hover:text-stone-900">
              {group === "small" ? t("goats.all") : t("cattle.allCattle")}
            </Link>
          </div>
        }
      />

      {cow.status === "archived" && (
        <p role="status" className="mb-4 rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-700">
          {t("cattle.archivedNotice")}
        </p>
      )}

      {withdrawal && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("cattle.withdrawal", {
            date: f.date(withdrawal.withdrawal_until),
            what: withdrawal.medicine ?? withdrawal.description,
          })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={t("weight.current")}
          value={ws.current ? kg(Number(ws.current.weight_kg)) : "—"}
          hint={
            ws.current
              ? ws.change !== null
                ? t("weight.changeHint", { change: signed(ws.change), date: f.date(ws.current.weigh_date) })
                : f.date(ws.current.weigh_date)
              : t("weight.none")
          }
          tone={ws.change !== null ? (ws.change >= 0 ? "good" : "bad") : "default"}
        />
        {milks && (
          <>
            <StatCard label={t("cattle.milk30")} value={t("common.litersShort", { n: f.number(milkTotal, 1) })} />
            <StatCard
              label={t("cattle.avgPerDay")}
              value={t("common.litersShort", { n: f.number(milkDays ? milkTotal / milkDays : 0, 1) })}
              hint={t("cattle.daysRecorded", { n: milkDays })}
            />
            <StatCard label={t("cattle.expectedCalving")} value={f.date(repro.expectedCalving)} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("cattle.healthRecords")}>
          <ActionDisclosure label={t("cattle.recordHealth")} testId="record-health">
            <HealthForm action={recordHealth} today={today()} currency={farm.currency} cattleId={cow.id} />
          </ActionDisclosure>
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
            <Table head={[t("cattle.colDate"), t("cattle.colWhat"), t("cattle.colNextDue"), t("cattle.colCost"), ""]}>
              {health.map((h) => (
                <tr key={h.id}>
                  <Td>{f.date(h.record_date)}</Td>
                  <Td>
                    <Badge tone={h.record_type === "vaccination" ? "blue" : h.record_type === "treatment" || h.record_type === "checkup" ? "default" : "amber"}>
                      {o("health_type", h.record_type)}
                    </Badge>
                    <span className="mt-0.5 block">{h.product ?? h.description}</span>
                  </Td>
                  <Td>{f.date(h.next_due_date)}</Td>
                  <Td>{h.cost != null ? f.money(h.cost, farm.currency) : "—"}</Td>
                  <Td className="text-right">
                    <Link href={`/dashboard/health/${h.id}/edit`} className="text-sm text-emerald-700 hover:underline" data-testid="edit-health">
                      {t("common.edit")}
                    </Link>
                    {canDelete && (
                      <div className="mt-1">
                        <ConfirmForm action={deleteHealth} fields={{ id: h.id }} label={t("common.delete")} confirm={t("health.confirmDelete")} />
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {isFemale && (
        <Card title={t("cattle.breeding")}>
          <ActionDisclosure label={t("cattle.recordBreeding")} testId="record-breeding">
            <BreedingForm action={logBreedingEvent} today={today()} currency={farm.currency} cattleId={cow.id} checkDays={checkDays} gestationDays={rules.gestationDays} species={cow.species ?? "cattle"} />
          </ActionDisclosure>
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
          {breeding.length === 0 ? (
            <EmptyState title={t("cattle.noBreeding")} />
          ) : (
            <Table head={[t("cattle.colDate"), t("cattle.colEvent"), t("cattle.colDetails"), ""]}>
              {breeding.map((b) => (
                <tr key={b.id}>
                  <Td>
                    {f.date(b.event_date)}
                    {b.event_time && <span className="block text-xs text-stone-500">{f.time(b.event_time)}</span>}
                  </Td>
                  <Td>{o("breeding_event", b.event_type)}</Td>
                  <Td className="text-xs">
                    {[
                      b.bull_or_semen,
                      b.technician && t("breeding.by", { name: b.technician }),
                      b.event_type === "pregnancy_check" && b.result ? o("pregnancy_result", b.result) : null,
                      heatSignsText(o, b.heat_signs),
                      b.expected_calving_date && t("breeding.calvingOn", { date: f.date(b.expected_calving_date) }),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Td>
                  <Td className="text-right">
                    <Link href={`/dashboard/breeding/${b.id}/edit`} className="text-sm text-emerald-700 hover:underline" data-testid="edit-breeding">
                      {t("common.edit")}
                    </Link>
                    {canDelete && (
                      <div className="mt-1">
                        <ConfirmForm action={deleteBreedingEvent} fields={{ id: b.id }} label={t("common.delete")} confirm={t("breeding.confirmDelete")} />
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        )}
        <Card title={t("weight.title")} description={t("weight.desc")}>
          {canWrite && (
            <ActionDisclosure label={t("weight.add")} open={weights.length === 0} testId="record-weight">
              <WeightForm action={addWeight} cattleId={cow.id} today={today()} allowTape={group === "cattle"} divisor={(await getToolParams()).params.weight.divisor} />
            </ActionDisclosure>
          )}
          {weights.length === 0 ? (
            <EmptyState title={t("weight.none")}>{t("weight.noneBody")}</EmptyState>
          ) : (
            <>
              <dl className="mb-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-stone-500">{t("weight.current")}</dt>
                  <dd className="text-lg font-bold tabular-nums text-stone-900">{kg(Number(ws.current!.weight_kg))}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("weight.adg")}</dt>
                  <dd className={`text-lg font-bold tabular-nums ${ws.adg === null ? "text-stone-400" : ws.adg >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {ws.adg === null ? "—" : t("weight.perDay", { n: signed(ws.adg, 2) })}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("weight.totalGain")}</dt>
                  <dd className="text-lg font-bold tabular-nums text-stone-900">{ws.totalGain === null ? "—" : kg(ws.totalGain)}</dd>
                </div>
              </dl>
              {weights.length > 1 && (
                <LineChart
                  title={t("weight.chartTitle", { tag: cow.tag_number })}
                  unit={t("weight.unit")}
                  locale={i18n.locale}
                  points={[...weights].reverse().map((w) => ({
                    key: w.id,
                    x: Date.parse(w.weigh_date),
                    label: f.date(w.weigh_date),
                    value: Number(w.weight_kg),
                  }))}
                />
              )}
              <div className="mt-4">
                <Table head={[t("common.date"), t("weight.kg"), t("weight.method"), ""]}>
                  {weights.slice(0, 12).map((w) => (
                    <tr key={w.id}>
                      <Td>{f.date(w.weigh_date)}</Td>
                      <Td className="font-medium tabular-nums">{kg(Number(w.weight_kg))}</Td>
                      <Td>
                        {t(`weight.methods.${w.method}`)}
                        {w.method === "tape" && w.heart_girth_cm && (
                          <span className="block text-xs text-stone-500">
                            {t("weight.tapeDims", { g: f.number(Number(w.heart_girth_cm), 1), l: f.number(Number(w.body_length_cm ?? 0), 1) })}
                          </span>
                        )}
                        {w.notes && <span className="block text-xs text-stone-500">{w.notes}</span>}
                      </Td>
                      <Td className="text-right">
                        {canDelete && <ConfirmForm action={deleteWeight} fields={{ id: w.id }} label={t("common.delete")} confirm={t("weight.confirmDelete")} />}
                      </Td>
                    </tr>
                  ))}
                </Table>
              </div>
            </>
          )}
        </Card>

        {milks && (
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
                  <Td>{o("milk_session", m.session)}</Td>
                  <Td className="tabular-nums">{f.number(Number(m.quantity_liters), 2)}</Td>
                  <Td>{m.fat_percent != null ? f.number(Number(m.fat_percent), 2) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        )}

        {fattens(farm) && cow.status === "active" && (
          <Card
            title={t("fatten.cardTitle")}
            action={
              canWrite &&
              (cow.is_fattening ? (
                <ConfirmForm action={stopFattening} fields={{ id: cow.id }} label={t("fatten.stop")} confirm={t("fatten.stopConfirm")} />
              ) : (
                <ConfirmForm action={startFatteningOne} fields={{ id: cow.id }} label={t("fatten.start")} variant="primary" />
              ))
            }
          >
            {fat ? (
              <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="fatten-card">
                <div>
                  <dt className="text-stone-500">{t("fatten.colDays")}</dt>
                  <dd className="font-semibold tabular-nums">{f.number(fat.stats.daysOnFeed)}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("fatten.colAdg")}</dt>
                  <dd className="font-semibold tabular-nums">{fat.stats.adg !== null ? t("fatten.adgValue", { n: f.number(fat.stats.adg, 2) }) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("fatten.colProjected")}</dt>
                  <dd className="font-semibold tabular-nums">{fat.stats.projectedKg !== null ? kg(fat.stats.projectedKg, 0) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("fatten.colCost")}</dt>
                  <dd className="font-semibold tabular-nums">{money(fat.stats.costAtTarget)}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("fatten.colBreakEven")}</dt>
                  <dd className="font-semibold tabular-nums">{fat.stats.breakEvenPerKg !== null ? t("fatten.perKg", { amount: money(fat.stats.breakEvenPerKg) }) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("fatten.colProfit")}</dt>
                  <dd className={`font-semibold tabular-nums ${(fat.stats.estProfit ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {fat.stats.estProfit !== null ? money(fat.stats.estProfit) : "—"}
                  </dd>
                </div>
                <p className="col-span-2 text-xs text-stone-500">
                  <Link href="/dashboard/fattening" className="text-emerald-700 hover:underline">{t("fatten.openPage")}</Link>
                </p>
              </dl>
            ) : (
              <p className="text-sm text-stone-500">{t("fatten.notOn")}</p>
            )}
          </Card>
        )}

        {profit && (
          <Card title={t("aprofit.cardTitle")} description={t("aprofit.cardDesc")}>
            <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="animal-profit">
              <div>
                <dt className="text-stone-500">{t("aprofit.colIncome")}</dt>
                <dd className="font-semibold tabular-nums">{money(profit.row.income)}</dd>
                {profit.row.milkLitres > 0 && <dd className="text-xs text-stone-500">{t("aprofit.milkOf", { n: f.number(profit.row.milkLitres, 0) })}</dd>}
              </div>
              <div>
                <dt className="text-stone-500">{t("aprofit.colCost")}</dt>
                <dd className="font-semibold tabular-nums">{money(profit.row.cost)}</dd>
                <dd className="text-xs text-stone-500">{t("aprofit.sharedOf", { amount: money(profit.row.sharedCost) })}</dd>
              </div>
              <div>
                <dt className="text-stone-500">{t("aprofit.colProfit")}</dt>
                <dd className={`text-lg font-bold tabular-nums ${profit.row.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(profit.row.profit)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">{t("aprofit.rank")}</dt>
                <dd className="font-semibold tabular-nums">{t("aprofit.rankOf", { n: f.number(profit.rank), of: f.number(profit.of) })}</dd>
              </div>
              {profit.milkPriceMissing && <p className="col-span-2 text-xs text-amber-700">{t("aprofit.noMilkPrice")}</p>}
              <p className="col-span-2 text-xs">
                <Link href="/dashboard/profit/animals" className="text-emerald-700 hover:underline">
                  {t("aprofit.openPage")}
                </Link>
              </p>
            </dl>
          </Card>
        )}

        <Card title={t("cattle.familyTitle")}>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">{t("cattle.mother")}</dt>
              <dd className="text-right font-medium">
                {mother ? (
                  <Link href={`/dashboard/cattle/${mother.id}`} className="text-emerald-700 hover:underline">
                    {animalLabel(mother)} — {o("cattle_category", mother.category)}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">{t("cattle.father")}</dt>
              <dd className="text-right font-medium">{cow.father ?? "—"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-stone-500">{t("cattle.calves")}</dt>
              <dd>
                {calves.length === 0 ? (
                  <span className="text-stone-500">{t("cattle.noCalves")}</span>
                ) : (
                  <ul className="grid gap-1">
                    {calves.map((c) => (
                      <li key={c.id}>
                        <Link href={`/dashboard/cattle/${c.id}`} className="text-emerald-700 hover:underline">
                          {animalLabel(c)}
                        </Link>{" "}
                        <span className="text-stone-500">
                          — {o("cattle_category", c.category)}
                          {c.date_of_birth ? ` · ${f.date(c.date_of_birth)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        {canWrite && (
        <Card title={t("cattle.detailsTitle")}>
          <ActionForm action={updateCattle} submitLabel={t("cattle.saveChanges")} submitVariant="secondary">
            <input type="hidden" name="id" value={cow.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cattle.tag")}>
                <Input name="tag_number" defaultValue={cow.tag_number} required />
              </Field>
              <Field label={t("common.name")}>
                <Input name="name" defaultValue={cow.name ?? ""} />
              </Field>
              <Field label={t("common.breed")}>
                <Select
                  name="breed"
                  defaultValue={cow.breed ?? ""}
                  options={
                    group === "small"
                      ? breedOptions(i18n, "cattle_breed", cow.breed).filter((b) => b.value === "" || b.value === "Other" || b.value === cow.breed || b.meta.species === "goat" || b.meta.species === "sheep")
                      : breedOptions(i18n, "cattle_breed", cow.breed, "cattle")
                  }
                />
              </Field>
              <Field label={t("common.category")} hint={typeSexHint(i18n, group)}>
                <Select name="category" defaultValue={cow.category} options={categoryOptions(i18n, group, cow.category)} />
              </Field>
              <Field label={t("common.status")}>
                <Select name="status" defaultValue={cow.status} options={options("cattle_status", cow.status)} />
              </Field>
            </div>
            <Field label={t("cattle.dob")}>
              <Input name="date_of_birth" type="date" defaultValue={cow.date_of_birth ?? ""} />
            </Field>
            <ParentsFields
              candidates={females}
              i18n={i18n}
              excludeId={cow.id}
              defaultMother={cow.mother_id}
              defaultFather={cow.father}
            />
            <Field label={t("common.notes")}>
              <Textarea name="notes" defaultValue={cow.notes ?? ""} />
            </Field>
          </ActionForm>
        </Card>
        )}
      </div>
    </>
  );
}
