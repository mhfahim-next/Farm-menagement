import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineNote } from "@/components/offline-note";
import { SyncBar } from "@/components/sync-bar";
import { useCached } from "@/lib/cache";
import { isManager, isStaff, useFlocks } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { todayStatus } from "@/lib/entry-helpers";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/** What is already written today: milkings, and flocks with a daily log. */
async function fetchToday(farmId: string, day: string, dairy: boolean, birds: boolean) {
  const [milk, logs] = await Promise.all([
    dairy ? supabase.from("milk_records").select("session").eq("farm_id", farmId).eq("record_date", day) : null,
    birds ? supabase.from("flock_daily_logs").select("flock_id").eq("farm_id", farmId).eq("log_date", day) : null,
  ]);
  const err = milk?.error ?? logs?.error;
  if (err) throw new Error(err.message);
  return {
    sessions: [...new Set(((milk?.data ?? []) as { session: string }[]).map((r) => r.session))],
    flocks: [...new Set(((logs?.data ?? []) as { flock_id: string }[]).map((r) => r.flock_id))],
  };
}

type Tile = { key: string; icon: string; label: string; hint?: string; pending?: boolean; go: () => void; testID: string };

/** "What do you want to write?": one big tile per kind of record, and what is still to do today. */
export default function Entry() {
  const { t } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current } = useSession();
  const farm = current?.farm;
  const dairy = Boolean(farm?.has_dairy);
  const birds = Boolean(farm?.has_layer || farm?.has_broiler);
  const animals = Boolean(farm?.has_dairy || farm?.has_fattening || farm?.has_goat);
  const breeds = Boolean(farm?.has_dairy || farm?.has_goat);
  const day = farmToday();
  const { data: flocks } = useFlocks(birds ? farm?.id : undefined);
  const { data, offline, reload } = useCached(farm ? `today.${farm.id}.${day}` : null, () => fetchToday(farm!.id, day, dairy, birds));
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  if (!farm || !current) return null;
  const vet = current.role === "vet";
  const staff = isStaff(current.role);
  const status = todayStatus(data?.sessions ?? [], data?.flocks ?? [], (flocks ?? []).map((f) => f.id), dairy);

  const tiles: Tile[] = [
    ...(dairy && staff ? [{ key: "milk", icon: "cup-water", label: t("hub.milk"), hint: t("hub.milkHint"), pending: status.milkPending, go: () => router.push("/entry/milk"), testID: "entry-milk" }] : []),
    ...(birds && staff ? [{ key: "birds", icon: "egg-outline", label: t("hub.birds"), hint: t("hub.birdsHint"), pending: status.flocksPending, go: () => router.push("/entry/birds"), testID: "entry-birds" }] : []),
    ...(animals ? [{ key: "health", icon: "needle", label: t("rec.healthTitle"), hint: t("hub.healthHint"), go: () => router.push("/record/health"), testID: "quick-health" }] : []),
    ...(breeds ? [{ key: "breeding", icon: "heart-pulse", label: t("rec.breedingTitle"), hint: t("hub.breedingHint"), go: () => router.push("/record/breeding"), testID: "quick-breeding" }] : []),
    ...(birds && staff ? [{ key: "flockHealth", icon: "shield-plus-outline", label: t("hub.flockHealth"), hint: t("hub.flockHealthHint"), go: () => router.push("/record/flock-health"), testID: "quick-flock-health" }] : []),
    ...(staff ? [{ key: "sale", icon: "cart-outline", label: t("sale.newSale"), hint: t("hub.saleHint"), go: () => router.push("/record/sale"), testID: "quick-sale" }] : []),
    ...(staff ? [{ key: "expense", icon: "cash-minus", label: t("txn.short"), hint: t("hub.expenseHint"), go: () => router.push("/record/expense"), testID: "quick-expense" }] : []),
    ...(staff ? [{ key: "stock", icon: "warehouse", label: t("hub.stock"), hint: t("hub.stockHint"), go: () => router.push("/stock"), testID: "quick-stock" }] : []),
    { key: "tools", icon: "calculator-variant-outline", label: t("tools.title"), hint: t("tools.menuHint"), go: () => router.push("/tools"), testID: "quick-tools" },
    ...(isManager(current.role) ? [{ key: "attendance", icon: "calendar-check-outline", label: t("staff.attendance"), hint: t("hub.attendanceHint"), go: () => router.push("/staff/attendance"), testID: "quick-attendance" }] : []),
  ];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="entry">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.inner}>
          <Text variant="headlineSmall" accessibilityRole="header">
            {t("hub.title")}
          </Text>
          <SyncBar />
          {offline && <OfflineNote />}
          {vet && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("appr.vetNote")}
            </Text>
          )}

          {staff && (status.milk.length > 0 || status.flocks.length > 0) && (
            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]} testID="today-status">
              <Card.Content style={{ gap: 8 }}>
                <Text variant="titleSmall">{t("hub.todayTitle")}</Text>
                <View style={styles.statusRow}>
                  {status.milk.map((m) => (
                    <Status key={m.session} done={m.done} icon={m.session === "morning" ? "weather-sunset-up" : "weather-night"} label={t(m.session === "morning" ? "hub.milkMorning" : "hub.milkEvening")} testID={`status-milk-${m.session}`} />
                  ))}
                  {status.flocks.map((f) => (
                    <Status
                      key={f.id}
                      done={f.done}
                      icon="egg-outline"
                      label={(flocks ?? []).find((x) => x.id === f.id)?.name ?? ""}
                      testID={`status-flock-${(flocks ?? []).find((x) => x.id === f.id)?.name ?? f.id}`}
                    />
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {tiles.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>{t("entry.nothingKept")}</Text>
          ) : (
            <View style={styles.grid}>
              {tiles.map((tile) => (
                <Pressable
                  key={tile.key}
                  onPress={tile.go}
                  accessibilityRole="button"
                  accessibilityLabel={tile.label}
                  testID={tile.testID}
                  style={({ pressed }) => [styles.tile, { backgroundColor: pressed ? theme.colors.secondaryContainer : theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]}
                >
                  <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Icon source={tile.icon} size={30} color={theme.colors.onPrimaryContainer} />
                  </View>
                  <Text variant="titleMedium" numberOfLines={2}>
                    {tile.label}
                  </Text>
                  {tile.hint ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
                      {tile.hint}
                    </Text>
                  ) : null}
                  {tile.pending ? (
                    <View style={[styles.dot, { backgroundColor: theme.colors.error }]} accessibilityLabel={t("hub.pending")} testID={`${tile.testID}-pending`} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Status({ done, icon, label, testID }: { done: boolean; icon: string; label: string; testID: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.status, { backgroundColor: done ? theme.colors.primaryContainer : theme.colors.surface, borderColor: done ? "transparent" : theme.colors.outline }]} testID={testID}>
      <Icon source={icon} size={18} color={done ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant} />
      <Text variant="labelLarge" numberOfLines={1} style={{ color: done ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant, maxWidth: 140 }}>
        {label}
      </Text>
      <Icon source={done ? "check-circle" : "clock-outline"} size={18} color={done ? theme.colors.primary : theme.colors.onSurfaceVariant} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { flexGrow: 1, flexBasis: "45%", minHeight: 132, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  dot: { position: "absolute", top: 14, right: 14, width: 12, height: 12, borderRadius: 6 },
});
