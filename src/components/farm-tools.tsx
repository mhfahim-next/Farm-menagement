"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { MessageKey } from "@/lib/i18n/core";
import type { ToolSlug } from "@/lib/tool-list";
import {
  convertUnit,
  dairyRation,
  doseFor,
  FEEDS,
  leastCostRation,
  RATION_FEEDS,
  fatteningRation,
  fodderPlan,
  meatValue,
  milkPrice,
  mixFor,
  poultryFeed,
  pregnancyDates,
  tapeWeightKg,
  TOOL_DEFAULTS,
  unitGroups,
  type BirdKind,
  type FeedId,
  type RationAnimal,
  type Ingredient,
  type LengthUnit,
  type Species,
  type ToolParams,
  type UnitGroup,
} from "@/lib/tools";
import type { ActionState } from "@/lib/types";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";
import { DateInput } from "@/components/date-input";

/** A typed number: Bangla digits and a decimal comma work too. */
const num = (v: string) => {
  const s = v.trim().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(",", ".");
  return s === "" ? NaN : Number(s);
};

function NumberBox({ label, value, onChange, testId, hint }: { label: string; value: string; onChange: (v: string) => void; testId: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
    </Field>
  );
}

function Choice<T extends string>({ label, value, options, onChange, testId }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; testId: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            data-testid={`${testId}-${o.value}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${value === o.value ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <section aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" data-testid="tool-result">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">{t("tools.result")}</h2>
      {children}
    </section>
  );
}

function Empty() {
  const { t } = useI18n();
  return <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">{t("tools.fillIn")}</p>;
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-emerald-900/80">{k}</dt>
          <dd className="text-right font-semibold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------- tools

function WeightTool({ animals, saveWeight, today, p }: { animals?: { id: string; label: string }[]; saveWeight?: (s: ActionState, f: FormData) => Promise<ActionState>; today?: string; p: ToolParams["weight"] }) {
  const { t, f } = useI18n();
  const [unit, setUnit] = useState<LengthUnit>("cm");
  const [girth, setGirth] = useState("");
  const [length, setLength] = useState("");
  const r = tapeWeightKg(num(girth), num(length), unit, p);
  const toCm = (v: string) => String(Math.round(num(v) * (unit === "in" ? 2.54 : 1) * 10) / 10);
  return (
    <div className="grid gap-4">
      <Card2 title={t("tools.weight.howTitle")}>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>{t("tools.weight.how1")}</li>
          <li>{t("tools.weight.how2")}</li>
          <li>{t("tools.weight.how3")}</li>
        </ol>
      </Card2>
      <Choice label={t("tools.weight.unit")} value={unit} onChange={setUnit} testId="unit" options={[{ value: "cm", label: t("tools.unit.cm") }, { value: "in", label: t("tools.unit.inch") }]} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberBox label={`${t("tools.weight.girth")} (${unit === "cm" ? t("tools.unit.cm") : t("tools.unit.inch")})`} value={girth} onChange={setGirth} testId="girth" />
        <NumberBox label={`${t("tools.weight.length")} (${unit === "cm" ? t("tools.unit.cm") : t("tools.unit.inch")})`} value={length} onChange={setLength} testId="length" />
      </div>
      {r ? (
        <Result>
          <p className="text-3xl font-bold" data-testid="weight-kg">
            {t("tools.weight.kg", { kg: f.number(r.kg, 1) })}
          </p>
          <p className="mt-1 text-sm">{t("tools.weight.range", { low: f.number(r.low, 0), high: f.number(r.high, 0) })}</p>
          <p className="mt-2 text-xs text-emerald-900/70">{t("tools.weight.formula", { divisor: f.number(p.divisor) })}</p>
          {saveWeight && animals && animals.length > 0 && (
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <ActionForm action={saveWeight} submitLabel={t("tools.weight.save")} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <input type="hidden" name="method" value="tape" />
                <input type="hidden" name="weigh_date" value={today} />
                <input type="hidden" name="heart_girth_cm" value={toCm(girth)} />
                <input type="hidden" name="body_length_cm" value={toCm(length)} />
                <Field label={t("tools.weight.pick")}>
                  <Select name="cattle_id" options={animals.map((a) => ({ value: a.id, label: a.label }))} data-testid="weight-animal" />
                </Field>
              </ActionForm>
            </div>
          )}
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function Card2({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <h2 className="mb-2 text-sm font-semibold text-stone-800">{title}</h2>
      {children}
    </section>
  );
}

function RationTool({ p }: { p: ToolParams }) {
  const { t, f } = useI18n();
  const [kind, setKind] = useState<"dairy" | "fattening">("dairy");
  const [weight, setWeight] = useState("");
  const [milk, setMilk] = useState("");
  const [fat, setFat] = useState("4");
  const [gain, setGain] = useState("0.8");
  const [mixKg, setMixKg] = useState("100");
  const [prices, setPrices] = useState<Partial<Record<Ingredient, string>>>({});
  const r = kind === "dairy" ? dairyRation(num(weight), Number.isNaN(num(milk)) ? 0 : num(milk), num(fat) || 4, p.ration) : fatteningRation(num(weight), num(gain), p.ration);
  const priceNums = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, num(v ?? "")]).filter(([, v]) => Number.isFinite(v as number))) as Partial<Record<Ingredient, number>>;
  const total = num(mixKg) > 0 ? num(mixKg) : 100;
  const mix = mixFor(kind, total, priceNums, p);
  const kg = (v: number) => `${f.number(v, 1)} ${t("tools.unit.kg")}`;
  return (
    <div className="grid gap-4">
      <Choice label={t("tools.ration.kind")} value={kind} onChange={setKind} testId="ration-kind" options={[{ value: "dairy", label: t("tools.ration.dairy") }, { value: "fattening", label: t("tools.ration.fattening") }]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberBox label={t("tools.ration.weight")} value={weight} onChange={setWeight} testId="ration-weight" />
        {kind === "dairy" ? (
          <>
            <NumberBox label={t("tools.ration.milk")} value={milk} onChange={setMilk} testId="ration-milk" />
            <NumberBox label={t("tools.ration.fat")} value={fat} onChange={setFat} testId="ration-fat" />
          </>
        ) : (
          <NumberBox label={t("tools.ration.gain")} value={gain} onChange={setGain} testId="ration-gain" />
        )}
      </div>
      {r ? (
        <Result>
          <p className="mb-2 text-sm font-medium">{t("tools.ration.perDay")}</p>
          <Rows
            rows={[
              [t("tools.ration.concentrate"), kg(r.concentrateKg)],
              [t("tools.ration.green"), kg(r.greenGrassKg)],
              [t("tools.ration.straw"), kg(r.strawKg)],
              [t("tools.ration.water"), `${f.number(r.waterL)} L`],
              [t("tools.ration.salt"), `${f.number(r.saltG)} g`],
              [t("tools.ration.mineral"), `${f.number(r.mineralG)} g`],
            ]}
          />
          <p className="mt-2 text-xs text-emerald-900/70">{t("tools.ration.dm", { kg: f.number(r.dryMatterKg, 1) })}</p>
          {mix.costPerKg !== null && <p className="mt-2 text-sm font-semibold">{t("tools.ration.dailyCost", { amount: f.money(Math.round(mix.costPerKg * r.concentrateKg), "BDT") })}</p>}
        </Result>
      ) : (
        <Empty />
      )}
      <Card2 title={t("tools.ration.mixTitle")}>
        <div className="mb-3 max-w-40">
          <NumberBox label={t("tools.ration.mixKg")} value={mixKg} onChange={setMixKg} testId="mix-kg" />
        </div>
        <div className="grid gap-2">
          {mix.rows.map((row) => (
            <div key={row.ingredient} className="grid grid-cols-[1fr_auto_7rem] items-center gap-3 text-sm">
              <span>
                {t(`tools.ing.${row.ingredient}` as MessageKey)} <span className="text-stone-500">· {f.number(row.pct)}%</span>
              </span>
              <span className="font-semibold tabular-nums" data-testid={`mix-${row.ingredient}`}>
                {kg(row.kg)}
              </span>
              <Input
                inputMode="decimal"
                placeholder="৳/kg"
                aria-label={`${t(`tools.ing.${row.ingredient}` as MessageKey)} ${t("tools.ration.price")}`}
                value={prices[row.ingredient] ?? ""}
                onChange={(e) => setPrices((p) => ({ ...p, [row.ingredient]: e.target.value }))}
                data-testid={`price-${row.ingredient}`}
              />
            </div>
          ))}
        </div>
        {mix.costPerKg !== null && mix.cost !== null && (
          <p className="mt-3 text-sm font-semibold" data-testid="mix-cost">
            {t("tools.ration.costPerKg", { amount: f.moneyExact(mix.costPerKg, "BDT") })} · {t("tools.ration.costTotal", { kg: f.number(total), amount: f.money(mix.cost, "BDT") })}
          </p>
        )}
      </Card2>
    </div>
  );
}

/** Feeds ticked at first: what most Bangladeshi cattle farms have. */
const LCR_START: FeedId[] = ["rice_straw", "napier", "wheat_bran", "maize", "mustard_cake"];
const LCR_STORE = "ff.lcr.v1";
type LcrFeedState = { on: boolean; price: string; max: string };

function LeastCostTool({ p }: { p: ToolParams["feedPrice"] }) {
  const { t, f } = useI18n();
  const [kind, setKind] = useState<RationAnimal["kind"]>("milking");
  const [weight, setWeight] = useState("");
  const [milk, setMilk] = useState("");
  const [fat, setFat] = useState("4");
  const [gain, setGain] = useState("0.8");
  const [pregnant, setPregnant] = useState(false);
  const [feeds, setFeeds] = useState<Record<FeedId, LcrFeedState>>(
    () => Object.fromEntries(RATION_FEEDS.map((id) => [id, { on: LCR_START.includes(id), price: String(p[id]), max: "" }])) as Record<FeedId, LcrFeedState>,
  );
  // The farmer's own feeds and prices are remembered on this device.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LCR_STORE) ?? "null") as Partial<Record<FeedId, LcrFeedState>> | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount (no localStorage on the server)
      if (saved) setFeeds((cur) => Object.fromEntries(RATION_FEEDS.map((id) => [id, { ...cur[id], ...(saved[id] ?? {}) }])) as Record<FeedId, LcrFeedState>);
    } catch {}
  }, []);
  const change = (id: FeedId, patch: Partial<LcrFeedState>) =>
    setFeeds((cur) => {
      const next = { ...cur, [id]: { ...cur[id], ...patch } };
      try {
        localStorage.setItem(LCR_STORE, JSON.stringify(next));
      } catch {}
      return next;
    });
  const choices = RATION_FEEDS.filter((id) => feeds[id].on && Number.isFinite(num(feeds[id].price))).map((id) => ({
    id,
    price: num(feeds[id].price),
    maxKg: Number.isFinite(num(feeds[id].max)) ? num(feeds[id].max) : undefined,
  }));
  const animal: RationAnimal = { kind, weightKg: num(weight), milkL: Number.isNaN(num(milk)) ? 0 : num(milk), fatPct: num(fat) || 4, gainKg: Number.isNaN(num(gain)) ? 0 : num(gain), pregnant };
  const r = leastCostRation(animal, choices);
  const kg = (v: number) => `${f.number(v, 1)} ${t("tools.unit.kg")}`;
  const feedRow = (id: FeedId) => (
    <div key={id} className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 text-sm">
      <label className="flex min-w-0 items-center gap-2">
        <input type="checkbox" checked={feeds[id].on} onChange={(e) => change(id, { on: e.target.checked })} data-testid={`lcr-on-${id}`} />
        <span className="truncate">{t(`tools.feed.${id}` as MessageKey)}</span>
      </label>
      <Input inputMode="decimal" aria-label={`${t(`tools.feed.${id}` as MessageKey)} ${t("tools.lcr.price")}`} value={feeds[id].price} onChange={(e) => change(id, { price: e.target.value })} disabled={!feeds[id].on} data-testid={`lcr-price-${id}`} />
      <Input inputMode="decimal" aria-label={`${t(`tools.feed.${id}` as MessageKey)} ${t("tools.lcr.max")}`} placeholder="—" value={feeds[id].max} onChange={(e) => change(id, { max: e.target.value })} disabled={!feeds[id].on} data-testid={`lcr-max-${id}`} />
    </div>
  );
  const group = (rough: boolean) => (
    <div className="grid gap-2">
      <div className="grid grid-cols-[1fr_5.5rem_5.5rem] gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <span>{t(rough ? "tools.lcr.rough" : "tools.lcr.conc")}</span>
        <span>{t("tools.lcr.price")}</span>
        <span>{t("tools.lcr.max")}</span>
      </div>
      {RATION_FEEDS.filter((id) => FEEDS[id].rough === rough).map(feedRow)}
    </div>
  );
  return (
    <div className="grid gap-4">
      <Choice
        label={t("tools.lcr.kind")}
        value={kind}
        onChange={setKind}
        testId="lcr-kind"
        options={(["milking", "dry", "growing"] as const).map((k) => ({ value: k, label: t(`tools.lcr.${k}`) }))}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberBox label={t("tools.ration.weight")} value={weight} onChange={setWeight} testId="lcr-weight" />
        {kind === "milking" && (
          <>
            <NumberBox label={t("tools.ration.milk")} value={milk} onChange={setMilk} testId="lcr-milk" />
            <NumberBox label={t("tools.ration.fat")} value={fat} onChange={setFat} testId="lcr-fat" />
          </>
        )}
        {kind === "growing" && <NumberBox label={t("tools.ration.gain")} value={gain} onChange={setGain} testId="lcr-gain" />}
      </div>
      {kind !== "growing" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} data-testid="lcr-pregnant" /> {t("tools.lcr.pregnant")}
        </label>
      )}
      <Card2 title={t("tools.lcr.feedsTitle")}>
        <p className="mb-3 text-xs text-stone-600">{t("tools.lcr.feedsHint")}</p>
        <div className="grid gap-4">
          {group(true)}
          {group(false)}
        </div>
      </Card2>
      {!r ? (
        <Empty />
      ) : r.error ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" data-testid="lcr-error">
          {t(r.error === "noFeeds" ? "tools.lcr.noFeeds" : "tools.lcr.noRoughage")}
        </p>
      ) : (
        <Result>
          <p className="mb-2 text-sm font-medium">{t("tools.lcr.perDay")}</p>
          <table className="w-full text-sm" data-testid="lcr-table">
            <thead>
              <tr className="text-left text-xs text-emerald-900/70">
                <th className="py-1 font-medium">{t("tools.lcr.feed")}</th>
                <th className="py-1 text-right font-medium">{t("tools.lcr.kg")}</th>
                <th className="py-1 text-right font-medium">{t("tools.lcr.cost")}</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((it) => (
                <tr key={it.id} className="border-t border-emerald-200" data-testid={`lcr-row-${it.id}`}>
                  <td className="py-1.5">{t(`tools.feed.${it.id}` as MessageKey)}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{kg(it.kg)}</td>
                  <td className="py-1.5 text-right tabular-nums">{f.money(Math.round(it.cost), "BDT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-lg font-bold" data-testid="lcr-cost">
            {t("tools.lcr.costDay", { amount: f.money(r.costDay, "BDT") })}
          </p>
          {r.costPerLitre !== null && <p className="text-sm font-semibold">{t("tools.lcr.costLitre", { amount: f.moneyExact(r.costPerLitre, "BDT") })}</p>}
          {(r.short.cp > 0 || r.short.tdn > 0 || r.short.dm > 0) && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" data-testid="lcr-short">
              <p className="font-semibold">{t("tools.lcr.shortTitle")}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {r.short.cp > 0 && <li>{t("tools.lcr.shortProtein", { g: f.number(Math.round(r.short.cp * 1000)) })}</li>}
                {r.short.tdn > 0 && <li>{t("tools.lcr.shortEnergy", { kg: f.number(r.short.tdn, 2) })}</li>}
                {r.short.dm > 0 && <li>{t("tools.lcr.shortDm", { kg: f.number(r.short.dm, 1) })}</li>}
              </ul>
            </div>
          )}
          <h3 className="mt-4 text-sm font-semibold">{t("tools.lcr.checkTitle")}</h3>
          <Rows
            rows={[
              [t("tools.lcr.energy"), t("tools.lcr.gets", { have: f.number(r.supply.tdn, 2), need: f.number(r.need.tdn, 2) })],
              [t("tools.lcr.protein"), t("tools.lcr.gets", { have: f.number(r.supply.cp, 2), need: f.number(r.need.cp, 2) })],
              [t("tools.lcr.dm"), t("tools.lcr.dmRange", { have: f.number(r.supply.dm, 1), low: f.number(r.need.dmMin, 1), high: f.number(r.need.dmMax, 1) })],
              [t("tools.lcr.roughShare"), t("tools.lcr.roughPct", { have: f.number(r.supply.roughPct), min: f.number(r.need.roughMin) })],
            ]}
          />
          <p className="mt-3 text-sm">{t("tools.lcr.extras", { water: f.number(r.waterL), salt: f.number(r.saltG), mineral: f.number(r.mineralG) })}</p>
          {r.mix.length > 1 && (
            <div className="mt-4 border-t border-emerald-200 pt-3" data-testid="lcr-mix">
              <h3 className="text-sm font-semibold">{t("tools.lcr.mixTitle")}</h3>
              <p className="mb-2 text-xs text-emerald-900/70">{t("tools.lcr.mixHint", { kg: f.number(r.concentrateKg, 1) })}</p>
              <Rows rows={r.mix.map((m) => [t(`tools.feed.${m.id}` as MessageKey), `${f.number(m.pct, 1)}% · ${kg(m.pct)} / 100 ${t("tools.unit.kg")}`])} />
            </div>
          )}
        </Result>
      )}
      <p className="text-xs text-stone-500">{t("tools.lcr.how")}</p>
    </div>
  );
}

function PoultryTool({ p }: { p: ToolParams["poultry"] }) {
  const { t, f } = useI18n();
  const [kind, setKind] = useState<BirdKind>("layer");
  const [birds, setBirds] = useState("");
  const [age, setAge] = useState("");
  const [price, setPrice] = useState("");
  const [hot, setHot] = useState(false);
  const r = poultryFeed(kind, num(birds), num(age), { bagPrice: num(price), hot }, p);
  return (
    <div className="grid gap-4">
      <Choice label={t("tools.poultry.kind")} value={kind} onChange={setKind} testId="bird-kind" options={(["layer", "broiler", "sonali"] as const).map((k) => ({ value: k, label: t(`tools.poultry.${k}`) }))} />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberBox label={t("tools.poultry.birds")} value={birds} onChange={setBirds} testId="birds" />
        <NumberBox label={t("tools.poultry.age")} value={age} onChange={setAge} testId="age" />
        <NumberBox label={t("tools.poultry.bagPrice", { kg: f.number(p.bagKg) })} value={price} onChange={setPrice} testId="bag-price" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} data-testid="hot" /> {t("tools.poultry.hot")}
      </label>
      {r ? (
        <Result>
          <p className="mb-2 text-sm">{t("tools.poultry.perBird", { g: f.number(r.gPerBird), week: f.number(r.week) })}</p>
          <Rows
            rows={[
              [t("tools.poultry.feedDay"), `${f.number(r.kgPerDay, 1)} ${t("tools.unit.kg")}`],
              [t("tools.poultry.waterDay"), `${f.number(r.waterLPerDay, 1)} L`],
              [t("tools.poultry.bags"), f.number(r.bagsPerMonth, 1)],
              ...(r.costPerDay !== null && r.costPerMonth !== null
                ? ([
                    [t("tools.poultry.costDay"), f.money(r.costPerDay, "BDT")],
                    [t("tools.poultry.costMonth"), f.money(r.costPerMonth, "BDT")],
                  ] as [string, string][])
                : []),
            ]}
          />
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function PregTool({ today, p }: { today: string; p: ToolParams }) {
  const { t, f } = useI18n();
  const [species, setSpecies] = useState<Species>("cattle");
  const [date, setDate] = useState(today);
  const r = pregnancyDates(species, date, today, undefined, p);
  const when = (d: string) => {
    const n = Math.round((Date.parse(d) - Date.parse(today)) / 86_400_000);
    return `${f.date(d)} · ${n >= 0 ? t("tools.preg.left", { n: f.number(n) }) : t("tools.preg.past", { n: f.number(-n) })}`;
  };
  return (
    <div className="grid gap-4">
      <Choice label={t("tools.preg.species")} value={species} onChange={setSpecies} testId="species" options={(["cattle", "buffalo", "goat", "sheep"] as const).map((k) => ({ value: k, label: t(`tools.preg.${k}`) }))} />
      <div className="max-w-xs">
        <Field label={t("tools.preg.date")}>
          <DateInput value={date} onChange={setDate} data-testid="bred-on" />
        </Field>
      </div>
      {r ? (
        <Result>
          <Rows
            rows={[
              [t("tools.preg.nextHeat"), when(r.nextHeat)],
              [t("tools.preg.check"), when(r.check)],
              ...(species === "cattle" || species === "buffalo" ? ([[t("tools.preg.dryOff"), when(r.dryOff)]] as [string, string][]) : []),
              [t("tools.preg.due"), when(r.due)],
            ]}
          />
          <p className="mt-2 text-xs text-emerald-900/70" data-testid="gestation">
            {t("tools.preg.gestation", { n: f.number(r.gestation) })}
          </p>
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function QurbaniTool({ p }: { p: ToolParams["meat"] }) {
  const { t, f } = useI18n();
  const [species, setSpecies] = useState<"cattle" | "goat">("cattle");
  const [live, setLive] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const r = meatValue(species, num(live), num(price) || undefined, Number.isNaN(num(cost)) ? undefined : num(cost), p);
  return (
    <div className="grid gap-4">
      <Choice label={t("tools.qurbani.species")} value={species} onChange={setSpecies} testId="q-species" options={[{ value: "cattle", label: t("tools.qurbani.cattle") }, { value: "goat", label: t("tools.qurbani.goat") }]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberBox label={t("tools.qurbani.live")} value={live} onChange={setLive} testId="live" hint={t("tools.weight.short")} />
        <NumberBox label={t("tools.qurbani.price")} value={price} onChange={setPrice} testId="price" />
        <NumberBox label={t("tools.qurbani.cost")} value={cost} onChange={setCost} testId="cost" />
      </div>
      {r ? (
        <Result>
          <p className="mb-2 text-lg font-semibold" data-testid="carcass">
            {t("tools.qurbani.carcass", { low: f.number(r.carcassLow), high: f.number(r.carcassHigh) })}
          </p>
          <Rows
            rows={[
              ...(r.pricePerLiveKg !== null ? ([[t("tools.qurbani.perLive"), f.money(r.pricePerLiveKg, "BDT")]] as [string, string][]) : []),
              ...(r.pricePerMeatKg !== null ? ([[t("tools.qurbani.perMeat"), f.money(r.pricePerMeatKg, "BDT")]] as [string, string][]) : []),
              ...(r.profit !== null ? ([[t("tools.qurbani.profit"), f.money(r.profit, "BDT")]] as [string, string][]) : []),
            ]}
          />
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function UnitsTool({ p }: { p: ToolParams["units"] }) {
  const { t, f } = useI18n();
  const [group, setGroup] = useState<UnitGroup>("weight");
  const units = Object.keys(unitGroups(p)[group]);
  const [from, setFrom] = useState("maund");
  const [to, setTo] = useState("kg");
  const [value, setValue] = useState("1");
  const pick = (g: UnitGroup) => {
    setGroup(g);
    setFrom(g === "weight" ? "maund" : g === "count" ? "tray" : g === "length" ? "inch" : "bigha");
    setTo(g === "weight" ? "kg" : g === "count" ? "piece" : g === "length" ? "cm" : "decimal");
  };
  const res = units.includes(from) && units.includes(to) ? convertUnit(group, num(value), from as never, to as never, p) : null;
  const label = (u: string) => t(`tools.unit.${u}` as MessageKey);
  return (
    <div className="grid gap-4">
      <Choice label={t("tools.units.group")} value={group} onChange={pick} testId="group" options={(["weight", "count", "length", "land"] as const).map((g) => ({ value: g, label: t(`tools.units.${g}`) }))} />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberBox label={t("tools.units.value")} value={value} onChange={setValue} testId="u-value" />
        <Field label={t("tools.units.from")}>
          <Select value={from} onChange={(e) => setFrom(e.target.value)} options={units.map((u) => ({ value: u, label: label(u) }))} data-testid="u-from" />
        </Field>
        <Field label={t("tools.units.to")}>
          <Select value={to} onChange={(e) => setTo(e.target.value)} options={units.map((u) => ({ value: u, label: label(u) }))} data-testid="u-to" />
        </Field>
      </div>
      {res !== null ? (
        <Result>
          <p className="text-2xl font-bold" data-testid="u-result">
            {f.number(num(value), 3)} {label(from)} = {f.number(res, 3)} {label(to)}
          </p>
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function DoseTool({ p }: { p: ToolParams["dose"] }) {
  const { t, f } = useI18n();
  const [weight, setWeight] = useState("");
  const [mgPerKg, setMgPerKg] = useState("");
  const [form, setForm] = useState<"liquid" | "tablet">("liquid");
  const [strength, setStrength] = useState("");
  const r = doseFor(num(weight), num(mgPerKg), form === "liquid" ? { mgPerMl: num(strength) } : { mgPerTablet: num(strength) }, p);
  return (
    <div className="grid gap-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">⚠️ {t("tools.dose.warning")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberBox label={t("tools.dose.weight")} value={weight} onChange={setWeight} testId="d-weight" />
        <NumberBox label={t("tools.dose.mgPerKg")} value={mgPerKg} onChange={setMgPerKg} testId="d-mgkg" />
      </div>
      <Choice label={t("tools.dose.form")} value={form} onChange={setForm} testId="d-form" options={[{ value: "liquid", label: t("tools.dose.liquid") }, { value: "tablet", label: t("tools.dose.tablet") }]} />
      <div className="max-w-xs">
        <NumberBox label={form === "liquid" ? t("tools.dose.mgPerMl") : t("tools.dose.mgPerTablet")} value={strength} onChange={setStrength} testId="d-strength" />
      </div>
      {r ? (
        <Result>
          {r.ml !== null && (
            <p className="text-3xl font-bold" data-testid="d-result">
              {t("tools.dose.ml", { ml: f.number(r.ml, 1) })}
            </p>
          )}
          {r.tablets !== null && (
            <p className="text-3xl font-bold" data-testid="d-result">
              {t("tools.dose.tablets", { n: f.number(r.tablets, 2) })}
            </p>
          )}
          <p className="mt-1 text-sm">{t("tools.dose.total", { mg: f.number(r.mg, 1) })}</p>
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function FodderTool({ p }: { p: ToolParams["fodder"] }) {
  const { t, f } = useI18n();
  const [animals, setAnimals] = useState("");
  const [kgDay, setKgDay] = useState(String(p.kgPerDay));
  const [yieldT, setYieldT] = useState(String(p.tonnesPerAcre));
  const [days, setDays] = useState("");
  const r = fodderPlan(num(animals), num(kgDay), num(yieldT), Number.isNaN(num(days)) ? 0 : num(days), p);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberBox label={t("tools.fodder.animals")} value={animals} onChange={setAnimals} testId="f-animals" />
        <NumberBox label={t("tools.fodder.kgDay")} value={kgDay} onChange={setKgDay} testId="f-kg" />
        <NumberBox label={t("tools.fodder.yield")} value={yieldT} onChange={setYieldT} testId="f-yield" />
        <NumberBox label={t("tools.fodder.silageDays")} value={days} onChange={setDays} testId="f-days" />
      </div>
      {r ? (
        <Result>
          <Rows
            rows={[
              [t("tools.fodder.year"), t("tools.fodder.tonnes", { n: f.number(r.tonnesPerYear, 1) })],
              [t("tools.fodder.land"), t("tools.fodder.decimals", { n: f.number(r.decimals) })],
              ...(r.silageKg > 0 ? ([[t("tools.fodder.silage"), `${f.number(r.silageKg)} ${t("tools.unit.kg")}`]] as [string, string][]) : []),
            ]}
          />
          {r.silageKg > 0 && <p className="mt-2 text-xs text-emerald-900/70">{t("tools.fodder.space", { m3: f.number(r.silageM3, 1) })}</p>}
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function MilkTool({ p }: { p: ToolParams["milk"] }) {
  const { t, f } = useI18n();
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState(String(p.snf));
  const [fatRate, setFatRate] = useState(String(p.fatRate));
  const [snfRate, setSnfRate] = useState(String(p.snfRate));
  const [litres, setLitres] = useState("");
  const r = milkPrice(num(fat), num(snf), num(fatRate), num(snfRate), num(litres) || 0, p);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberBox label={t("tools.milk.fat")} value={fat} onChange={setFat} testId="m-fat" />
        <NumberBox label={t("tools.milk.snf")} value={snf} onChange={setSnf} testId="m-snf" />
        <NumberBox label={t("tools.milk.fatRate")} value={fatRate} onChange={setFatRate} testId="m-fatrate" />
        <NumberBox label={t("tools.milk.snfRate")} value={snfRate} onChange={setSnfRate} testId="m-snfrate" />
        <NumberBox label={t("tools.milk.litres")} value={litres} onChange={setLitres} testId="m-litres" />
      </div>
      {r ? (
        <Result>
          <p className="text-sm">{t("tools.milk.perLitre")}</p>
          <p className="text-3xl font-bold" data-testid="m-result">
            {f.moneyExact(r.perLitre, "BDT")}
          </p>
          <p className="mt-1 text-xs text-emerald-900/70">{t("tools.milk.perKg", { amount: f.moneyExact(r.perKg, "BDT") })}</p>
          {r.total !== null && (
            <p className="mt-2 font-semibold">
              {t("tools.milk.total")}: {f.money(r.total, "BDT")}
            </p>
          )}
        </Result>
      ) : (
        <Empty />
      )}
    </div>
  );
}

/**
 * One tool by its slug. In the dashboard, the weight tool can save the result to an animal.
 * `params` are the numbers to calculate with (defaults plus a super admin's changes).
 */
export function FarmTool({
  slug,
  today,
  params = TOOL_DEFAULTS,
  animals,
  saveWeight,
}: {
  slug: ToolSlug;
  today: string;
  params?: ToolParams;
  animals?: { id: string; label: string }[];
  saveWeight?: (s: ActionState, f: FormData) => Promise<ActionState>;
}) {
  const { t } = useI18n();
  const body = (() => {
    switch (slug) {
      case "cattle-weight":
        return <WeightTool animals={animals} saveWeight={saveWeight} today={today} p={params.weight} />;
      case "least-cost-ration":
        return <LeastCostTool p={params.feedPrice} />;
      case "feed-ration":
        return <RationTool p={params} />;
      case "poultry-feed":
        return <PoultryTool p={params.poultry} />;
      case "calving-date":
        return <PregTool today={today} p={params} />;
      case "qurbani-price":
        return <QurbaniTool p={params.meat} />;
      case "unit-converter":
        return <UnitsTool p={params.units} />;
      case "medicine-dose":
        return <DoseTool p={params.dose} />;
      case "fodder-land":
        return <FodderTool p={params.fodder} />;
      case "milk-price":
        return <MilkTool p={params.milk} />;
    }
  })();
  return (
    <div className="grid gap-4" data-testid={`tool-${slug}`}>
      {body}
      <p className="text-xs text-stone-500">{t("tools.estimate")}</p>
    </div>
  );
}
