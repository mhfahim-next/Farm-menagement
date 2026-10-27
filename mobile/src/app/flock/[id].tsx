import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, List, Menu, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { RecordMenu } from "@/components/record-menu";
import { batchStats } from "@/lib/broiler";
import { useCached } from "@/lib/cache";
import { deleteRow, fetchFlockDetail, isManager, isStaff, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel, optionsOf } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { flockWeeks, layerStats } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** One flock or batch: how it is doing, its last days, its vaccines, and closing it. */
export default function FlockPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, n, money, date, locale } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const currency = current?.farm.currency ?? "BDT";
  const options = useOptions();
  const toast = useToast();
  const { data, offline, error, reload } = useCached(id ? `flock.${id}` : null, () => fetchFlockDetail(id));
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const [statusMenu, setStatusMenu] = useState(false);
  const f = data?.flock;
  const today = farmToday();
  const staff = isStaff(current?.role);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/flocks"));

  const setStatus = async (status: string) => {
    setStatusMenu(false);
    if (!f) return;
    const { error: e } = await supabase.from("flocks").update({ status }).eq("id", f.id);
    toast(e ? `${t("common.error")} ${e.message}` : t("rec.saved"));
    reload();
  };

  const stat = (label: string, value: string, testID?: string) => (
    <View style={styles.stat} key={label}>
      <Text variant="titleLarge" testID={testID}>
        {value}
      </Text>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );

  let stats: React.ReactNode = null;
  if (f && data) {
    if (f.kind === "layer") {
      const s = layerStats(f.initial_count, data.logs);
      stats = [
        stat(t("flock.alive"), n(f.current_count), "flock-alive"),
        stat(t("flock.henDay"), `${n(s.henDay7, 1)}%`, "flock-henday"),
        stat(t("flock.mortality"), `${n(s.mortalityPct, 2)}%`),
        stat(t("flock.eggsTotal"), n(s.eggs)),
        stat(t("flock.feedDozen"), s.feedPerDozen !== null ? `${n(s.feedPerDozen, 2)} kg` : "—"),
        stat(t("flock.age"), t("flock.weeks", { n: flockWeeks(f.placed_date, f.age_at_placement_weeks, today) })),
      ];
    } else {
      const lastLog = data.logs.at(-1)?.log_date;
      const b = batchStats({
        initialCount: f.initial_count,
        placedDate: f.placed_date,
        chickPrice: f.chick_price === null ? null : Number(f.chick_price),
        logs: data.logs,
        soldBirds: data.sold.birds,
        soldKg: data.sold.kg,
        salesAmount: data.sold.amount,
        feedCost: data.feedCost,
        medicineCost: data.health.reduce((sum, h) => sum + Number(h.cost ?? 0), 0),
        asOf: f.status === "active" ? today : (lastLog ?? today),
      });
      stats = [
        stat(t("flock.alive"), n(b.live), "flock-alive"),
        stat(t("flock.age"), t("flock.days", { n: b.ageDays })),
        stat(t("flock.mortality"), `${n(b.mortalityPct, 1)}%`),
        stat(t("flock.weight"), b.latestWeightG !== null ? `${n(b.latestWeightG)} g` : "—"),
        stat("FCR", b.fcr !== null ? n(b.fcr, 2) : "—", "flock-fcr"),
        stat(t("flock.costKg"), b.costPerKg !== null ? money(Math.round(b.costPerKg), currency) : "—"),
        stat(t("flock.sales"), money(b.salesAmount, currency)),
        stat(t("flock.profit"), money(Math.round(b.profit), currency), "flock-profit"),
      ];
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="flock-page">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={f?.name ?? ""} />
        {f && staff ? (
          <Menu visible={statusMenu} onDismiss={() => setStatusMenu(false)} anchor={<Appbar.Action icon="dots-vertical" onPress={() => setStatusMenu(true)} accessibilityLabel={t("rec.more")} testID="flock-status" />}>
            {optionsOf(options, "flock_status")
              .filter((o) => o.value !== f.status)
              .map((o) => (
                <Menu.Item key={o.value} title={t("flock.markAs", { status: optionLabel(options, "flock_status", o.value, locale) })} onPress={() => setStatus(o.value)} testID={`flock-status-${o.value}`} />
              ))}
          </Menu>
        ) : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {error && !f && <FormError message={t("common.error")} detail={error} />}
          {f && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {[t(`entry.kind.${f.kind}`), f.breed ? optionLabel(options, "flock_breed", f.breed, locale) : "", f.shed ? t("flock.shedN", { s: f.shed }) : "", t("flock.placedOn", { date: date(f.placed_date) }), optionLabel(options, "flock_status", f.status, locale)]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
                <Card.Content style={styles.grid}>{stats}</Card.Content>
              </Card>
              {staff && f.status === "active" && (
                <View style={styles.actions}>
                  <Button mode="contained-tonal" icon="clipboard-edit-outline" compact onPress={() => router.push("/entry")}>
                    {t("flock.dayEntry")}
                  </Button>
                  <Button mode="contained-tonal" icon="needle" compact onPress={() => router.push({ pathname: "/record/flock-health", params: { flock: f.id } })} testID="flock-add-health">
                    {t("flock.healthTitle")}
                  </Button>
                  {f.kind !== "layer" && (
                    <Button mode="contained-tonal" icon="cart-outline" compact onPress={() => router.push("/record/sale")}>
                      {t("sale.newSale")}
                    </Button>
                  )}
                </View>
              )}
              <Card mode="outlined" style={styles.card}>
                <Card.Title title={t("flock.lastDays")} titleVariant="titleMedium" />
                {data.logs.length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("flock.noLogs")}</Text>
                  </Card.Content>
                ) : (
                  [...data.logs]
                    .reverse()
                    .slice(0, 10)
                    .map((l) => (
                      <List.Item
                        key={l.log_date}
                        title={date(l.log_date)}
                        description={[
                          f.kind === "layer" ? t("flock.eggsN", { n: n(l.eggs_collected) }) : l.avg_weight_g ? `${n(Number(l.avg_weight_g))} g` : "",
                          l.mortality + l.culled ? t("flock.deathsN", { n: n(l.mortality + l.culled) }) : "",
                          l.feed_kg ? `${n(Number(l.feed_kg), 1)} kg` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      />
                    ))
                )}
              </Card>
              <Card mode="outlined" style={styles.card}>
                <Card.Title title={t("animal.health")} titleVariant="titleMedium" />
                {data.health.length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.noHealth")}</Text>
                  </Card.Content>
                ) : (
                  data.health.map((h) => (
                    <List.Item
                      key={h.id}
                      title={[optionLabel(options, "health_type", h.record_type, locale), h.product].filter(Boolean).join(" · ")}
                      description={[date(h.record_date), h.next_due_date ? t("animal.nextDue", { date: date(h.next_due_date) }) : ""].filter(Boolean).join(" · ")}
                      left={(p) => <List.Icon {...p} icon="needle" />}
                      right={() =>
                        isManager(current?.role) ? (
                          <RecordMenu
                            onDelete={async () => {
                              const err = await deleteRow("flock_health_records", h.id);
                              toast(err ? `${t("common.error")} ${err}` : t("rec.deleted"));
                              reload();
                            }}
                          />
                        ) : null
                      }
                    />
                  ))
                )}
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  stat: { width: "50%", gap: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
