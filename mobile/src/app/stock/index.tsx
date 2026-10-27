import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Chip, FAB, List, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { isStaff, useStock } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { daysLeft } from "@/lib/records";
import { useSession } from "@/lib/session";

/** Feed, medicine and other stock: what is left, how long it lasts, what is running low. */
export default function Stock() {
  const { t, n } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const { data, offline, reload } = useStock(current?.farm.id);
  const [showArchived, setShowArchived] = useState(false);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const items = (data ?? []).filter((i) => showArchived || !i.archived);
  const low = items.filter((i) => i.low_stock !== null && Number(i.on_hand) <= Number(i.low_stock));
  const back = () => (router.canGoBack() ? router.back() : router.replace("/more"));

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="stock">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("stock.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {low.length > 0 && (
            <Text variant="titleSmall" style={{ color: theme.colors.error }} testID="stock-low">
              {t("stock.lowN", { n: low.length })}
            </Text>
          )}
          <View style={styles.row}>
            <Chip selected={!showArchived} showSelectedCheck compact onPress={() => setShowArchived(false)}>
              {t("animals.active")}
            </Chip>
            <Chip selected={showArchived} showSelectedCheck compact onPress={() => setShowArchived(true)}>
              {t("animals.all")}
            </Chip>
          </View>
          {data && items.length === 0 && <Text style={{ textAlign: "center", marginTop: 24, color: theme.colors.onSurfaceVariant }}>{t("stock.empty")}</Text>}
          {items.map((i) => {
            const isLow = i.low_stock !== null && Number(i.on_hand) <= Number(i.low_stock);
            const left = daysLeft(Number(i.on_hand), Number(i.used_30d));
            return (
              <List.Item
                key={i.id}
                title={i.name}
                description={[t(`stock.kind.${i.kind}` as "stock.kind.feed"), left !== null ? t("stock.daysLeft", { n: left }) : "", i.archived ? t("stock.archived") : ""].filter(Boolean).join(" · ")}
                onPress={() => router.push({ pathname: "/stock/[id]", params: { id: i.id } })}
                left={(p) => <List.Icon {...p} icon={i.kind === "feed" ? "sack" : i.kind === "vaccine" ? "needle" : "pill"} color={isLow ? theme.colors.error : p.color} />}
                right={() => (
                  <Text variant="titleSmall" style={[styles.center, { color: isLow ? theme.colors.error : theme.colors.onSurface }]}>
                    {`${n(Number(i.on_hand), 2)} ${t(`unit.${i.unit}` as "unit.kg")}`}
                  </Text>
                )}
                style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
                testID={`stock-item-${i.name}`}
              />
            );
          })}
        </View>
      </ScrollView>
      {isStaff(current?.role) && <FAB icon="plus" label={t("stock.newItem")} style={styles.fab} onPress={() => router.push("/record/stock-item")} testID="add-stock-item" />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  item: { borderRadius: 16 },
  center: { alignSelf: "center" },
  fab: { position: "absolute", right: 16, bottom: 16 },
});
