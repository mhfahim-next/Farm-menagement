import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PrintButton } from "@/components/print-button";
import { requireFarm, STAFF } from "@/lib/auth";
import { heatSignsText, reproStatus } from "@/lib/breeding";
import { getBreedingRules } from "@/lib/breeding-data";
import { ageInMonths, today } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { animalUrl, qrSvg } from "@/lib/qr";
import { weightSummary, type WeightRecord } from "@/lib/weights";
import type { BreedingEvent, Cattle, HealthRecord } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/dashboard/cattle/[id]/report">): Promise<Metadata> {
  const { id } = await params;
  const { supabase, farm } = await requireFarm();
  const { t } = await getI18n();
  const { data } = await supabase.from("cattle").select("tag_number").eq("id", id).eq("farm_id", farm.id).maybeSingle();
  // The browser uses the page title as the file name when saving as PDF.
  return { title: `${data?.tag_number ?? ""} ${t("print.reportTitle")}`.trim(), robots: { index: false, follow: false } };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid-page">
      <h2 className="mb-2 border-b border-stone-300 pb-1 text-base font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

const th = "px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-stone-500";
const td = "px-2 py-1.5 align-top text-sm text-stone-800";

export default async function AnimalReportPage({ params }: PageProps<"/dashboard/cattle/[id]/report">) {
  const { id } = await params;
  const { supabase, farm, role } = await requireFarm();
  const canSeeMoney = STAFF.includes(role);
  const i18n = await getI18n();
  const { t, f, o } = i18n;

  const [cowRes, healthRes, breedingRes, weightsRes, milkRes, calvesRes, saleRes] = await Promise.all([
    supabase.from("cattle").select("*").eq("id", id).eq("farm_id", farm.id).maybeSingle(),
    supabase.from("health_records").select("*").eq("cattle_id", id).order("record_date", { ascending: false }),
    supabase.from("breeding_events").select("*").eq("cattle_id", id).order("event_date", { ascending: false }),
    supabase.from("cattle_weights").select("*").eq("cattle_id", id).order("weigh_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("milk_records").select("record_date, quantity_liters").eq("cattle_id", id).order("record_date", { ascending: false }).limit(5000),
    supabase.from("cattle").select("id, tag_number, name, category, date_of_birth").eq("farm_id", farm.id).eq("mother_id", id).is("deleted_at", null).order("date_of_birth", { ascending: false }),
    canSeeMoney
      ? supabase.from("sales").select("sale_date, amount, paid_amount, buyers(name)").eq("farm_id", farm.id).eq("cattle_id", id).order("sale_date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const cow = cowRes.data as Cattle | null;
  if (!cow) notFound();
  const health = (healthRes.data ?? []) as HealthRecord[];
  const breeding = (breedingRes.data ?? []) as BreedingEvent[];
  const weights = (weightsRes.data ?? []) as WeightRecord[];
  const milk = (milkRes.data ?? []) as { record_date: string; quantity_liters: number }[];
  const calves = calvesRes.data ?? [];
  const sales = (saleRes.data ?? []) as unknown as { sale_date: string; amount: number; paid_amount: number; buyers: { name: string } | { name: string }[] | null }[];

  const isFemale = cow.sex === "female";
  const ws = weightSummary(weights);
  const money = (n: number) => f.money(n, farm.currency);
  const kg = (n: number) => t("weight.kgShort", { n: f.number(n, 1) });
  const mother = cow.mother_id
    ? ((await supabase.from("cattle").select("tag_number, name").eq("id", cow.mother_id).eq("farm_id", farm.id).maybeSingle()).data as { tag_number: string; name: string | null } | null)
    : null;

  const months = ageInMonths(cow.date_of_birth);
  const ageText =
    months === null ? "—" : months < 1 ? t("age.lessThanMonth") : months < 24 ? t("age.months", { n: months }) : t("age.yearsMonths", { y: Math.floor(months / 12), m: months % 12 });

  // Milk by month (last 12 months with records) and totals.
  const milkTotal = milk.reduce((s, m) => s + Number(m.quantity_liters), 0);
  const milkDays = new Set(milk.map((m) => m.record_date)).size;
  const byMonth = new Map<string, { litres: number; days: Set<string> }>();
  for (const m of milk) {
    const key = m.record_date.slice(0, 7);
    const e = byMonth.get(key) ?? { litres: 0, days: new Set<string>() };
    e.litres += Number(m.quantity_liters);
    e.days.add(m.record_date);
    byMonth.set(key, e);
  }
  const months12 = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  // Breeding state (females).
  const rules = isFemale ? await getBreedingRules({ supabase }, cow.species) : null;
  const repro = isFemale && rules ? reproStatus(breeding, today(), rules) : null;

  // Money recorded against this animal.
  const healthCost = health.filter((h) => Number(h.cost) > 0);
  const breedingCost = breeding.filter((b) => Number(b.cost) > 0);
  const purchase = cow.purchase_price != null && Number(cow.purchase_price) > 0 ? Number(cow.purchase_price) : 0;
  const sum = (xs: { cost: number | null }[]) => xs.reduce((s, x) => s + Number(x.cost), 0);
  const totalCost = purchase + sum(healthCost) + sum(breedingCost);
  const income = sales.reduce((s, x) => s + Number(x.amount), 0);
  const buyerName = (b: (typeof sales)[number]["buyers"]) => (Array.isArray(b) ? b[0]?.name : b?.name) ?? "—";

  const qr = await qrSvg(animalUrl(cow.id));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/cattle/${cow.id}`} className="text-sm text-stone-500 hover:text-stone-900">
          ← {t("common.back")}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-stone-500 sm:inline">{t("print.reportHowTo")}</span>
          <PrintButton label={t("print.button")} />
        </div>
      </div>

      <article className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8 print:rounded-none print:border-0 print:p-0" data-testid="report">
        <header className="flex items-start justify-between gap-4 border-b-2 border-emerald-700 pb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{farm.name}</p>
            <h1 className="mt-1 break-words text-3xl font-extrabold leading-tight text-stone-900">
              {cow.tag_number}
              {cow.name ? ` · ${cow.name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {t("print.reportTitle")} · {t("print.generated", { date: f.date(today()) })}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div role="img" aria-label="QR" className="w-24 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-1 text-[10px] text-stone-500">{t("print.scan")}</p>
          </div>
        </header>

        <Section title={t("print.details")}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            {(
              [
                [t("common.category"), o("cattle_category", cow.category)],
                [t("common.breed"), cow.breed ? o("cattle_breed", cow.breed) : "—"],
                [t("print.statusLabel"), o("cattle_status", cow.status)],
                [t("cattle.dob"), cow.date_of_birth ? f.date(cow.date_of_birth) : "—"],
                [t("print.ageLabel"), ageText],
                [t("cattle.purchaseDate"), cow.purchase_date ? f.date(cow.purchase_date) : "—"],
                [t("cattle.mother"), mother ? `${mother.tag_number}${mother.name ? ` · ${mother.name}` : ""}` : "—"],
                [t("cattle.father"), cow.father ?? "—"],
                ...(repro ? [[t("print.reproState"), t(`breeding.state.${repro.state}` as "breeding.state.open")] as [string, string]] : []),
                ...(repro?.expectedCalving ? [[t("cattle.expectedCalving"), f.date(repro.expectedCalving)] as [string, string]] : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-stone-500">{k}</dt>
                <dd className="font-medium text-stone-900">{v}</dd>
              </div>
            ))}
          </dl>
          {cow.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{cow.notes}</p>}
          {calves.length > 0 && (
            <p className="mt-3 text-sm text-stone-700">
              <span className="text-xs text-stone-500">{t("cattle.calves")}: </span>
              {calves.map((c) => `${c.tag_number}${c.name ? ` · ${c.name}` : ""}`).join(", ")}
            </p>
          )}
        </Section>

        <Section title={t("print.weightTitle")}>
          {weights.length === 0 ? (
            <p className="text-sm text-stone-500">{t("print.weightNone")}</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-stone-700">
                {t("weight.current")}: <b>{kg(Number(ws.current!.weight_kg))}</b>
                {ws.adg !== null && <> · {t("weight.adg")}: <b>{t("weight.perDay", { n: f.number(ws.adg, 2) })}</b></>}
                {ws.totalGain !== null && <> · {t("weight.totalGain")}: <b>{kg(ws.totalGain)}</b></>}
              </p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className={th}>{t("common.date")}</th>
                    <th className={th}>{t("weight.kg")}</th>
                    <th className={th}>{t("weight.method")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {weights.slice(0, 15).map((w) => (
                    <tr key={w.id}>
                      <td className={td}>{f.date(w.weigh_date)}</td>
                      <td className={`${td} tabular-nums`}>{kg(Number(w.weight_kg))}</td>
                      <td className={td}>{t(`weight.methods.${w.method}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Section>

        {isFemale && (
          <Section title={t("print.milkTitle")}>
            {milk.length === 0 ? (
              <p className="text-sm text-stone-500">{t("print.milkNone")}</p>
            ) : (
              <>
                <p className="mb-2 text-sm text-stone-700">
                  {t("print.milkTotal")}: <b>{t("common.litersShort", { n: f.number(milkTotal, 1) })}</b> · {t("print.milkDays")}: <b>{f.number(milkDays)}</b> ·{" "}
                  {t("print.milkAvg")}: <b>{t("common.litersShort", { n: f.number(milkTotal / milkDays, 1) })}</b>
                </p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className={th}>{t("print.milkMonth")}</th>
                      <th className={th}>{t("print.milkLitres")}</th>
                      <th className={th}>{t("print.milkDaysCol")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {months12.map(([key, v]) => (
                      <tr key={key}>
                        <td className={td}>{f.month(`${key}-01`)}</td>
                        <td className={`${td} tabular-nums`}>{f.number(v.litres, 1)}</td>
                        <td className={`${td} tabular-nums`}>{f.number(v.days.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Section>
        )}

        <Section title={t("print.healthTitle")}>
          {health.length === 0 ? (
            <p className="text-sm text-stone-500">{t("cattle.noHealth")}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className={th}>{t("cattle.colDate")}</th>
                  <th className={th}>{t("cattle.colWhat")}</th>
                  <th className={th}>{t("cattle.colNextDue")}</th>
                  {canSeeMoney && <th className={th}>{t("cattle.colCost")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {health.map((h) => (
                  <tr key={h.id} className="break-inside-avoid">
                    <td className={`${td} whitespace-nowrap`}>{f.date(h.record_date)}</td>
                    <td className={td}>
                      <span className="text-xs text-stone-500">{o("health_type", h.record_type)}</span>
                      <span className="block">{h.product ?? h.description}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{f.date(h.next_due_date)}</td>
                    {canSeeMoney && <td className={`${td} whitespace-nowrap`}>{h.cost != null ? money(Number(h.cost)) : "—"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {isFemale && (
          <Section title={t("print.breedingTitle")}>
            {breeding.length === 0 ? (
              <p className="text-sm text-stone-500">{t("cattle.noBreeding")}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className={th}>{t("cattle.colDate")}</th>
                    <th className={th}>{t("cattle.colEvent")}</th>
                    <th className={th}>{t("cattle.colDetails")}</th>
                    {canSeeMoney && <th className={th}>{t("cattle.colCost")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {breeding.map((b) => (
                    <tr key={b.id} className="break-inside-avoid">
                      <td className={`${td} whitespace-nowrap`}>{f.date(b.event_date)}</td>
                      <td className={td}>{o("breeding_event", b.event_type)}</td>
                      <td className={`${td} text-xs`}>
                        {[
                          b.bull_or_semen,
                          b.technician && t("breeding.by", { name: b.technician }),
                          b.event_type === "pregnancy_check" && b.result ? o("pregnancy_result", b.result) : null,
                          heatSignsText(o, b.heat_signs),
                          b.expected_calving_date && t("breeding.calvingOn", { date: f.date(b.expected_calving_date) }),
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      {canSeeMoney && <td className={`${td} whitespace-nowrap`}>{b.cost != null ? money(Number(b.cost)) : "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )}

        {canSeeMoney && (
          <Section title={t("print.financeTitle")}>
            {purchase === 0 && healthCost.length === 0 && breedingCost.length === 0 && sales.length === 0 ? (
              <p className="text-sm text-stone-500">{t("print.fin.none")}</p>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className={th}>{t("common.date")}</th>
                      <th className={th}>{t("print.fin.what")}</th>
                      <th className={th}>{t("print.fin.type")}</th>
                      <th className={`${th} text-right`}>{t("cattle.colCost")} / {t("print.fin.incomeType")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {[
                      ...(purchase > 0 ? [{ date: cow.purchase_date, what: t("print.fin.purchase"), type: "expense", amount: purchase }] : []),
                      ...healthCost.map((h) => ({ date: h.record_date, what: `${t("print.fin.health")}: ${h.product ?? h.description}`, type: "expense", amount: Number(h.cost) })),
                      ...breedingCost.map((b) => ({ date: b.event_date, what: `${t("print.fin.breeding")}: ${o("breeding_event", b.event_type)}`, type: "expense", amount: Number(b.cost) })),
                      ...sales.map((s) => ({ date: s.sale_date, what: t("print.fin.sold", { date: f.date(s.sale_date), buyer: buyerName(s.buyers) }), type: "income", amount: Number(s.amount) })),
                    ]
                      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
                      .map((x, i) => (
                        <tr key={i} className="break-inside-avoid">
                          <td className={`${td} whitespace-nowrap`}>{x.date ? f.date(x.date) : "—"}</td>
                          <td className={td}>{x.what}</td>
                          <td className={td}>{x.type === "income" ? t("print.fin.incomeType") : t("print.fin.expense")}</td>
                          <td className={`${td} text-right tabular-nums ${x.type === "income" ? "text-emerald-700" : ""}`}>
                            {x.type === "income" ? "+" : "−"} {money(x.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <dl className="mt-3 ml-auto grid max-w-xs gap-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-600">{t("print.fin.totalCost")}</dt>
                    <dd className="font-semibold tabular-nums">{money(totalCost)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-600">{t("print.fin.income")}</dt>
                    <dd className="font-semibold tabular-nums">{money(income)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-stone-300 pt-1">
                    <dt className="font-semibold text-stone-800">{t("print.fin.net")}</dt>
                    <dd className={`font-bold tabular-nums ${income - totalCost < 0 ? "text-red-700" : "text-emerald-700"}`}>{money(income - totalCost)}</dd>
                  </div>
                </dl>
                {sales.some((s) => Number(s.paid_amount) < Number(s.amount)) && (
                  <p className="mt-2 text-right text-xs text-stone-500">
                    {sales.filter((s) => Number(s.paid_amount) < Number(s.amount)).map((s) => t("print.fin.paid", { paid: money(Number(s.paid_amount)), amount: money(Number(s.amount)) })).join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-stone-500">{t("print.financeNote")}</p>
              </>
            )}
          </Section>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-3 text-center text-xs text-stone-500">{t("print.footer", { farm: farm.name })}</footer>
      </article>
    </div>
  );
}
