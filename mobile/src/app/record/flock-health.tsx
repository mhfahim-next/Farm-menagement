import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, HelperText, TextInput } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useFlocks, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { parseNumber } from "@/lib/entries";
import { optionLabel, optionsOf } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { addDays, healthEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** A vaccine, dewormer, spray or medicine course for one or more flocks. */
export default function FlockHealth() {
  const { flock } = useLocalSearchParams<{ flock?: string }>();
  const { t, locale, date: fmt } = usePrefs();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const { data: flocks } = useFlocks(farm?.id);
  const toast = useToast();
  const { save } = useOutbox();
  const [ids, setIds] = useState<string[]>(flock ? [flock] : []);
  const [type, setType] = useState("vaccination");
  const [product, setProduct] = useState("");
  const [interval, setInterval] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(farmToday());
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const types = optionsOf(options, "health_type");
  const presets = optionsOf(options, "flock_health_preset");
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
    // Same checks as for animals; here the "animals" are flocks.
    const r = healthEntry({ cattleIds: ids, date, type, product, interval, cost, notes }, farmToday(), types.map((x) => x.value));
    if (!r.ok) return setError(t(r.error === "rec.err.animals" ? "flock.err.choose" : r.error));
    setError(null);
    setBusy(true);
    const { cattle_ids, ...v } = r.entry;
    let queued = false;
    for (const flock_id of cattle_ids) {
      const name = (flocks ?? []).find((f) => f.id === flock_id)?.name ?? "";
      const res = await save({
        kind: "insert",
        farmId: farm.id,
        data: { table: "flock_health_records", row: { id: uuid(), flock_id, ...v }, label: `${optionLabel(options, "health_type", v.record_type, locale)} · ${v.product} · ${name}` },
      });
      if (res.status === "error") {
        setBusy(false);
        setError(t("common.error"));
        setDetail(res.error);
        return;
      }
      queued ||= res.status === "queued";
    }
    setBusy(false);
    toast(queued ? t("entry.queued") : t("rec.saved"));
    router.back();
  };

  return (
    <FormScreen
      title={t("flock.healthTitle")}
      testID="flock-health-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="flock-health-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <Label>{t("flock.which")}</Label>
      <ChoiceChips options={(flocks ?? []).map((f) => ({ value: f.id, label: f.name }))} value={ids} onChange={(v) => setIds((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]))} testID="fh-flock" />
      <Label>{t("rec.presets")}</Label>
      <ChoiceChips options={presets.map((p) => ({ value: p.value, label: optionLabel(options, "flock_health_preset", p.value, locale) }))} value={[]} onChange={usePreset} testID="fpreset" />
      <Label>{t("rec.what")}</Label>
      <ChoiceChips options={types.map((o) => ({ value: o.value, label: optionLabel(options, "health_type", o.value, locale) }))} value={type} onChange={setType} testID="fhtype" />
      <TextInput mode="outlined" label={t("rec.product")} value={product} onChangeText={setProduct} testID="fh-product" />
      <NumberField label={t("rec.interval")} value={interval} onChange={setInterval} affix={t("rec.daysShort")} />
      <HelperText type="info" visible>
        {next ? t("rec.nextDue", { date: fmt(next) }) : t("rec.intervalHint")}
      </HelperText>
      <DateField value={date} onChange={setDate} />
      <NumberField label={t("rec.cost")} value={cost} onChange={setCost} icon="cash" />
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} />
    </FormScreen>
  );
}
