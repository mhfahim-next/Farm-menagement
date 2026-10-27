import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, List, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { RecordMenu } from "@/components/record-menu";
import { deleteRow, fetchSales, isManager, useBuyers } from "@/lib/data";
import { useToast } from "@/lib/toast";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

/** One buyer: what they owe and their sales and payments, newest first. */
export default function BuyerPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, n, money, date } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const currency = farm?.currency ?? "BDT";
  const buyers = useBuyers(farm?.id);
  const history = useCached(farm && id ? `buyer.${id}` : null, () => fetchSales(farm!.id, id));
  const { reload: reloadBuyers } = buyers;
  const { reload: reloadHistory } = history;
  useFocusEffect(
    useCallback(() => {
      reloadBuyers();
      reloadHistory();
    }, [reloadBuyers, reloadHistory]),
  );
  const b = (buyers.data ?? []).find((x) => x.id === id);
  const manager = isManager(useSession().current?.role);
  const toast = useToast();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/sales"));

  const lines = [
    ...(history.data?.sales ?? []).map((s) => ({
      key: `s${s.id}`,
      date: s.sale_date,
      title: `${t(`product.${s.product}` as "product.milk")} · ${n(Number(s.quantity), 2)} ${t(`unit.${s.unit}` as "unit.kg")}`,
      amount: Number(s.amount),
      note: Number(s.paid_amount) > 0 ? t("sale.paidN", { amount: money(Number(s.paid_amount), currency) }) : "",
      icon: "receipt-text-outline",
      payment: false,
      id: s.id,
    })),
    ...(history.data?.payments ?? []).map((p) => ({
      key: `p${p.id}`,
      date: p.pay_date,
      title: `${t("sale.payment")} · ${t(`pay.${p.method}` as "pay.cash")}`,
      amount: Number(p.amount),
      note: "",
      icon: "cash-check",
      payment: true,
      id: p.id,
    })),
  ].sort((x, y) => y.date.localeCompare(x.date));

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="buyer-page">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={b?.name ?? ""} />
        {b?.phone ? <Appbar.Action icon="phone" onPress={() => Linking.openURL(`tel:${b.phone}`)} accessibilityLabel={t("sale.call")} /> : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {(buyers.offline || history.offline) && <OfflineNote />}
          {b && (
            <Card mode="contained" style={[styles.card, { backgroundColor: Number(b.due) > 0 ? theme.colors.errorContainer : theme.colors.primaryContainer }]}>
              <Card.Content>
                <Text variant="labelLarge">{t("sale.owes")}</Text>
                <Text variant="headlineMedium" testID="buyer-due">
                  {money(Math.max(0, Number(b.due)), currency)}
                </Text>
              </Card.Content>
            </Card>
          )}
          <View style={styles.actions}>
            <Button mode="contained" icon="cash-check" style={styles.flex} contentStyle={styles.btn} onPress={() => router.push({ pathname: "/record/payment", params: { buyer: id } })} testID="buyer-payment">
              {t("sale.payment")}
            </Button>
            <Button mode="contained-tonal" icon="cart-plus" style={styles.flex} contentStyle={styles.btn} onPress={() => router.push({ pathname: "/record/sale", params: { buyer: id } })} testID="buyer-sale">
              {t("sale.newSale")}
            </Button>
          </View>
          <Text variant="titleMedium" style={{ marginTop: 8 }}>
            {t("sale.history")}
          </Text>
          {lines.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("sale.noSales")}</Text>
          ) : (
            lines.map((l) => (
              <List.Item
                key={l.key}
                title={l.title}
                description={[date(l.date), l.note].filter(Boolean).join(" · ")}
                left={(p) => <List.Icon {...p} icon={l.icon} color={l.payment ? theme.colors.primary : p.color} />}
                right={() => (
                  <View style={styles.right}>
                    <Text variant="titleSmall" style={[styles.center, { color: l.payment ? theme.colors.primary : theme.colors.onSurface }]}>
                      {`${l.payment ? "−" : ""}${money(l.amount, currency)}`}
                    </Text>
                    {manager && (
                      <RecordMenu
                        onDelete={async () => {
                          const err = await deleteRow(l.payment ? "buyer_payments" : "sales", l.id);
                          toast(err ? `${t("common.error")} ${err}` : t("rec.deleted"));
                          reloadBuyers();
                          reloadHistory();
                        }}
                        testID={`line-menu-${l.key}`}
                      />
                    )}
                  </View>
                )}
              />
            ))
          )}
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
  actions: { flexDirection: "row", gap: 10 },
  btn: { height: 48 },
  center: { alignSelf: "center" },
  right: { flexDirection: "row", alignItems: "center" },
});
