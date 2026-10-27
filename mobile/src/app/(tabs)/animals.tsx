import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Avatar, Button, Chip, FAB, Icon, List, Searchbar, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlocksScreen } from "@/components/flocks-view";
import { OfflineNote } from "@/components/offline-note";
import { isStaff, useAnimals, useOptions, type Animal } from "@/lib/data";
import { useDescribe } from "@/lib/describe";
import { optionLabel } from "@/lib/options";
import { photoUrl } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

const isGoat = (a: Pick<Animal, "species">) => a.species === "goat" || a.species === "sheep";

/** Every animal on the farm, searchable; tap one for its page. */
export default function AnimalsTab() {
  const farm = useSession().current?.farm;
  if (farm && !farm.has_dairy && !farm.has_fattening && !farm.has_goat) return <FlocksScreen asTab />;
  return <Animals />;
}

function Animals() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current } = useSession();
  const farm = current?.farm;
  const role = current?.role;
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
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" accessibilityRole="header">
                {t("animals.title")}
              </Text>
              <Button mode="contained-tonal" icon="qrcode-scan" compact onPress={() => router.push("/scan")} testID="open-scan">
                {t("scan.button")}
              </Button>
            </View>
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
            {(farm?.has_layer || farm?.has_broiler) && (
              <Button mode="outlined" icon="egg-outline" onPress={() => router.push("/flocks")} style={styles.left} testID="open-flocks">
                {t("flock.title")}
              </Button>
            )}
            {farm?.has_fattening && (
              <Button mode="outlined" icon="weight-kilogram" onPress={() => router.push("/fattening")} style={styles.left} testID="open-fattening">
                {t("fatten.title")}
              </Button>
            )}
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
            left={(p) =>
              a.photo_path ? (
                <Avatar.Image size={44} source={{ uri: photoUrl("animal-photos", a.photo_path)! }} style={styles.center} />
              ) : (
                <List.Icon {...p} icon={isGoat(a) ? "sheep" : "cow"} />
              )
            }
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
      {isStaff(role) && (
        <FAB
          icon="plus"
          label={t("animal.addShort")}
          style={styles.fab}
          onPress={() => router.push({ pathname: "/record/animal", params: { group: hasCattle && hasGoats ? group : hasGoats ? "goats" : "cattle" } })}
          testID="add-animal"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 96, gap: 8, width: "100%", maxWidth: 720, alignSelf: "center" },
  header: { gap: 12, marginBottom: 4, paddingHorizontal: 4 },
  left: { alignSelf: "flex-start" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  count: { marginLeft: "auto" },
  item: { borderRadius: 16, paddingVertical: 6 },
  title: { fontWeight: "600" },
  center: { alignSelf: "center" },
  empty: { textAlign: "center", marginTop: 32 },
  fab: { position: "absolute", right: 16, bottom: 16 },
  emptyBox: { alignItems: "center", gap: 8, marginTop: 48, paddingHorizontal: 24 },
});
