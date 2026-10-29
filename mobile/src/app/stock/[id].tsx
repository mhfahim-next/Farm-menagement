import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, List, Text, useTheme } from "react-native-paper";
import { RecordMenu } from "@/components/record-menu";
import { useCached } from "@/lib/cache";
import { fetchMoves, isManager, isStaff, useStock } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { daysLeft } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useRemove } from "@/lib/outbox";
import { useToast } from "@/lib/toast";

/** One stock item: on hand, average cost, days left, and its purchases, uses and counts. */
export default function StockItemPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, n, money, date } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const currency = current?.farm.currency ?? "BDT";
  const stock = useStock(current?.farm.id);
  const moves = useCached(id ? `moves.${id}` : null, () => fetchMoves(id));
  const toast = useToast();
  const remove = useRemove();
  const { reload: reloadStock } = stock;
  const { reload: reloadMoves } = moves;
  const reload = useCallback(() => {
    reloadStock();
    reloadMoves();
  }, [reloadStock, reloadMoves]);
  useFocusEffect(reload);
  const item = (stock.data ?? []).find((i) => i.id === id);
  const unit = item ? t(`unit.${item.unit}` as "unit.kg") : "";
  const back = () => (router.canGoBack() ? router.back() : router.replace("/stock"));
  const staff = isStaff(current?.role);
  const move = (type: string) => router.push({ pathname: "/record/stock-move", params: { item: id, type } });

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="stock-item">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={item?.name ?? ""} />
        {item && staff ? <Appbar.Action icon="pencil-outline" onPress={() => router.push({ pathname: "/record/stock-item", params: { id } })} accessibilityLabel={t("rec.edit")} testID="stock-edit" /> : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {item && (
            <>
              <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
                <Card.Content style={{ gap: 4 }}>
                  <Text variant="labelLarge">{t("stock.onHand")}</Text>
                  <Text variant="headlineMedium" testID="stock-on-hand">{`${n(Number(item.on_hand), 2)} ${unit}`}</Text>
                  {item.avg_cost !== null && <Text variant="bodyMedium">{t("stock.avgCost", { amount: money(Math.round(Number(item.avg_cost) * 100) / 100, currency), unit })}</Text>}
                  {daysLeft(Number(item.on_hand), Number(item.used_30d)) !== null && (
                    <Text variant="bodyMedium">{t("stock.daysLeft", { n: daysLeft(Number(item.on_hand), Number(item.used_30d))! })}</Text>
                  )}
                  {item.low_stock !== null && <Text variant="bodySmall">{t("stock.lowAt", { n: n(Number(item.low_stock), 2), unit })}</Text>}
                </Card.Content>
              </Card>
              {staff && (
                <View style={styles.actions}>
                  <Button mode="contained" icon="cart-plus" compact onPress={() => move("purchase")} testID="stock-buy">
                    {t("stock.buy")}
                  </Button>
                  <Button mode="contained-tonal" icon="minus-circle-outline" compact onPress={() => move("use")} testID="stock-use">
                    {t("stock.use")}
                  </Button>
                  <Button mode="outlined" icon="counter" compact onPress={() => move("adjust")} testID="stock-count">
                    {t("stock.count")}
                  </Button>
                </View>
              )}
              <Card mode="outlined" style={styles.card}>
                <Card.Title title={t("stock.history")} titleVariant="titleMedium" />
                {(moves.data ?? []).length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("stock.noMoves")}</Text>
                  </Card.Content>
                ) : (
                  (moves.data ?? []).map((m) => (
                    <List.Item
                      key={m.id}
                      title={`${t(`stock.move.${m.move_type}` as "stock.move.use")} · ${Number(m.quantity) > 0 && m.move_type === "adjust" ? "+" : ""}${n(Number(m.quantity), 2)} ${unit}`}
                      description={[date(m.move_date), m.total_cost !== null ? money(Number(m.total_cost), currency) : "", m.supplier ?? "", m.log_id ? t("stock.fromLog") : ""].filter(Boolean).join(" · ")}
                      left={(p) => <List.Icon {...p} icon={m.move_type === "purchase" ? "cart-plus" : m.move_type === "use" ? "minus-circle-outline" : "counter"} />}
                      right={() =>
                        isManager(current?.role) && !m.log_id ? (
                          <RecordMenu
                            onDelete={async () => {
                              const r = await remove("inventory_moves", m.id, `${t("rec.delete")} · ${item?.name ?? ""}`);
                              toast(r.error ? `${t("common.error")} ${r.error}` : r.queued ? t("entry.queued") : t("rec.deleted"));
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
