import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, SegmentedButtons, Switch, Text, TextInput } from "react-native-paper";
import { FarmKinds } from "@/components/farm-kinds";
import { Label } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { FARM_KINDS, type FarmKind } from "@/lib/farm";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** The farm's name, area, currency, what it keeps, and the profit-per-animal switch (owners and managers). */
export default function Settings() {
  const { t } = usePrefs();
  const s = useSession();
  const farm = s.current?.farm;
  const toast = useToast();
  const [name, setName] = useState(farm?.name ?? "");
  const [location, setLocation] = useState(farm?.location ?? "");
  const [currency, setCurrency] = useState(farm?.currency ?? "BDT");
  const [kinds, setKinds] = useState<Record<FarmKind, boolean>>(() => Object.fromEntries(FARM_KINDS.map((k) => [k, Boolean(farm?.[k])])) as Record<FarmKind, boolean>);
  const [profitOn, setProfitOn] = useState(farm?.show_animal_profit ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!farm) return;
    if (name.trim().length < 2) return setError(t("onb.err.name"));
    if (!Object.values(kinds).some(Boolean)) return setError(t("onb.err.kind"));
    setError(null);
    setBusy(true);
    const { error: e } = await supabase
      .from("farms")
      .update({ name: name.trim(), location: location.trim() || null, currency, ...kinds, show_animal_profit: profitOn })
      .eq("id", farm.id);
    if (e) {
      setBusy(false);
      return setError(e.message);
    }
    await s.reload();
    setBusy(false);
    toast(t("rec.saved"));
    router.back();
  };

  if (s.current?.role !== "owner" && s.current?.role !== "manager") return null;
  return (
    <FormScreen
      title={t("settings.title")}
      testID="settings"
      footer={
        <>
          <FormError message={error} />
          <Button mode="contained" onPress={save} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="settings-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <TextInput mode="outlined" label={t("onb.farmName")} value={name} onChangeText={setName} testID="settings-name" />
      <TextInput mode="outlined" label={t("onb.location")} value={location} onChangeText={setLocation} />
      <Label>{t("onb.kinds")}</Label>
      <FarmKinds value={kinds} onChange={setKinds} />
      <Label>{t("onb.currency")}</Label>
      <SegmentedButtons
        value={currency}
        onValueChange={setCurrency}
        buttons={[
          { value: "BDT", label: "৳ BDT" },
          { value: "USD", label: "$ USD" },
        ]}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
        <Text variant="bodyLarge" style={{ flex: 1 }}>
          {t("settings.animalProfit")}
        </Text>
        <Switch value={profitOn} onValueChange={setProfitOn} testID="settings-profit" />
      </View>
    </FormScreen>
  );
}
