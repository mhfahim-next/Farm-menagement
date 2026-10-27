import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Icon, List, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineNote } from "@/components/offline-note";
import { SyncBar } from "@/components/sync-bar";
import { useCached } from "@/lib/cache";
import { fetchSales, useBuyers } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

/** Who owes what, the latest sales, and buttons to record a sale or a payment. */
export default function Sales() {
  const { t, n, money, date } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const farm = useSession().current?.farm;
  const currency = farm?.currency ?? "BDT";
  const buyers = useBuyers(farm?.id);
  const sales = useCached(farm ? `sales.${farm.id}` : null, () => fetchSales(farm!.id));
  const [refreshing, setRefreshing] = useState(false);
  const { reload: reloadBuyers } = buyers;
  const { reload: reloadSales } = sales;

  // Fresh numbers each time the tab is opened (after a sale or payment).
  useFocusEffect(
    useCallback(() => {
      reloadBuyers();
      reloadSales();
    }, [reloadBuyers, reloadSales]),
  );

  const list = [...(buyers.data ?? [])].sort((a, b) => Number(b.due) - Number(a.due) || a.name.localeCompare(b.name));
  const totalDue = list.reduce((s, b) => s + Math.max(0, Number(b.due)), 0);
  const names = new Map(list.map((b) => [b.id, b.name]));

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadBuyers(), reloadSales()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
      testID="sales"
    >
      <View style={styles.inner}>
        <Text variant="headlineSmall" accessibilityRole="header">
          {t("sale.tabTitle")}
        </Text>
        <SyncBar />
        {(buyers.offline || sales.offline) && <OfflineNote />}
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.dueBox}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>
              {t("sale.totalDue")}
            </Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onPrimaryContainer }} testID="total-due">
              {money(totalDue, currency)}
            </Text>
          </Card.Content>
        </Card>
        <View style={styles.actions}>
          <Button mode="contained" icon="cart-plus" onPress={() => router.push("/record/sale")} style={styles.flex} contentStyle={styles.btn} testID="new-sale">
            {t("sale.newSale")}
          </Button>
          <Button mode="contained-tonal" icon="account-plus-outline" onPress={() => router.push("/record/buyer")} style={styles.flex} contentStyle={styles.btn} testID="new-buyer">
            {t("sale.newBuyer")}
          </Button>
        </View>

        <Text variant="titleMedium" style={styles.section}>
          {t("sale.buyers")}
        </Text>
        {list.length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("sale.noBuyers")}</Text>
        ) : (
          list.map((b) => (
            <List.Item
              key={b.id}
              title={b.name}
              description={b.last_sale ? t("sale.lastSale", { date: date(b.last_sale) }) : (b.phone ?? "")}
              onPress={() => router.push({ pathname: "/buyer/[id]", params: { id: b.id } })}
              left={(p) => <List.Icon {...p} icon="account-outline" />}
              right={() => (
                <Text variant="titleSmall" style={[styles.center, { color: Number(b.due) > 0 ? theme.colors.error : theme.colors.onSurfaceVariant }]}>
                  {Number(b.due) > 0 ? money(Number(b.due), currency) : t("sale.noDue")}
                </Text>
              )}
              style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
              testID={`buyer-${b.name}`}
            />
          ))
        )}

        <Text variant="titleMedium" style={styles.section}>
          {t("sale.recent")}
        </Text>
        {(sales.data?.sales ?? []).length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("sale.noSales")}</Text>
        ) : (
          (sales.data?.sales ?? []).slice(0, 15).map((s) => (
            <List.Item
              key={s.id}
              title={`${t(`product.${s.product}` as "product.milk")} · ${n(Number(s.quantity), 2)} ${t(`unit.${s.unit}` as "unit.kg")}`}
              description={`${date(s.sale_date)} · ${s.buyer_id ? (names.get(s.buyer_id) ?? "") : t("sale.cash")}`}
              left={(p) => <List.Icon {...p} icon="receipt-text-outline" />}
              right={() => (
                <View style={styles.center}>
                  <Text variant="titleSmall">{money(Number(s.amount), currency)}</Text>
                  {Number(s.amount) > Number(s.paid_amount) && (
                    <Text variant="labelSmall" style={{ color: theme.colors.error }}>
                      {t("sale.dueN", { amount: money(Number(s.amount) - Number(s.paid_amount), currency) })}
                    </Text>
                  )}
                </View>
              )}
            />
          ))
        )}
        {list.length === 0 && (sales.data?.sales ?? []).length === 0 && (
          <View style={styles.hint}>
            <Icon source="information-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.flex, { color: theme.colors.onSurfaceVariant }]}>
              {t("sale.hint")}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
  card: { borderRadius: 20 },
  dueBox: { gap: 4 },
  actions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  btn: { height: 48 },
  section: { marginTop: 12 },
  item: { borderRadius: 16 },
  center: { alignSelf: "center", alignItems: "flex-end" },
  hint: { flexDirection: "row", gap: 8, marginTop: 8 },
});
