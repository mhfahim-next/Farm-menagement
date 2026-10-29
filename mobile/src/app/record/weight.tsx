import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, HelperText, SegmentedButtons, Text } from "react-native-paper";
import { DateField, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useAnimals } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { parseNumber } from "@/lib/entries";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { tapeWeight, uuid, weightEntry } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import { useToolParams } from "@/lib/tool-params";

/** A weight from the scale, or worked out from a measuring tape (cattle). */
export default function WeightRecord() {
  // From the tape tool: the measurements (cm), or the worked-out kg for goats and sheep.
  const { animal, girth: g0, length: l0, kg: kg0 } = useLocalSearchParams<{ animal: string; girth?: string; length?: string; kg?: string }>();
  const { t, n } = usePrefs();
  const farm = useSession().current?.farm;
  const { data: animals } = useAnimals(farm?.id);
  const a = (animals ?? []).find((x) => x.id === animal);
  const cattle = (a?.species ?? "cattle") === "cattle";
  const toast = useToast();
  const { save } = useOutbox();
  const divisor = useToolParams().weight.divisor;
  const [method, setMethod] = useState(g0 && l0 ? "tape" : "scale");
  const [kg, setKg] = useState(kg0 ?? "");
  const [girth, setGirth] = useState(g0 ?? "");
  const [length, setLength] = useState(l0 ?? "");
  const [date, setDate] = useState(farmToday());
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const g = parseNumber(girth);
  const l = parseNumber(length);
  const tapeKg = g && l && Number.isFinite(g) && Number.isFinite(l) ? tapeWeight(g, l, divisor) : null;

  const submit = async () => {
    if (!farm || !animal) return;
    const r = weightEntry({ date, method, kg, girth, length }, farmToday(), divisor);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const res = await save({
      kind: "insert",
      farmId: farm.id,
      data: { table: "cattle_weights", row: { id: uuid(), cattle_id: animal, ...r.entry }, label: `${t("weight.add")} · #${a?.tag_number ?? ""} · ${n(r.entry.weight_kg, 1)} kg` },
    });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "queued" ? t("entry.queued") : t("weight.saved", { kg: n(r.entry.weight_kg, 1) }));
    router.back();
  };

  return (
    <FormScreen
      title={a ? `${t("weight.add")} · #${a.tag_number}` : t("weight.add")}
      testID="weight-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="weight-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      {cattle && (
        <SegmentedButtons
          value={method}
          onValueChange={setMethod}
          buttons={[
            { value: "scale", label: t("weight.scale"), icon: "scale", testID: "method-scale" },
            { value: "tape", label: t("weight.tape"), icon: "tape-measure", testID: "method-tape" },
          ]}
        />
      )}
      {method === "scale" || !cattle ? (
        <NumberField label={t("weight.kg")} value={kg} onChange={setKg} affix="kg" testID="weight-kg" />
      ) : (
        <View style={{ gap: 10 }}>
          <NumberField label={t("weight.girth")} value={girth} onChange={setGirth} affix="cm" testID="weight-girth" />
          <NumberField label={t("weight.length")} value={length} onChange={setLength} affix="cm" testID="weight-length" />
          <HelperText type="info" visible>
            {t("weight.tapeHint")}
          </HelperText>
          {tapeKg !== null && (
            <Text variant="titleMedium" testID="weight-tape-result">
              {t("weight.tapeResult", { kg: n(tapeKg, 1) })}
            </Text>
          )}
        </View>
      )}
      <DateField value={date} onChange={setDate} />
    </FormScreen>
  );
}
