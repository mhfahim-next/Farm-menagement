import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Button, HelperText, TextInput } from "react-native-paper";
import { AnimalPicker, ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useAnimals, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useDescribe } from "@/lib/describe";
import { parseNumber } from "@/lib/entries";
import { optionLabel, optionsOf } from "@/lib/options";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { addDays, healthEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Presets meant for goats & sheep (the rest are for cattle). */
const SMALL_RUMINANT = ["ppr", "goat_pox", "et", "goat_deworm"];

/** A vaccine, dewormer, spray or treatment for one animal or many at once. */
export default function HealthRecord() {
  const { animal } = useLocalSearchParams<{ animal?: string }>();
  const { t, locale, date: fmt } = usePrefs();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const { data: animals } = useAnimals(farm?.id);
  const describe = useDescribe(options);
  const { save } = useOutbox();
  const toast = useToast();
  const active = useMemo(() => (animals ?? []).filter((a) => a.status === "active"), [animals]);

  const [ids, setIds] = useState<string[]>(animal ? [animal] : []);
  const [date, setDate] = useState(farmToday());
  const [type, setType] = useState("vaccination");
  const [product, setProduct] = useState("");
  const [interval, setInterval] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const types = optionsOf(options, "health_type");
  const presets = optionsOf(options, "health_preset").filter((p) => (SMALL_RUMINANT.includes(p.value) ? farm?.has_goat : farm?.has_dairy || farm?.has_fattening));
  const days = parseNumber(interval);
  const next = days && Number.isInteger(days) && days > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) ? addDays(date, days) : null;

  const usePreset = (value: string) => {
    const p = presets.find((x) => x.value === value)?.meta as { product?: string; record_type?: string; interval_days?: number } | undefined;
    if (!p) return;
    if (p.record_type) setType(p.record_type);
    if (p.product) setProduct(p.product);
    setInterval(p.interval_days ? String(p.interval_days) : "");
  };

  const submit = async () => {
    if (!farm) return;
    const r = healthEntry({ cattleIds: ids, date, type, product, interval, cost, notes }, farmToday(), types.map((x) => x.value));
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    const label = `${optionLabel(options, "health_type", r.entry.record_type, locale)} · ${r.entry.product} · ${t("rec.animalsN", { n: r.entry.cattle_ids.length })}`;
    const res = await save({ kind: "health", farmId: farm.id, data: { ...r.entry, ids: r.entry.cattle_ids.map(() => uuid()), label } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "saved" ? t("rec.healthSaved", { n: r.entry.cattle_ids.length }) : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={t("rec.healthTitle")}
      testID="health-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="health-save">
            {ids.length > 1 ? t("rec.saveForN", { n: ids.length }) : t("rec.save")}
          </Button>
        </>
      }
    >
      {presets.length > 0 && (
        <>
          <Label>{t("rec.presets")}</Label>
          <ChoiceChips options={presets.map((p) => ({ value: p.value, label: optionLabel(options, "health_preset", p.value, locale) }))} value={[]} onChange={usePreset} testID="preset" />
        </>
      )}
      <Label>{t("rec.what")}</Label>
      <ChoiceChips options={types.map((o) => ({ value: o.value, label: optionLabel(options, "health_type", o.value, locale) }))} value={type} onChange={setType} testID="htype" />
      <TextInput mode="outlined" label={t("rec.product")} value={product} onChangeText={setProduct} testID="health-product" />
      <NumberField label={t("rec.interval")} value={interval} onChange={setInterval} affix={t("rec.daysShort")} testID="health-interval" />
      <HelperText type="info" visible>
        {next ? t("rec.nextDue", { date: fmt(next) }) : t("rec.intervalHint")}
      </HelperText>
      <DateField value={date} onChange={setDate} />
      <Label>{t("rec.animals")}</Label>
      <AnimalPicker animals={active} selected={ids} onChange={setIds} multi describe={describe} />
      <NumberField label={t("rec.cost")} value={cost} onChange={setCost} icon="cash" testID="health-cost" />
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline testID="health-notes" />
    </FormScreen>
  );
}
