import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Chip, Dialog, Icon, Portal, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import type { Plan } from "@/lib/farm";
import { limitLines, monthlyPrice, planName, popularKey } from "@/lib/plans";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/**
 * Step 2 for a new account: choose a plan. Free starts at once. A paid plan sends
 * an upgrade request (the same one the website sends); the farm runs on Free
 * until a super admin activates it after payment.
 */
export default function ChoosePlan() {
  const { t, money, locale } = usePrefs();
  const theme = useTheme();
  const s = useSession();
  const farm = s.current?.farm;
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState<{ plan: string; already: boolean } | null>(null);

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data, error: e }) => {
        if (e) setError(t("common.network"));
        setPlans((data ?? []) as Plan[]);
      });
  }, [t]);

  const done = () => s.setPlanPending(false);

  const choose = async (p: Plan) => {
    if (!farm) return;
    if (Number(p.price_monthly) <= 0) return done();
    setError(null);
    setBusy(p.key);
    const { error: e } = await supabase.from("requests").insert({ farm_id: farm.id, kind: "upgrade", plan_requested: p.key, message: "Chosen in the Android app at sign-up" });
    setBusy(null);
    if (e && e.code !== "23505") return setError(t("common.error"));
    setRequested({ plan: planName(p, locale), already: e?.code === "23505" });
  };

  const currency = farm?.currency ?? "BDT";
  const popular = plans ? popularKey(plans) : null;

  return (
    <Screen testID="plan-select">
      <Steps step={2} />
      <Text variant="headlineMedium" accessibilityRole="header">
        {t("plan.title")}
      </Text>
      <Text variant="bodyLarge" style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t("plan.sub")}
      </Text>
      <FormError message={error} />
      {plans === null ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <View style={styles.list}>
          {plans.map((p) => {
            const price = monthlyPrice(p, currency);
            const free = Number(p.price_monthly) <= 0;
            const isPopular = p.key === popular;
            if (!free && price === null) return null;
            return (
              <Card
                key={p.key}
                mode="outlined"
                style={[styles.card, isPopular && { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: theme.colors.elevation.level1 }]}
                testID={`plan-${p.key}`}
              >
                <Card.Content style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text variant="titleLarge">{planName(p, locale)}</Text>
                    {isPopular && (
                      <Chip compact icon="star" style={{ backgroundColor: theme.colors.primaryContainer }} textStyle={{ color: theme.colors.onPrimaryContainer }}>
                        {t("plan.popular")}
                      </Chip>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                      {money(free ? 0 : (price ?? 0), currency)}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t("plan.perMonth")}
                    </Text>
                  </View>
                  <View style={styles.features}>
                    {limitLines(p).map((l) => (
                      <Feature key={l.key} text={t(l.key, l.n === undefined ? undefined : { n: l.n })} />
                    ))}
                    {p.can_export && <Feature text={t("plan.export")} />}
                    {p.priority_support && <Feature text={t("plan.priority")} />}
                    {p.max_ai_prompts !== null && p.max_ai_prompts > 0 && <Feature text={t("plan.ai", { n: p.max_ai_prompts })} />}
                  </View>
                  <Button
                    mode={isPopular ? "contained" : free ? "outlined" : "contained-tonal"}
                    onPress={() => choose(p)}
                    loading={busy === p.key}
                    disabled={busy !== null}
                    contentStyle={styles.btn}
                    testID={`choose-${p.key}`}
                  >
                    {free ? t("plan.startFree") : t("plan.choose", { plan: planName(p, locale) })}
                  </Button>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      <Portal>
        <Dialog visible={requested !== null} onDismiss={done}>
          <Dialog.Icon icon="check-circle-outline" />
          <Dialog.Title style={styles.center}>{requested?.already ? t("plan.requestExists") : t("plan.requestTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("plan.requestBody", { plan: requested?.plan ?? "" })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={done} testID="plan-continue">
              {t("plan.continue")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

function Feature({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.feature}>
      <Icon source="check" size={18} color={theme.colors.primary} />
      <Text variant="bodyMedium" style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, marginBottom: 8 },
  loading: { marginTop: 48 },
  list: { gap: 14, marginTop: 12 },
  card: { borderRadius: 20 },
  cardBody: { gap: 10, paddingVertical: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  features: { gap: 6, marginVertical: 4 },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  btn: { height: 48 },
  center: { textAlign: "center" },
});
