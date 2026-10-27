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
import { fattenStats, type FattenStats } from "@/lib/fattening";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { isDate } from "@/lib/records";
import { parseNumber } from "@/lib/entries";

type Settings = { target_date: string | null; daily_cost_cattle: number | null; daily_cost_goat: number | null; price_kg_cattle: number | null; price_kg_goat: number | null };
type Row = { id: string; tag_number: string; name: string | null; species: string | null; stats: FattenStats };

async function fetchFattening(farmId: string, today: string) {
  const [animalsRes, own, sys] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name, species, purchase_price, purchase_date, fattening_start, created_at")
      .eq("farm_id", farmId)
      .eq("is_fattening", true)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("tag_number"),
    supabase.from("fattening_settings").select("target_date, daily_cost_cattle, daily_cost_goat, price_kg_cattle, price_kg_goat").eq("farm_id", farmId).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  if (animalsRes.error) throw new Error(animalsRes.error.message);
  const animals = (animalsRes.data ?? []) as { id: string; tag_number: string; name: string | null; species: string | null; purchase_price: number | null; purchase_date: string | null; fattening_start: string | null; created_at: string }[];
  const settings = (own.data ?? { target_date: null, daily_cost_cattle: null, daily_cost_goat: null, price_kg_cattle: null, price_kg_goat: null }) as Settings;
  const qurbani = (sys.data as { qurbani_date: string | null } | null)?.qurbani_date ?? null;
  const ids = animals.map((a) => a.id);
  const [weights, health, breeding] = ids.length
    ? await Promise.all([
        supabase.from("cattle_weights").select("cattle_id, weigh_date, weight_kg").in("cattle_id", ids),
        supabase.from("health_records").select("cattle_id, cost").in("cattle_id", ids),
        supabase.from("breeding_events").select("cattle_id, cost").in("cattle_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const target = settings.target_date ?? qurbani;
  const cost = (rows: { cattle_id: string; cost: number | null }[] | null, id: string) => (rows ?? []).filter((r) => r.cattle_id === id).reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const rows: Row[] = animals.map((a) => {
    const small = a.species === "goat" || a.species === "sheep";
    return {
      id: a.id,
      tag_number: a.tag_number,
      name: a.name,
      species: a.species,
      stats: fattenStats({
        startDate: a.fattening_start ?? a.purchase_date ?? a.created_at.slice(0, 10),
        purchasePrice: Number(a.purchase_price ?? 0),
        weights: ((weights.data ?? []) as { cattle_id: string; weigh_date: string; weight_kg: number }[]).filter((w) => w.cattle_id === a.id).map((w) => ({ date: w.weigh_date, kg: Number(w.weight_kg) })),
        directCosts: cost(health.data as { cattle_id: string; cost: number | null }[], a.id) + cost(breeding.data as { cattle_id: string; cost: number | null }[], a.id),
        dailyCost: Number((small ? settings.daily_cost_goat : settings.daily_cost_cattle) ?? 0),
        pricePerKg: Number((small ? settings.price_kg_goat : settings.price_kg_cattle) ?? 0),
        targetDate: target,
        today,
        sale: null,
      }),
    };
  });
  return { rows, settings, target, qurbani };
}

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
