import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Chip, IconButton, List, Menu, Text, useTheme } from "react-native-paper";
import { BarChart } from "@/components/bar-chart";
import { OfflineNote } from "@/components/offline-note";
import { animalProfits, type AnimalProfitRow } from "@/lib/animal-profit";
import { useCached } from "@/lib/cache";
import { fetchAnimalProfit, fetchCanExport, fetchDaily, fetchMonthly } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { usePrefs } from "@/lib/prefs";
import { monthResults, type SectionResult } from "@/lib/profit";
import { addDays, shiftMonth } from "@/lib/records";
import { dailySeries, escapeHtml, toCsv } from "@/lib/report";
import { useSession } from "@/lib/session";
import { shareCsv, sharePdf } from "@/lib/share";
import { daysInMonth } from "@/lib/staff";
import { useToast } from "@/lib/toast";

type Period = "12m" | "year" | "all";

/** Milk and egg charts, cost and profit per litre / per egg, and profit per animal; shared as PDF or CSV. */
export default function Reports() {
  const { t, n, money, date, month: monthName } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const { current } = useSession();
  const farm = current?.farm;
  const currency = farm?.currency ?? "BDT";
  const today = farmToday();
  const from30 = addDays(today, -29);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [period, setPeriod] = useState<Period>("12m");
  const [menu, setMenu] = useState(false);
  const [sharing, setSharing] = useState(false);

  const dairy = Boolean(farm?.has_dairy);
  const layer = Boolean(farm?.has_layer);
  const hasOther = Boolean(farm?.has_fattening || farm?.has_goat || farm?.has_broiler);
  const keepsAnimals = Boolean(farm?.has_dairy || farm?.has_goat || farm?.has_fattening);
  const showAnimals = keepsAnimals && farm?.show_animal_profit !== false;
  const range = { from: period === "12m" ? addDays(today, -364) : period === "year" ? `${today.slice(0, 4)}-01-01` : "2000-01-01", to: today };

  const daily = useCached(farm ? `daily.${farm.id}.${today}` : null, () => fetchDaily(farm!.id, from30, today, dairy, layer));
  const monthly = useCached(farm ? `monthly.${farm.id}.${month}` : null, () =>
    fetchMonthly(farm!.id, `${shiftMonth(month, -5)}-01`, `${month}-${String(daysInMonth(month)).padStart(2, "0")}`),
  );
  const aprofit = useCached(farm && showAnimals ? `aprofit.${farm.id}.${period}.${today}` : null, () => fetchAnimalProfit(farm!.id, range.from, range.to));
  const canExport = useCached(farm ? `export.${farm.plan}` : null, () => fetchCanExport(farm!.plan));

  const milk = dailySeries(daily.data?.milk ?? [], from30, today, (r) => r.record_date, (r) => r.quantity_liters);
  const eggs = dailySeries(daily.data?.eggs ?? [], from30, today, (r) => r.log_date, (r) => r.eggs_collected);
  const milkTotal = milk.reduce((s, d) => s + d.value, 0);
  const eggTotal = eggs.reduce((s, d) => s + d.value, 0);
  const months = (monthly.data ?? []).map((m) => ({ month: m.month.slice(0, 7), r: monthResults(m, dairy, layer, hasOther) }));
  const res = months.find((m) => m.month === month)?.r ?? null;
  const ap = aprofit.data && farm ? animalProfits(aprofit.data, farm, range) : null;
  const unitMoney = (v: number | null) => (v === null ? "—" : money(Math.round(v * 100) / 100, currency));
  const whole = (v: number) => money(Math.round(v), currency);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/more"));
  const offline = daily.offline || monthly.offline;

  const sectionCard = (kind: "dairy" | "layer", r: SectionResult) => {
    const unit = kind === "dairy" ? t("rep.perLitre") : t("rep.perEgg");
    return (
      <Card mode="outlined" style={styles.card} testID={`rep-${kind}`}>
        <Card.Title
          title={kind === "dairy" ? t("rep.dairyTitle") : t("rep.layerTitle")}
          subtitle={kind === "dairy" ? t("rep.litres", { n: n(r.produced, 1) }) : t("rep.eggs", { n: n(r.produced) })}
          titleVariant="titleMedium"
        />
        <Card.Content style={{ gap: 6 }}>
          {r.produced <= 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{kind === "dairy" ? t("rep.noMilk") : t("rep.noEggs")}</Text>
          ) : (
            <>
              <View style={styles.tiles}>
                {[
                  { k: "cost", v: r.costPerUnit, c: theme.colors.errorContainer },
                  { k: "income", v: r.incomePerUnit, c: theme.colors.secondaryContainer },
                  { k: "profit", v: r.profitPerUnit, c: theme.colors.primaryContainer },
                ].map((x) => (
                  <View key={x.k} style={[styles.tile, { backgroundColor: x.c }]}>
                    <Text variant="labelSmall">{`${t(`rep.${x.k}` as "rep.cost")} ${unit}`}</Text>
                    <Text variant="titleMedium" testID={`rep-${kind}-${x.k}`}>
                      {unitMoney(x.v)}
                    </Text>
                  </View>
                ))}
              </View>
              <Line label={t("rep.totalCost")} value={whole(r.cost)} />
              <Line label={t("rep.totalIncome")} value={whole(r.income)} />
              <Line label={t("rep.totalProfit")} value={whole(r.profit)} strong />
              <Line label={t("rep.avgPrice")} value={r.avgSalePrice === null ? t("rep.noSales") : `${unitMoney(r.avgSalePrice)} ${unit}`} />
              {r.feedShare !== null && <Line label={t("rep.feedShare")} value={`${n(r.feedShare * 100)}%`} />}
              {r.sharedCost > 0 && <Line label={t("rep.shared")} value={whole(r.sharedCost)} />}
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const csv = () => {
    const out: (string | number | null)[][] = [[t("rep.title"), farm?.name ?? "", today]];
    if (dairy || layer) {
      out.push([], [t("rep.daily"), dairy ? t("rep.milkL") : "", layer ? t("rep.eggsCol") : ""]);
      milk.forEach((d, i) => out.push([d.date, dairy ? d.value : "", layer ? eggs[i].value : ""]));
    }
    if (dairy || layer) {
      out.push([], [t("rep.month"), dairy ? `${t("rep.cost")} ${t("rep.perLitre")}` : "", dairy ? `${t("rep.profit")} ${t("rep.perLitre")}` : "", layer ? `${t("rep.cost")} ${t("rep.perEgg")}` : "", layer ? `${t("rep.profit")} ${t("rep.perEgg")}` : ""]);
      const r2 = (v: number | null) => (v === null ? "" : Math.round(v * 100) / 100);
      months.forEach((m) => out.push([m.month, dairy ? r2(m.r.dairy.costPerUnit) : "", dairy ? r2(m.r.dairy.profitPerUnit) : "", layer ? r2(m.r.layer.costPerUnit) : "", layer ? r2(m.r.layer.profitPerUnit) : ""]));
    }
    if (ap) {
      out.push([], [t("rep.animalTitle"), `${range.from} – ${range.to}`]);
      out.push([t("rep.tag"), t("rep.days"), t("rep.totalIncome"), t("rep.totalCost"), t("rep.totalProfit")]);
      ap.rows.forEach((r) => out.push([r.name ? `${r.tag_number} ${r.name}` : r.tag_number, r.days, Math.round(r.income), Math.round(r.cost), Math.round(r.profit)]));
    }
    return toCsv(out);
  };

  const html = () => {
    const e = escapeHtml;
    const row = (cells: string[], head = false) => `<tr>${cells.map((c, i) => `<${head ? "th" : "td"}${i ? ' class="n"' : ""}>${e(c)}</${head ? "th" : "td"}>`).join("")}</tr>`;
    const parts: string[] = [`<h1>${e(farm?.name ?? "")}</h1><p>${e(t("rep.title"))} · ${e(date(today))}</p>`];
    if (dairy) parts.push(`<h2>${e(t("rep.milk30"))}</h2><p>${e(t("rep.totalAvg", { total: n(milkTotal, 1), avg: n(milkTotal / 30, 1) }))}</p>`);
    if (layer) parts.push(`<h2>${e(t("rep.eggs30"))}</h2><p>${e(t("rep.totalAvg", { total: n(eggTotal), avg: n(eggTotal / 30) }))}</p>`);
    if ((dairy || layer) && months.length) {
      const head = [t("rep.month")];
      if (dairy) head.push(`${t("rep.cost")} ${t("rep.perLitre")}`, `${t("rep.profit")} ${t("rep.perLitre")}`);
      if (layer) head.push(`${t("rep.cost")} ${t("rep.perEgg")}`, `${t("rep.profit")} ${t("rep.perEgg")}`);
      const body = months.map((m) => {
        const c = [monthName(m.month)];
        if (dairy) c.push(unitMoney(m.r.dairy.costPerUnit), unitMoney(m.r.dairy.profitPerUnit));
        if (layer) c.push(unitMoney(m.r.layer.costPerUnit), unitMoney(m.r.layer.profitPerUnit));
        return row(c);
      });
      parts.push(`<h2>${e(t("rep.unitTitle"))}</h2><table>${row(head, true)}${body.join("")}</table>`);
    }
    if (ap) {
      parts.push(`<h2>${e(t("rep.animalTitle"))}</h2><p>${e(`${date(range.from)} – ${date(range.to)}`)}</p>`);
      parts.push(
        `<table>${row([t("rep.tag"), t("rep.totalIncome"), t("rep.totalCost"), t("rep.totalProfit")], true)}${ap.rows
          .map((r) => row([r.name ? `#${r.tag_number} ${r.name}` : `#${r.tag_number}`, whole(r.income), whole(r.cost), whole(r.profit)]))
          .join("")}${row([t("rep.total"), whole(ap.totals.income), whole(ap.totals.cost), whole(ap.totals.profit)])}</table>`,
      );
    }
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:24px;color:#1c1b1f}h1{margin:0 0 4px}h2{margin:24px 0 6px;font-size:16px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}.n{text-align:right}</style></head><body>${parts.join("")}<p style="margin-top:32px;color:#777;font-size:11px">FarmFlows</p></body></html>`;
  };

  const share = async (kind: "pdf" | "csv") => {
    setMenu(false);
    if (!canExport.data) return toast(t("rep.locked"));
    setSharing(true);
    try {
      const name = `farmflows-report-${today}.${kind}`;
      if (kind === "csv") await shareCsv(name, csv());
      else await sharePdf(name, html());
    } catch (e) {
      toast(`${t("common.error")} ${e instanceof Error ? e.message : ""}`);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="reports">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("rep.title")} />
        <Menu
          visible={menu}
          onDismiss={() => setMenu(false)}
          anchor={<Appbar.Action icon="share-variant-outline" disabled={sharing} onPress={() => setMenu(true)} accessibilityLabel={t("rep.share")} testID="rep-share" />}
        >
          <Menu.Item leadingIcon="file-pdf-box" title={t("rep.sharePdf")} onPress={() => share("pdf")} testID="rep-share-pdf" />
          <Menu.Item leadingIcon="file-delimited-outline" title={t("rep.shareCsv")} onPress={() => share("csv")} testID="rep-share-csv" />
        </Menu>
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {canExport.data === false && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} testID="rep-locked">
              {t("rep.locked")}
            </Text>
          )}

          {dairy && (
            <Card mode="outlined" style={styles.card}>
              <Card.Title title={t("rep.milk30")} subtitle={t("rep.totalAvg", { total: n(milkTotal, 1), avg: n(milkTotal / 30, 1) })} titleVariant="titleMedium" />
              <Card.Content>
                <BarChart data={milk} label={t("rep.milk30")} startLabel={date(from30, true)} endLabel={date(today, true)} testID="chart-milk" />
              </Card.Content>
            </Card>
          )}
          {layer && (
            <Card mode="outlined" style={styles.card}>
              <Card.Title title={t("rep.eggs30")} subtitle={t("rep.totalAvg", { total: n(eggTotal), avg: n(eggTotal / 30) })} titleVariant="titleMedium" />
              <Card.Content>
                <BarChart data={eggs} label={t("rep.eggs30")} startLabel={date(from30, true)} endLabel={date(today, true)} testID="chart-eggs" />
              </Card.Content>
            </Card>
          )}

          {(dairy || layer) && (
            <>
              <View style={styles.monthRow}>
                <IconButton icon="chevron-left" onPress={() => setMonth(shiftMonth(month, -1))} accessibilityLabel={t("staff.prevMonth")} testID="rep-month-prev" />
                <Text variant="titleMedium" testID="rep-month">
                  {monthName(month)}
                </Text>
                <IconButton icon="chevron-right" disabled={month >= today.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, 1))} accessibilityLabel={t("staff.nextMonth")} testID="rep-month-next" />
              </View>
              {res && dairy && sectionCard("dairy", res.dairy)}
              {res && layer && sectionCard("layer", res.layer)}
              {months.length > 1 && (
                <Card mode="outlined" style={styles.card}>
                  <Card.Title title={t("rep.trend")} titleVariant="titleMedium" />
                  {months.map((m) => (
                    <List.Item
                      key={m.month}
                      title={monthName(m.month)}
                      description={[
                        dairy ? `${t("rep.profit")} ${t("rep.perLitre")}: ${unitMoney(m.r.dairy.profitPerUnit)}` : "",
                        layer ? `${t("rep.profit")} ${t("rep.perEgg")}: ${unitMoney(m.r.layer.profitPerUnit)}` : "",
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      onPress={() => setMonth(m.month)}
                    />
                  ))}
                </Card>
              )}
            </>
          )}

          {showAnimals && (
            <Card mode="outlined" style={styles.card} testID="rep-animals">
              <Card.Title title={t("rep.animalTitle")} subtitle={t("rep.animalHint")} subtitleNumberOfLines={3} titleVariant="titleMedium" />
              <Card.Content style={{ gap: 8 }}>
                <View style={styles.chips}>
                  {(["12m", "year", "all"] as const).map((p) => (
                    <Chip key={p} compact selected={period === p} showSelectedCheck onPress={() => setPeriod(p)} testID={`rep-period-${p}`}>
                      {t(`rep.period.${p}`)}
                    </Chip>
                  ))}
                </View>
                {ap && (
                  <>
                    <Line label={t("rep.totalIncome")} value={whole(ap.totals.income)} />
                    <Line label={t("rep.totalCost")} value={whole(ap.totals.cost)} />
                    <Line label={t("rep.totalProfit")} value={whole(ap.totals.profit)} strong testID="rep-animals-profit" />
                    {ap.milkPriceMissing && <Text variant="bodySmall" style={{ color: theme.colors.error }}>{t("rep.noMilkPrice")}</Text>}
                    {ap.rows.length === 0 && <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("rep.noAnimals")}</Text>}
                  </>
                )}
              </Card.Content>
              {ap?.rows.map((r: AnimalProfitRow) => (
                <List.Item
                  key={r.id}
                  title={r.name ? `#${r.tag_number} · ${r.name}` : `#${r.tag_number}`}
                  description={t("rep.animalLine", { income: whole(r.income), cost: whole(r.cost), days: n(r.days) })}
                  right={() => (
                    <Text variant="titleSmall" style={{ alignSelf: "center", color: r.profit >= 0 ? theme.colors.primary : theme.colors.error }}>
                      {whole(r.profit)}
                    </Text>
                  )}
                  onPress={() => router.push({ pathname: "/animal/[id]", params: { id: r.id } })}
                  testID={`rep-animal-${r.tag_number}`}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Line({ label, value, strong, testID }: { label: string; value: string; strong?: boolean; testID?: string }) {
  return (
    <View style={styles.line}>
      <Text variant={strong ? "titleSmall" : "bodyMedium"}>{label}</Text>
      <Text variant={strong ? "titleSmall" : "bodyMedium"} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  tiles: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, borderRadius: 14, padding: 10, gap: 2 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
