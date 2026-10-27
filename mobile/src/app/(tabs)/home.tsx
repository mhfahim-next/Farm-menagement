import * as WebBrowser from "expo-web-browser";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReminderItem } from "@/components/reminder-item";
import { SyncBar } from "@/components/sync-bar";
import { useReminders } from "@/lib/reminders";
import { farmToday } from "@/lib/dates";
import type { Farm } from "@/lib/farm";
import { siteLink } from "@/lib/env";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

type Summary = { cattle: number; goats: number; birds: number; milk: number; eggs: number };

/** Today on the farm at a glance. */
export default function Home() {
  const { t, n, locale } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current, profile } = useSession();
  const farm = current?.farm;
  const [summary, setSummary] = useState<Summary | null>(null);
  const reminders = useReminders(farm?.id, locale);
  const { reload: reloadReminders } = reminders;
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (farm) setSummary(await fetchSummary(farm));
  }, [farm]);

  useEffect(() => {
    if (!farm) return;
    let cancelled = false;
    fetchSummary(farm)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [farm]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
      reloadReminders();
    }, [load, reloadReminders]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([load().catch(() => {}), reloadReminders()]);
    setRefreshing(false);
  };

  if (!farm || !current) return null;
  const first = profile?.full_name?.trim().split(/\s+/)[0];
  const stats: { show: boolean; icon: string; label: string; value: string }[] = [
    { show: farm.has_dairy || farm.has_fattening, icon: "cow", label: t("home.cattle"), value: summary ? n(summary.cattle) : "…" },
    { show: farm.has_goat, icon: "sheep", label: t("home.goats"), value: summary ? n(summary.goats) : "…" },
    { show: farm.has_layer || farm.has_broiler, icon: "bird", label: t("home.birds"), value: summary ? n(summary.birds) : "…" },
    { show: farm.has_dairy, icon: "water-outline", label: t("home.milkToday"), value: summary ? t("home.litres", { n: Math.round(summary.milk * 10) / 10 }) : "…" },
    { show: farm.has_layer, icon: "egg-outline", label: t("home.eggsToday"), value: summary ? n(summary.eggs) : "…" },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
      testID="home"
    >
      <View style={styles.inner}>
        <Text variant="headlineSmall" accessibilityRole="header" testID="home-hello">
          {first ? t("home.hello", { name: first }) : t("home.helloNoName")}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {t("home.today", { farm: farm.name })}
        </Text>
        <View style={styles.chips}>
          <Chip compact icon="account-outline">
            {t(`role.${current.role}`)}
          </Chip>
          <Chip compact icon="star-outline" testID="plan-chip">
            {t("home.planBadge", { plan: farm.plan === "free" || farm.plan === "pro" || farm.plan === "business" ? t(`plan.name.${farm.plan}`) : farm.plan })}
          </Chip>
        </View>

        <View style={styles.sync}>
          <SyncBar />
        </View>

        {reminders.data && (
          <Card mode="outlined" style={styles.coming} testID="today-work">
            <Card.Title
              title={reminders.data.open.length ? t("home.work", { n: reminders.data.open.length }) : t("rem.allClear")}
              titleVariant="titleMedium"
              left={(p) => <Icon {...p} source={reminders.data?.open.length ? "bell-ring-outline" : "check-decagram-outline"} color={theme.colors.primary} />}
            />
            {reminders.data.open.slice(0, 3).map((r) => (
              <ReminderItem key={r.key} r={r} />
            ))}
            {reminders.data.open.length > 0 && (
              <Card.Actions>
                <Button mode="text" onPress={() => router.push("/reminders")} testID="see-all-reminders">
                  {t("home.seeAll")}
                </Button>
              </Card.Actions>
            )}
          </Card>
        )}

        <View style={styles.grid}>
          {stats
            .filter((s) => s.show)
            .map((s) => (
              <Card key={s.label} mode="contained" style={[styles.stat, { backgroundColor: theme.colors.elevation.level2 }]}>
                <Card.Content style={styles.statBody}>
                  <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Icon source={s.icon} size={22} color={theme.colors.onPrimaryContainer} />
                  </View>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {s.value}
                  </Text>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    {s.label}
                  </Text>
                </Card.Content>
              </Card>
            ))}
        </View>

        <Card mode="outlined" style={styles.coming}>
          <Card.Title title={t("home.comingTitle")} titleVariant="titleMedium" left={(p) => <Icon {...p} source="rocket-launch-outline" color={theme.colors.primary} />} />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("home.comingBody")}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained-tonal" icon="open-in-new" onPress={() => WebBrowser.openBrowserAsync(siteLink("/dashboard"))}>
              {t("home.openWeb")}
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </ScrollView>
  );
}

async function fetchSummary(farm: Farm): Promise<Summary> {
  const day = farmToday();
  const [animals, stats, milk, eggs] = await Promise.all([
    supabase.from("cattle").select("species").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null),
    farm.has_layer || farm.has_broiler ? supabase.from("flocks").select("id").eq("farm_id", farm.id).eq("status", "active").is("deleted_at", null) : null,
    farm.has_dairy ? supabase.from("milk_records").select("quantity_liters").eq("farm_id", farm.id).eq("record_date", day) : null,
    farm.has_layer ? supabase.from("flock_daily_logs").select("eggs_collected").eq("farm_id", farm.id).eq("log_date", day) : null,
  ]);
  const list = (animals.data ?? []) as { species: string | null }[];
  const flockIds = ((stats?.data ?? []) as { id: string }[]).map((f) => f.id);
  const { data: counts } = flockIds.length ? await supabase.from("flock_stats").select("current_count").in("flock_id", flockIds) : { data: [] };
  const flocks = (counts ?? []) as { current_count: number }[];
  return {
    cattle: list.filter((a) => (a.species ?? "cattle") === "cattle").length,
    goats: list.filter((a) => a.species === "goat" || a.species === "sheep").length,
    birds: flocks.reduce((s, f) => s + Number(f.current_count), 0),
    milk: ((milk?.data ?? []) as { quantity_liters: number }[]).reduce((s, m) => s + Number(m.quantity_liters), 0),
    eggs: ((eggs?.data ?? []) as { eggs_collected: number }[]).reduce((s, e) => s + Number(e.eggs_collected), 0),
  };
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center" },
  chips: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  sync: { marginTop: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  stat: { flexGrow: 1, flexBasis: "46%", borderRadius: 20 },
  statBody: { gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontVariant: ["tabular-nums"] },
  coming: { marginTop: 20, borderRadius: 20 },
});
