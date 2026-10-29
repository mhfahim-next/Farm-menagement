import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, List, Text, useTheme } from "react-native-paper";
import { DateField, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { isManager } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { fetchFattening } from "@/lib/fattening-data";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { isDate } from "@/lib/records";
import { parseNumber } from "@/lib/entries";

/** Animals being fattened for sale (Qurbani): growth, expected weight on the day, break-even and profit. */
export default function Fattening() {
  const { t, n, money, date } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const farm = current?.farm;
  const currency = farm?.currency ?? "BDT";
  const today = farmToday();
  const toast = useToast();
  const { data, offline, reload } = useCached(farm ? `fattening.${farm.id}` : null, () => fetchFattening(farm!.id, today));
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ target: "", costCattle: "", costGoat: "", priceCattle: "", priceGoat: "" });
  const [error, setError] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/animals"));

  const openSettings = () => {
    const s = data?.settings;
    const v = (x: number | null | undefined) => (x === null || x === undefined ? "" : String(Number(x)));
    setForm({ target: s?.target_date ?? "", costCattle: v(s?.daily_cost_cattle), costGoat: v(s?.daily_cost_goat), priceCattle: v(s?.price_kg_cattle), priceGoat: v(s?.price_kg_goat) });
    setEditing(true);
  };
  const saveSettings = async () => {
    if (!farm) return;
    const nums = [form.costCattle, form.costGoat, form.priceCattle, form.priceGoat].map(parseNumber);
    if (nums.some((x) => x !== null && (!Number.isFinite(x) || x < 0)) || (form.target && !isDate(form.target))) return setError(t("entry.err.number"));
    const { error: e } = await supabase.from("fattening_settings").upsert(
      { farm_id: farm.id, target_date: form.target || null, daily_cost_cattle: nums[0], daily_cost_goat: nums[1], price_kg_cattle: nums[2], price_kg_goat: nums[3], updated_at: new Date().toISOString() },
      { onConflict: "farm_id" },
    );
    if (e) return setError(e.message);
    setError(null);
    setEditing(false);
    toast(t("rec.saved"));
    reload();
  };

  const rows = data?.rows ?? [];
  const totalProfit = rows.reduce((s, r) => s + (r.stats.estProfit ?? 0), 0);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="fattening">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("fatten.title")} />
        {isManager(current?.role) && <Appbar.Action icon="cog-outline" onPress={openSettings} accessibilityLabel={t("fatten.settings")} testID="fatten-settings" />}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {editing ? (
            <Card mode="outlined" style={styles.card}>
              <Card.Title title={t("fatten.settings")} titleVariant="titleMedium" />
              <Card.Content style={{ gap: 10 }}>
                <DateField value={form.target} onChange={(v) => setForm({ ...form, target: v })} label={t("fatten.saleDay")} optional />
                {data?.qurbani && <Text variant="bodySmall">{t("fatten.qurbaniDefault", { date: date(data.qurbani) })}</Text>}
                {(farm?.has_dairy || farm?.has_fattening) && (
                  <>
                    <NumberField label={t("fatten.costCattle")} value={form.costCattle} onChange={(v) => setForm({ ...form, costCattle: v })} testID="fs-cost-cattle" />
                    <NumberField label={t("fatten.priceCattle")} value={form.priceCattle} onChange={(v) => setForm({ ...form, priceCattle: v })} testID="fs-price-cattle" />
                  </>
                )}
                {farm?.has_goat && (
                  <>
                    <NumberField label={t("fatten.costGoat")} value={form.costGoat} onChange={(v) => setForm({ ...form, costGoat: v })} />
                    <NumberField label={t("fatten.priceGoat")} value={form.priceGoat} onChange={(v) => setForm({ ...form, priceGoat: v })} />
                  </>
                )}
                <FormError message={error} />
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setEditing(false)}>{t("common.cancel")}</Button>
                <Button mode="contained" onPress={saveSettings} testID="fs-save">
                  {t("rec.save")}
                </Button>
              </Card.Actions>
            </Card>
          ) : null}
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={{ gap: 4 }}>
              <Text variant="labelLarge">{t("fatten.animalsN", { n: rows.length })}</Text>
              {data?.target ? <Text variant="bodyMedium">{t("fatten.daysToSale", { n: Math.max(0, Math.round((Date.parse(data.target) - Date.parse(today)) / 86_400_000)), date: date(data.target) })}</Text> : null}
              <Text variant="titleMedium" testID="fatten-total">{t("fatten.estProfit", { amount: money(Math.round(totalProfit), currency) })}</Text>
            </Card.Content>
          </Card>
          {rows.length === 0 && <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>{t("fatten.none")}</Text>}
          {rows.map((r) => (
            <List.Item
              key={r.id}
              title={`#${r.tag_number}${r.name ? ` · ${r.name}` : ""}`}
              description={[
                r.stats.currentKg !== null ? `${n(r.stats.currentKg, 1)} kg` : t("weight.none"),
                r.stats.adg !== null ? t("weight.adg", { g: n(Math.round(r.stats.adg * 1000)) }) : "",
                r.stats.projectedKg !== null ? t("fatten.onDay", { kg: n(r.stats.projectedKg, 0) }) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => router.push({ pathname: "/animal/[id]", params: { id: r.id } })}
              left={(p) => <List.Icon {...p} icon={r.species === "goat" || r.species === "sheep" ? "sheep" : "cow"} />}
              right={() =>
                r.stats.estProfit !== null ? (
                  <Text variant="titleSmall" style={{ alignSelf: "center", color: r.stats.estProfit >= 0 ? theme.colors.primary : theme.colors.error }}>
                    {money(Math.round(r.stats.estProfit), currency)}
                  </Text>
                ) : null
              }
              style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
              testID={`fatten-${r.tag_number}`}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
  card: { borderRadius: 20 },
  item: { borderRadius: 16 },
});
