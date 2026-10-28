import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Checkbox, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { AnimalPicker, ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { isStaff, useAnimals, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useDescribe } from "@/lib/describe";
import { parseNumber } from "@/lib/entries";
import type { MessageKey } from "@/lib/i18n/en";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import type { ToolSlug } from "@/lib/tool-list";
import {
  convertUnit,
  dairyRation,
  doseFor,
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
  type Ingredient,
  type LengthUnit,
  type Species,
  type ToolParams,
  type UnitGroup,
} from "@/lib/tools";

/** A typed number (Bangla digits work); NaN when empty or not a number. */
const num = (v: string) => parseNumber(v) ?? NaN;

function Result({ children }: { children: ReactNode }) {
  const { t } = usePrefs();
  const theme = useTheme();
  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]} testID="tool-result">
      <Card.Content style={{ gap: 6 }}>
        <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>
          {t("tools.result")}
        </Text>
        {children}
      </Card.Content>
    </Card>
  );
}

function Empty() {
  const { t } = usePrefs();
  const theme = useTheme();
  return <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("tools.fillIn")}</Text>;
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <View style={{ gap: 4 }}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text variant="bodyMedium" style={styles.flex}>
            {k}
          </Text>
          <Text variant="titleSmall">{v}</Text>
        </View>
      ))}
    </View>
  );
}

