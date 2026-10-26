import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Icon, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import { FARM_KINDS, KIND_ICON, type FarmKind } from "@/lib/farm";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/** Step 1 for a new account: name the farm and say what it keeps. */
export default function FarmSetup() {
  const { t } = usePrefs();
  const theme = useTheme();
  const router = useRouter();
  const s = useSession();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [kinds, setKinds] = useState<Record<FarmKind, boolean>>({ has_dairy: true, has_fattening: false, has_goat: false, has_layer: false, has_broiler: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (s.profile?.account_type === "doctor") {
    return (
      <Screen testID="doctor-note">
        <Icon source="stethoscope" size={56} color={theme.colors.primary} />
        <Text variant="headlineSmall" style={styles.mt}>
          {t("onb.doctorTitle")}
        </Text>
        <Text variant="bodyLarge" style={[styles.mt, { color: theme.colors.onSurfaceVariant }]}>
          {t("onb.doctorBody")}
        </Text>
        <Button mode="outlined" style={styles.mt} onPress={s.signOut}>
          {t("more.logout")}
        </Button>
      </Screen>
    );
  }

  const submit = async () => {
    if (name.trim().length < 2) return setError(t("onb.err.name"));
    if (!Object.values(kinds).some(Boolean)) return setError(t("onb.err.kind"));
    setError(null);
    setBusy(true);
    const { data, error: e } = await supabase.rpc("create_farm", {
      p_name: name.trim(),
      p_location: location.trim() || null,
      p_currency: currency,
      p_has_dairy: kinds.has_dairy,
      p_has_layer: kinds.has_layer,
      p_has_goat: kinds.has_goat,
      p_has_fattening: kinds.has_fattening,
      p_has_broiler: kinds.has_broiler,
    });
    if (e || !data) {
      setBusy(false);
      return setError(e?.message?.includes("DOCTOR_ACCOUNT") ? t("onb.doctorBody") : t("common.error"));
    }
    s.setCurrentFarm(String(data));
    s.setPlanPending(true);
    await s.reload();
    setBusy(false);
    router.replace("/onboarding/plan");
  };

  return (
    <Screen
      testID="farm-setup"
      footer={
        <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="farm-submit">
          {t("onb.create")}
        </Button>
      }
    >
      <Steps step={1} />
      <Text variant="headlineMedium" accessibilityRole="header">
        {t("onb.farmTitle")}
      </Text>
      <Text variant="bodyLarge" style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        {t("onb.farmSub")}
      </Text>
      <View style={styles.form}>
        <TextInput mode="outlined" label={t("onb.farmName")} value={name} onChangeText={setName} left={<TextInput.Icon icon="barn" />} testID="farm-name" />
        <TextInput mode="outlined" label={t("onb.location")} value={location} onChangeText={setLocation} left={<TextInput.Icon icon="map-marker-outline" />} />

        <Text variant="titleMedium" style={styles.label}>
          {t("onb.kinds")}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: -6 }}>
          {t("onb.kindsHint")}
        </Text>
        <View style={styles.kinds} accessibilityRole="list">
          {FARM_KINDS.map((k) => {
            const on = kinds[k];
            return (
              <Pressable
                key={k}
                onPress={() => setKinds({ ...kinds, [k]: !on })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                testID={`kind-${k}`}
                style={[
                  styles.kind,
                  {
                    backgroundColor: on ? theme.colors.primaryContainer : theme.colors.surface,
                    borderColor: on ? theme.colors.primary : theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={[styles.kindIcon, { backgroundColor: on ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                  <Icon source={KIND_ICON[k]} size={24} color={on ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.flex}>
                  <Text variant="titleSmall">{t(`kind.${k}`)}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t(`kind.${k}.body`)}
                  </Text>
                </View>
                <Icon source={on ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={on ? theme.colors.primary : theme.colors.outline} />
              </Pressable>
            );
          })}
        </View>

        <Text variant="titleMedium" style={styles.label}>
          {t("onb.currency")}
        </Text>
        <SegmentedButtons
          value={currency}
          onValueChange={setCurrency}
          buttons={[
            { value: "BDT", label: "৳ BDT" },
            { value: "USD", label: "$ USD" },
          ]}
        />
        <FormError message={error} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mt: { marginTop: 16 },
  sub: { marginTop: 6 },
  form: { gap: 12, marginTop: 20 },
  label: { marginTop: 8 },
  kinds: { gap: 10 },
  kind: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  kindIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  btn: { height: 52 },
});
