import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Chip, Icon, List, Searchbar, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineNote } from "@/components/offline-note";
import { useAnimals, useOptions, type Animal } from "@/lib/data";
import { useDescribe } from "@/lib/describe";
import { optionLabel } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

const isGoat = (a: Pick<Animal, "species">) => a.species === "goat" || a.species === "sheep";

/** Every animal on the farm, searchable; tap one for its page. */
export default function Animals() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const { data, offline, loading, reload } = useAnimals(farm?.id);
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const hasCattle = Boolean(farm?.has_dairy || farm?.has_fattening);
  const hasGoats = Boolean(farm?.has_goat);
  const [group, setGroup] = useState<"cattle" | "goats">(hasCattle || !hasGoats ? "cattle" : "goats");
  const [refreshing, setRefreshing] = useState(false);
  // Up to date after a sale or a birth recorded elsewhere in the app.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (a) =>
        (!onlyActive || a.status === "active") &&
        (!(hasCattle && hasGoats) || (group === "goats") === isGoat(a)) &&
        (!needle || a.tag_number.toLowerCase().includes(needle) || (a.name ?? "").toLowerCase().includes(needle)),
    );
  }, [data, q, onlyActive, group, hasCattle, hasGoats]);

  const describe = useDescribe(options);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="animals">
      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headlineSmall" accessibilityRole="header">
              {t("animals.title")}
            </Text>
            <Searchbar placeholder={t("animals.search")} value={q} onChangeText={setQ} mode="bar" testID="animal-search" />
            {hasCattle && hasGoats && (
              <SegmentedButtons
                value={group}
                onValueChange={(v) => setGroup(v as "cattle" | "goats")}
                buttons={[
                  { value: "cattle", label: t("animals.cattle"), icon: "cow", testID: "group-cattle" },
                  { value: "goats", label: t("animals.goats"), icon: "sheep", testID: "group-goats" },
                ]}
              />
            )}
            <View style={styles.row}>
              <Chip selected={onlyActive} showSelectedCheck onPress={() => setOnlyActive(true)} compact>
                {t("animals.active")}
              </Chip>
              <Chip selected={!onlyActive} showSelectedCheck onPress={() => setOnlyActive(false)} compact testID="animals-all">
                {t("animals.all")}
              </Chip>
              <Text variant="labelLarge" style={[styles.count, { color: theme.colors.onSurfaceVariant }]} testID="animal-count">
                {list.length === 1 ? t("animals.count_one") : t("animals.count", { n: list.length })}
              </Text>
            </View>
            {offline && <OfflineNote />}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>{t("common.loading")}</Text>
          ) : (
            <View style={styles.emptyBox}>
              <Icon source="cow-off" size={40} color={theme.colors.outline} />
              <Text variant="titleMedium">{q ? t("animals.noMatch", { q }) : t("animals.empty")}</Text>
              {!q && (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
                  {t("animals.emptyBody")}
                </Text>
              )}
            </View>
          )
        }
        renderItem={({ item: a }) => (
          <List.Item
            title={`#${a.tag_number}${a.name ? ` · ${a.name}` : ""}`}
            titleStyle={styles.title}
            description={describe(a)}
            onPress={() => router.push({ pathname: "/animal/[id]", params: { id: a.id } })}
            style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
            left={(p) => <List.Icon {...p} icon={isGoat(a) ? "sheep" : "cow"} />}
            right={(p) =>
              a.status !== "active" ? (
                <Chip compact style={styles.center}>
                  {optionLabel(options, "cattle_status", a.status, locale)}
                </Chip>
              ) : a.is_fattening ? (
                <Chip compact icon="weight-kilogram" style={styles.center}>
                  {t("animals.fattening")}
                </Chip>
              ) : (
                <List.Icon {...p} icon="chevron-right" />
              )
            }
            testID={`animal-${a.tag_number}`}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 8, width: "100%", maxWidth: 720, alignSelf: "center" },
  header: { gap: 12, marginBottom: 4, paddingHorizontal: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  count: { marginLeft: "auto" },
  item: { borderRadius: 16, paddingVertical: 6 },
  title: { fontWeight: "600" },
  center: { alignSelf: "center" },
  empty: { textAlign: "center", marginTop: 32 },
  emptyBox: { alignItems: "center", gap: 8, marginTop: 48, paddingHorizontal: 24 },
});