function Big({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Text variant="headlineMedium" testID={testID}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------- 1. weight

function WeightTool({ p }: { p: ToolParams["weight"] }) {
  const { t, n } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const farm = current?.farm;
  const keeps = Boolean(farm?.has_dairy || farm?.has_fattening || farm?.has_goat);
  const { data: animals } = useAnimals(keeps && isStaff(current?.role) ? farm?.id : undefined);
  const describe = useDescribe(useOptions());
  const [unit, setUnit] = useState<LengthUnit>("cm");
  const [girth, setGirth] = useState("");
  const [length, setLength] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const r = tapeWeightKg(num(girth), num(length), unit, p);
  const active = (animals ?? []).filter((a) => a.status === "active");
  const cm = (v: string) => String(Math.round(num(v) * (unit === "in" ? 2.54 : 1) * 10) / 10);
  const save = () => {
    const a = active.find((x) => x.id === picked[0]);
    if (!a || !r) return;
    const cattle = (a.species ?? "cattle") === "cattle";
    router.push({ pathname: "/record/weight", params: cattle ? { animal: a.id, girth: cm(girth), length: cm(length) } : { animal: a.id, kg: String(r.kg) } });
  };
  return (
    <>
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={t("tools.weight.howTitle")} titleVariant="titleSmall" />
        <Card.Content style={{ gap: 4 }}>
          {(["how1", "how2", "how3"] as const).map((k, i) => (
            <Text key={k} variant="bodyMedium">{`${i + 1}. ${t(`tools.weight.${k}`)}`}</Text>
          ))}
        </Card.Content>
      </Card>
      <Label>{t("tools.weight.unit")}</Label>
      <SegmentedButtons
        value={unit}
        onValueChange={(v) => setUnit(v as LengthUnit)}
        buttons={[
          { value: "cm", label: t("tools.unit.cm"), testID: "unit-cm" },
          { value: "in", label: t("tools.unit.inch"), testID: "unit-in" },
        ]}
      />
      <NumberField label={t("tools.weight.girth")} value={girth} onChange={setGirth} affix={unit === "cm" ? t("tools.unit.cm") : t("tools.unit.inch")} testID="girth" />
      <NumberField label={t("tools.weight.length")} value={length} onChange={setLength} affix={unit === "cm" ? t("tools.unit.cm") : t("tools.unit.inch")} testID="length" />
      {r ? (
        <Result>
          <Big testID="weight-kg">{t("tools.weight.kg", { kg: n(r.kg, 1) })}</Big>
          <Text variant="bodyMedium">{t("tools.weight.range", { low: n(r.low), high: n(r.high) })}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
            {t("tools.weight.formula", { divisor: n(p.divisor) })}
          </Text>
        </Result>
      ) : (
        <Empty />
      )}
      {r && active.length > 0 && (
        <Card mode="outlined" style={styles.card}>
          <Card.Title title={t("tools.saveTo")} subtitle={t("tools.pickAnimal")} titleVariant="titleSmall" />
          <Card.Content style={{ gap: 8 }}>
            <AnimalPicker animals={active} selected={picked} onChange={setPicked} multi={false} describe={describe} />
            <Button mode="contained" icon="content-save-outline" disabled={!picked.length} onPress={save} testID="weight-save-to">
              {t("tools.weight.save")}
            </Button>
          </Card.Content>
        </Card>
      )}
    </>
  );
}

// ---------------------------------------------------------------- 2. ration

function RationTool({ p }: { p: ToolParams }) {
  const { t, n, money } = usePrefs();
  const [kind, setKind] = useState<"dairy" | "fattening">("dairy");
  const [weight, setWeight] = useState("");
  const [milk, setMilk] = useState("");
  const [fat, setFat] = useState("4");
  const [gain, setGain] = useState("0.8");
  const [mixKg, setMixKg] = useState("100");
  const [prices, setPrices] = useState<Partial<Record<Ingredient, string>>>({});
  const milkL = Number.isNaN(num(milk)) ? 0 : num(milk);
  const r = kind === "dairy" ? dairyRation(num(weight), milkL, num(fat) || 4, p.ration) : fatteningRation(num(weight), num(gain), p.ration);
  const priceNums = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, num(v ?? "")]).filter(([, v]) => Number.isFinite(v as number))) as Partial<Record<Ingredient, number>>;
  const total = num(mixKg) > 0 ? num(mixKg) : 100;
  const mix = mixFor(kind, total, priceNums, p);
  const kg = (v: number) => `${n(v, 1)} ${t("tools.unit.kg")}`;
  return (
    <>
      <SegmentedButtons
        value={kind}
        onValueChange={(v) => setKind(v as "dairy" | "fattening")}
        buttons={[
          { value: "dairy", label: t("tools.ration.dairy"), testID: "ration-dairy" },
          { value: "fattening", label: t("tools.ration.fattening"), testID: "ration-fattening" },
        ]}
      />
      <NumberField label={t("tools.ration.weight")} value={weight} onChange={setWeight} testID="ration-weight" />
      {kind === "dairy" ? (
        <>
          <NumberField label={t("tools.ration.milk")} value={milk} onChange={setMilk} testID="ration-milk" />
          <NumberField label={t("tools.ration.fat")} value={fat} onChange={setFat} testID="ration-fat" />
        </>
      ) : (
        <NumberField label={t("tools.ration.gain")} value={gain} onChange={setGain} testID="ration-gain" />
      )}
      {r ? (
        <Result>
          <Text variant="titleSmall">{t("tools.ration.perDay")}</Text>
          <Rows
            rows={[
              [t("tools.ration.concentrate"), kg(r.concentrateKg)],
              [t("tools.ration.green"), kg(r.greenGrassKg)],
              [t("tools.ration.straw"), kg(r.strawKg)],
              [t("tools.ration.water"), `${n(r.waterL)} L`],
              [t("tools.ration.salt"), `${n(r.saltG)} g`],
              [t("tools.ration.mineral"), `${n(r.mineralG)} g`],
            ]}
          />
          <Text variant="bodySmall">{t("tools.ration.dm", { kg: n(r.dryMatterKg, 1) })}</Text>
          {mix.costPerKg !== null && <Text variant="titleSmall">{t("tools.ration.dailyCost", { amount: money(Math.round(mix.costPerKg * r.concentrateKg), "BDT") })}</Text>}
        </Result>
      ) : (
        <Empty />
      )}
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={t("tools.ration.mixTitle")} titleVariant="titleSmall" />
        <Card.Content style={{ gap: 8 }}>
          <NumberField label={t("tools.ration.mixKg")} value={mixKg} onChange={setMixKg} testID="mix-kg" />
          {mix.rows.map((row) => (
            <View key={row.ingredient} style={styles.row}>
              <View style={styles.flex}>
                <Text variant="bodyMedium">{t(`tools.ing.${row.ingredient}` as MessageKey)}</Text>
                <Text variant="bodySmall" testID={`mix-${row.ingredient}`}>{`${n(row.pct)}% · ${kg(row.kg)}`}</Text>
              </View>
              <TextInput
                mode="outlined"
                dense
                keyboardType="decimal-pad"
                placeholder="৳/kg"
                value={prices[row.ingredient] ?? ""}
                onChangeText={(v) => setPrices((p) => ({ ...p, [row.ingredient]: v }))}
                style={styles.price}
                accessibilityLabel={`${t(`tools.ing.${row.ingredient}` as MessageKey)} ${t("tools.ration.price")}`}
                testID={`price-${row.ingredient}`}
              />
            </View>
          ))}
          {mix.costPerKg !== null && mix.cost !== null && (
            <Text variant="titleSmall" testID="mix-cost">
              {`${t("tools.ration.costPerKg", { amount: money(mix.costPerKg, "BDT") })} · ${t("tools.ration.costTotal", { kg: n(total), amount: money(mix.cost, "BDT") })}`}
            </Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------- 3. poultry

function PoultryTool({ p }: { p: ToolParams["poultry"] }) {
  const { t, n, money } = usePrefs();
  const [kind, setKind] = useState<BirdKind>("layer");
  const [birds, setBirds] = useState("");
  const [age, setAge] = useState("");
  const [price, setPrice] = useState("");
  const [hot, setHot] = useState(false);
  const r = poultryFeed(kind, num(birds), num(age), { bagPrice: num(price), hot }, p);
  return (
    <>
      <SegmentedButtons
        value={kind}
        onValueChange={(v) => setKind(v as BirdKind)}
        buttons={(["layer", "broiler", "sonali"] as const).map((k) => ({ value: k, label: t(`tools.poultry.${k}`), testID: `bird-${k}` }))}
      />
      <NumberField label={t("tools.poultry.birds")} value={birds} onChange={setBirds} testID="birds" />
      <NumberField label={t("tools.poultry.age")} value={age} onChange={setAge} testID="age" />
      <NumberField label={t("tools.poultry.bagPrice", { kg: n(p.bagKg) })} value={price} onChange={setPrice} testID="bag-price" />
      <Checkbox.Item label={t("tools.poultry.hot")} status={hot ? "checked" : "unchecked"} onPress={() => setHot(!hot)} mode="android" position="leading" testID="hot" />
      {r ? (
        <Result>
          <Text variant="bodyMedium">{t("tools.poultry.perBird", { g: n(r.gPerBird), week: n(r.week) })}</Text>
          <Rows
            rows={[
              [t("tools.poultry.feedDay"), `${n(r.kgPerDay, 1)} ${t("tools.unit.kg")}`],
              [t("tools.poultry.waterDay"), `${n(r.waterLPerDay, 1)} L`],
              [t("tools.poultry.bags"), n(r.bagsPerMonth, 1)],
              ...(r.costPerDay !== null && r.costPerMonth !== null
                ? ([
                    [t("tools.poultry.costDay"), money(r.costPerDay, "BDT")],
                    [t("tools.poultry.costMonth"), money(r.costPerMonth, "BDT")],
                  ] as [string, string][])
                : []),
            ]}
          />
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 4. pregnancy

function PregTool({ p }: { p: ToolParams }) {
  const { t, n, date: fmt } = usePrefs();
  const today = farmToday();
  const [species, setSpecies] = useState<Species>("cattle");
  const [date, setDate] = useState(today);
  const r = pregnancyDates(species, date, today, undefined, p);
  const when = (d: string) => {
    const days = Math.round((Date.parse(d) - Date.parse(today)) / 86_400_000);
    return `${fmt(d)} · ${days >= 0 ? t("tools.preg.left", { n: n(days) }) : t("tools.preg.past", { n: n(-days) })}`;
  };
  return (
    <>
      <ChoiceChips options={(["cattle", "buffalo", "goat", "sheep"] as const).map((k) => ({ value: k, label: t(`tools.preg.${k}`) }))} value={species} onChange={(v) => setSpecies(v as Species)} testID="species" />
      <DateField value={date} onChange={setDate} label={t("tools.preg.date")} testID="bred-on" />
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
          <Text variant="bodySmall" testID="gestation">
            {t("tools.preg.gestation", { n: n(r.gestation) })}
          </Text>
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 5. Qurbani

function QurbaniTool({ p }: { p: ToolParams["meat"] }) {
  const { t, n, money } = usePrefs();
  const [species, setSpecies] = useState<"cattle" | "goat">("cattle");
  const [live, setLive] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const r = meatValue(species, num(live), num(price) || undefined, Number.isNaN(num(cost)) ? undefined : num(cost), p);
  return (
    <>
      <SegmentedButtons
        value={species}
        onValueChange={(v) => setSpecies(v as "cattle" | "goat")}
        buttons={[
          { value: "cattle", label: t("tools.qurbani.cattle"), testID: "q-cattle" },
          { value: "goat", label: t("tools.qurbani.goat"), testID: "q-goat" },
        ]}
      />
      <NumberField label={t("tools.qurbani.live")} value={live} onChange={setLive} affix={t("tools.unit.kg")} testID="live" />
      <NumberField label={t("tools.qurbani.price")} value={price} onChange={setPrice} testID="price" />
      <NumberField label={t("tools.qurbani.cost")} value={cost} onChange={setCost} testID="cost" />
      {r ? (
        <Result>
          <Text variant="titleMedium" testID="carcass">
            {t("tools.qurbani.carcass", { low: n(r.carcassLow), high: n(r.carcassHigh) })}
          </Text>
          <Rows
            rows={[
              ...(r.pricePerLiveKg !== null ? ([[t("tools.qurbani.perLive"), money(r.pricePerLiveKg, "BDT")]] as [string, string][]) : []),
              ...(r.pricePerMeatKg !== null ? ([[t("tools.qurbani.perMeat"), money(r.pricePerMeatKg, "BDT")]] as [string, string][]) : []),
              ...(r.profit !== null ? ([[t("tools.qurbani.profit"), money(r.profit, "BDT")]] as [string, string][]) : []),
            ]}
          />
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 6. units

const FIRST: Record<UnitGroup, [string, string]> = { weight: ["maund", "kg"], count: ["tray", "piece"], length: ["inch", "cm"], land: ["bigha", "decimal"] };

function UnitsTool({ p }: { p: ToolParams["units"] }) {
  const { t, n } = usePrefs();
  const [group, setGroup] = useState<UnitGroup>("weight");
  const [from, setFrom] = useState("maund");
  const [to, setTo] = useState("kg");
  const [value, setValue] = useState("1");
  const units = Object.keys(unitGroups(p)[group]);
  const label = (u: string) => t(`tools.unit.${u}` as MessageKey);
  const res = units.includes(from) && units.includes(to) ? convertUnit(group, num(value), from as never, to as never, p) : null;
  return (
    <>
      <ChoiceChips
        options={(["weight", "count", "length", "land"] as const).map((g) => ({ value: g, label: t(`tools.units.${g}`) }))}
        value={group}
        onChange={(g) => {
          setGroup(g as UnitGroup);
          setFrom(FIRST[g as UnitGroup][0]);
          setTo(FIRST[g as UnitGroup][1]);
        }}
        testID="group"
      />
      <NumberField label={t("tools.units.value")} value={value} onChange={setValue} testID="u-value" />
      <Label>{t("tools.units.from")}</Label>
      <ChoiceChips options={units.map((u) => ({ value: u, label: label(u) }))} value={from} onChange={setFrom} testID="u-from" />
      <Label>{t("tools.units.to")}</Label>
      <ChoiceChips options={units.map((u) => ({ value: u, label: label(u) }))} value={to} onChange={setTo} testID="u-to" />
      {res !== null ? (
        <Result>
          <Text variant="titleLarge" testID="u-result">{`${n(num(value), 3)} ${label(from)} = ${n(res, 3)} ${label(to)}`}</Text>
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 7. dose

function DoseTool({ p }: { p: ToolParams["dose"] }) {
  const { t, n } = usePrefs();
  const theme = useTheme();
  const [weight, setWeight] = useState("");
  const [mgPerKg, setMgPerKg] = useState("");
  const [form, setForm] = useState<"liquid" | "tablet">("liquid");
  const [strength, setStrength] = useState("");
  const r = doseFor(num(weight), num(mgPerKg), form === "liquid" ? { mgPerMl: num(strength) } : { mgPerTablet: num(strength) }, p);
  return (
    <>
      <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Card.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer }}>
            {`⚠️ ${t("tools.dose.warning")}`}
          </Text>
        </Card.Content>
      </Card>
      <NumberField label={t("tools.dose.weight")} value={weight} onChange={setWeight} affix={t("tools.unit.kg")} testID="d-weight" />
      <NumberField label={t("tools.dose.mgPerKg")} value={mgPerKg} onChange={setMgPerKg} testID="d-mgkg" />
      <SegmentedButtons
        value={form}
        onValueChange={(v) => setForm(v as "liquid" | "tablet")}
        buttons={[
          { value: "liquid", label: t("tools.dose.liquid"), testID: "d-liquid" },
          { value: "tablet", label: t("tools.dose.tablet"), testID: "d-tablet" },
        ]}
      />
      <NumberField label={form === "liquid" ? t("tools.dose.mgPerMl") : t("tools.dose.mgPerTablet")} value={strength} onChange={setStrength} testID="d-strength" />
      {r ? (
        <Result>
          {r.ml !== null && <Big testID="d-result">{t("tools.dose.ml", { ml: n(r.ml, 1) })}</Big>}
          {r.tablets !== null && <Big testID="d-result">{t("tools.dose.tablets", { n: n(r.tablets, 2) })}</Big>}
          <Text variant="bodyMedium">{t("tools.dose.total", { mg: n(r.mg, 1) })}</Text>
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 8. fodder

function FodderTool({ p }: { p: ToolParams["fodder"] }) {
  const { t, n } = usePrefs();
  const [animals, setAnimals] = useState("");
  const [kgDay, setKgDay] = useState(String(p.kgPerDay));
  const [yieldT, setYieldT] = useState(String(p.tonnesPerAcre));
  const [days, setDays] = useState("");
  const r = fodderPlan(num(animals), num(kgDay), num(yieldT), Number.isNaN(num(days)) ? 0 : num(days), p);
  return (
    <>
      <NumberField label={t("tools.fodder.animals")} value={animals} onChange={setAnimals} testID="f-animals" />
      <NumberField label={t("tools.fodder.kgDay")} value={kgDay} onChange={setKgDay} testID="f-kg" />
      <NumberField label={t("tools.fodder.yield")} value={yieldT} onChange={setYieldT} testID="f-yield" />
      <NumberField label={t("tools.fodder.silageDays")} value={days} onChange={setDays} testID="f-days" />
      {r ? (
        <Result>
          <Rows
            rows={[
              [t("tools.fodder.year"), t("tools.fodder.tonnes", { n: n(r.tonnesPerYear, 1) })],
              [t("tools.fodder.land"), t("tools.fodder.decimals", { n: n(r.decimals) })],
              ...(r.silageKg > 0 ? ([[t("tools.fodder.silage"), `${n(r.silageKg)} ${t("tools.unit.kg")}`]] as [string, string][]) : []),
            ]}
          />
          {r.silageKg > 0 && <Text variant="bodySmall">{t("tools.fodder.space", { m3: n(r.silageM3, 1) })}</Text>}
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

// ---------------------------------------------------------------- 9. milk price

function MilkTool({ p }: { p: ToolParams["milk"] }) {
  const { t, money } = usePrefs();
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState(String(p.snf));
  const [fatRate, setFatRate] = useState(String(p.fatRate));
  const [snfRate, setSnfRate] = useState(String(p.snfRate));
  const [litres, setLitres] = useState("");
  const r = milkPrice(num(fat), num(snf), num(fatRate), num(snfRate), num(litres) || 0, p);
  return (
    <>
      <NumberField label={t("tools.milk.fat")} value={fat} onChange={setFat} testID="m-fat" />
      <NumberField label={t("tools.milk.snf")} value={snf} onChange={setSnf} testID="m-snf" />
      <NumberField label={t("tools.milk.fatRate")} value={fatRate} onChange={setFatRate} testID="m-fatrate" />
      <NumberField label={t("tools.milk.snfRate")} value={snfRate} onChange={setSnfRate} testID="m-snfrate" />
      <NumberField label={t("tools.milk.litres")} value={litres} onChange={setLitres} testID="m-litres" />
      {r ? (
        <Result>
          <Text variant="bodyMedium">{t("tools.milk.perLitre")}</Text>
          <Big testID="m-result">{money(r.perLitre, "BDT")}</Big>
          <Text variant="bodySmall">{t("tools.milk.perKg", { amount: money(r.perKg, "BDT") })}</Text>
          {r.total !== null && <Text variant="titleSmall">{`${t("tools.milk.total")}: ${money(r.total, "BDT")}`}</Text>}
        </Result>
      ) : (
        <Empty />
      )}
    </>
  );
}

/** One tool by its slug; `params` are the numbers to calculate with (defaults plus a super admin's changes). */
export function FarmTool({ slug, params = TOOL_DEFAULTS }: { slug: ToolSlug; params?: ToolParams }) {
  switch (slug) {
    case "cattle-weight":
      return <WeightTool p={params.weight} />;
    case "feed-ration":
      return <RationTool p={params} />;
    case "poultry-feed":
      return <PoultryTool p={params.poultry} />;
    case "calving-date":
      return <PregTool p={params} />;
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
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  price: { width: 110 },
});
