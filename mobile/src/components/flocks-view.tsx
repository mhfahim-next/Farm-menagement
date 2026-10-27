import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Chip, FAB, List, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { fetchAllFlocks, isStaff, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { flockWeeks } from "@/lib/records";
import { useSession } from "@/lib/session";

/** Layer flocks and broiler / Sonali batches, with live birds and age; "+" to start one. */
export function FlocksView() {
  const { t, n, locale } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const farm = current?.farm;
  const options = useOptions();
  const { data, offline, reload } = useCached(farm ? `allFlocks.${farm.id}` : null, () => fetchAllFlocks(farm!.id));
  const [onlyActive, setOnlyActive] = useState(true);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const today = farmToday();
  const list = (data ?? []).filter((f) => !onlyActive || f.status === "active");
  const age = (f: (typeof list)[number]) =>
    f.kind === "layer" ? t("flock.weeks", { n: flockWeeks(f.placed_date, f.age_at_placement_weeks, today) }) : t("flock.days", { n: Math.max(0, Math.round((Date.parse(today) - Date.parse(f.placed_date)) / 86_400_000)) });

  return (
    <View style={styles.wrap} testID="flocks">
      <View style={styles.row}>
        <Chip selected={onlyActive} showSelectedCheck compact onPress={() => setOnlyActive(true)}>
          {t("animals.active")}
        </Chip>
        <Chip selected={!onlyActive} showSelectedCheck compact onPress={() => setOnlyActive(false)} testID="flocks-all">
          {t("animals.all")}
        </Chip>
      </View>
      {offline && <OfflineNote />}
      {data && list.length === 0 && <Text style={{ textAlign: "center", marginTop: 24, color: theme.colors.onSurfaceVariant }}>{t("entry.noFlocks")}</Text>}
      {list.map((f) => (
        <List.Item
          key={f.id}
          title={f.name}
          description={[t(`entry.kind.${f.kind}`), f.breed ? optionLabel(options, "flock_breed", f.breed, locale) : "", age(f), f.status !== "active" ? optionLabel(options, "flock_status", f.status, locale) : ""]
            .filter(Boolean)
            .join(" · ")}
          onPress={() => router.push({ pathname: "/flock/[id]", params: { id: f.id } })}
          left={(p) => <List.Icon {...p} icon={f.kind === "layer" ? "egg-outline" : "food-drumstick-outline"} />}
          right={() => (
            <Text variant="titleSmall" style={styles.center}>
              {t("entry.birdsCount", { n: n(f.current_count) })}
            </Text>
          )}
          style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
          testID={`flock-row-${f.name}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  item: { borderRadius: 16 },
  center: { alignSelf: "center" },
  fab: { position: "absolute", right: 16, bottom: 16 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
});

/** A whole screen of flocks: with a back arrow (from Animals) or as the farm's tab when it keeps only birds. */
export function FlocksScreen({ asTab }: { asTab?: boolean }) {
  const { t } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current } = useSession();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {asTab ? null : (
        <Appbar.Header mode="small" elevated={false}>
          <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/animals"))} accessibilityLabel={t("animal.back")} />
          <Appbar.Content title={t("flock.title")} />
        </Appbar.Header>
      )}
      <ScrollView contentContainerStyle={[styles.content, asTab ? { paddingTop: insets.top + 16 } : null]}>
        <View style={styles.inner}>
          {asTab && <Text variant="headlineSmall" accessibilityRole="header">{t("flock.title")}</Text>}
          <FlocksView />
        </View>
      </ScrollView>
      {isStaff(current?.role) && <FAB icon="plus" label={t("flock.new")} style={styles.fab} onPress={() => router.push("/record/flock")} testID="add-flock" />}
    </View>
  );
}
