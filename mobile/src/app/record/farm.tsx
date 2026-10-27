import { router } from "expo-router";
import { useState } from "react";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";
import { FarmKinds } from "@/components/farm-kinds";
import { Label } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { knownDbError } from "@/lib/data";
import type { FarmKind } from "@/lib/farm";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** Another farm under the same account (the plan decides how many). */
export default function NewFarm() {
  const { t } = usePrefs();
  const s = useSession();
  const toast = useToast();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [kinds, setKinds] = useState<Record<FarmKind, boolean>>({ has_dairy: true, has_fattening: false, has_goat: false, has_layer: false, has_broiler: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
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
      const known = e ? knownDbError(e.message) : null;
      return setError(known?.key === "plan.err.limit" ? t("settings.farmLimit", { n: known.n ?? 1 }) : (e?.message ?? t("common.error")));
    }
    s.setCurrentFarm(String(data));
    await s.reload();
    setBusy(false);
    toast(t("settings.farmCreated", { name: name.trim() }));
    router.dismissTo("/home");
  };

  return (
    <FormScreen
      title={t("settings.newFarm")}
      testID="new-farm"
      footer={
        <>
          <FormError message={error} />
          <Button mode="contained" onPress={create} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="new-farm-save">
            {t("onb.create")}
          </Button>
        </>
      }
    >
      <TextInput mode="outlined" label={t("onb.farmName")} value={name} onChangeText={setName} testID="new-farm-name" />
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
    </FormScreen>
  );
}
