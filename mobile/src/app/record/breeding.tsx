import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { AnimalPicker, ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useAnimals, useOptions, useRules } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useDescribe } from "@/lib/describe";
import { optionLabel, optionsOf } from "@/lib/options";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { breedingEntry, calfCategories, EVENT_TYPES, PREGNANCY_RESULTS, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

const FEMALE = ["cow", "heifer", "doe", "doeling", "ewe", "ewe_lamb"];

/** Heat, insemination, pregnancy check, birth (with the newborn) or dry off, for one female. */
export default function BreedingRecord() {
  const { animal, id: eventId } = useLocalSearchParams<{ animal?: string; id?: string }>();
  const { t, locale, date: fmt } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const rules = useRules();
  const { data: animals } = useAnimals(farm?.id);
  const describe = useDescribe(options);
  const { save } = useOutbox();
  const toast = useToast();
  const females = useMemo(() => (animals ?? []).filter((a) => a.status === "active" && FEMALE.includes(a.category)), [animals]);

  const [id, setId] = useState<string | null>(animal ?? null);
  const cow = (animals ?? []).find((a) => a.id === id) ?? null;
  const species = cow?.species ?? "cattle";
  const [type, setType] = useState<string>("heat");
  const [date, setDate] = useState(farmToday());
  const [semen, setSemen] = useState("");
  const [technician, setTechnician] = useState("");
  const [cost, setCost] = useState("");
  const [signs, setSigns] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [calfTag, setCalfTag] = useState("");
  const [calfName, setCalfName] = useState("");
  const [calfCategory, setCalfCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Editing a saved event (its type stays; a birth's newborn is edited on its own page).
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("breeding_events")
        .select("cattle_id, event_type, event_date, bull_or_semen, technician, cost, heat_signs, result, notes")
        .eq("id", eventId)
        .maybeSingle();
      if (cancelled || !data) return;
      const e = data as { cattle_id: string; event_type: string; event_date: string; bull_or_semen: string | null; technician: string | null; cost: number | null; heat_signs: string | null; result: string | null; notes: string | null };
      setId(e.cattle_id);
      setType(e.event_type);
      setDate(e.event_date);
      setSemen(e.bull_or_semen ?? "");
      setTechnician(e.technician ?? "");
      setCost(e.cost !== null ? String(Number(e.cost)) : "");
      setSigns(e.heat_signs ? e.heat_signs.split(", ").filter(Boolean) : []);
      setResult(e.result ?? "");
      setNotes(e.notes ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const calfTypes = calfCategories(species);
  const input = { cattleId: id ?? "", species, type, date, semen, technician, cost, heatSigns: signs, result, notes, calfTag, calfName, calfCategory: calfCategory || calfTypes[0] };
  const preview = breedingEntry(input, farmToday(), rules);
  const label = (list: string, v: string) => optionLabel(options, list, v, locale);

  const submit = async () => {
    if (!farm) return;
    const r = breedingEntry(input, farmToday(), rules);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    if (eventId) {
      const { calf: _calf, cattle_id: _c, event_type: _t, ...fields } = r.entry;
      const { error: e } = await supabase.from("breeding_events").update(fields).eq("id", eventId);
      setBusy(false);
      if (e) {
        setError(t("common.error"));
        setDetail(e.message);
        return;
      }
      toast(t("rec.saved"));
      return router.back();
    }
    const text = `${label("breeding_event", r.entry.event_type)} · #${cow?.tag_number ?? ""}`;
    const res = await save({ kind: "breeding", farmId: farm.id, data: { ...r.entry, id: uuid(), calf_id: r.entry.calf ? uuid() : null, label: text } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    const msg = r.entry.calf
      ? t("rec.calfAdded", { tag: r.entry.calf.tag_number })
      : r.next?.kind === "calving"
        ? t("rec.expectedBirth", { date: fmt(r.next.date) })
        : r.next?.kind === "heat"
          ? t("rec.nextHeat", { date: fmt(r.next.date) })
          : t("rec.saved");
    toast(res.status === "saved" ? msg : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={eventId ? t("rec.editTitle") : t("rec.breedingTitle")}
      testID="breeding-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="breeding-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      {cow && (animal || eventId) ? (
        <Text variant="titleMedium" testID="breeding-animal">{`#${cow.tag_number}${cow.name ? ` · ${cow.name}` : ""} · ${describe(cow)}`}</Text>
      ) : (
        <>
          <Label>{t("rec.female")}</Label>
          <AnimalPicker animals={females} selected={id ? [id] : []} onChange={(v) => setId(v[0] ?? null)} multi={false} describe={describe} />
        </>
      )}
      <Label>{t("rec.event")}</Label>
      <ChoiceChips
        options={EVENT_TYPES.filter((v) => !eventId || v === type).map((v) => ({ value: v, label: label("breeding_event", v) }))}
        value={type}
        onChange={(v) => !eventId && setType(v)}
        testID="event"
      />
      <DateField value={date} onChange={setDate} />

      {type === "heat" && (
        <>
          <Label>{t("rec.heatSigns")}</Label>
          <ChoiceChips
            options={optionsOf(options, "heat_sign").map((o) => ({ value: o.value, label: label("heat_sign", o.value) }))}
            value={signs}
            onChange={(v) => setSigns((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
            testID="sign"
          />
        </>
      )}
      {type === "insemination" && (
        <>
          <TextInput mode="outlined" label={t("rec.semen")} value={semen} onChangeText={setSemen} testID="breeding-semen" />
          <TextInput mode="outlined" label={t("rec.technician")} value={technician} onChangeText={setTechnician} />
        </>
      )}
      {type === "pregnancy_check" && (
        <>
          <Label>{t("rec.result")}</Label>
          <ChoiceChips options={PREGNANCY_RESULTS.map((v) => ({ value: v, label: label("pregnancy_result", v) }))} value={result} onChange={setResult} testID="result" />
        </>
      )}
      {type === "calving" && !eventId && (
        <Card mode="outlined" style={{ borderRadius: 16 }}>
          <Card.Title title={t("rec.newborn")} subtitle={t("rec.newbornHint")} subtitleNumberOfLines={2} />
          <Card.Content style={{ gap: 10 }}>
            <TextInput mode="outlined" label={t("rec.calfTag")} value={calfTag} onChangeText={setCalfTag} autoCapitalize="characters" testID="calf-tag" />
            <TextInput mode="outlined" label={t("rec.calfName")} value={calfName} onChangeText={setCalfName} />
            <ChoiceChips options={calfTypes.map((v) => ({ value: v, label: label("cattle_category", v) }))} value={calfCategory || calfTypes[0]} onChange={setCalfCategory} testID="calf-type" />
          </Card.Content>
        </Card>
      )}
      {(type === "insemination" || type === "pregnancy_check") && <NumberField label={t("rec.cost")} value={cost} onChange={setCost} icon="cash" />}
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline />
      {preview.ok && preview.next && (
        <Text variant="bodyMedium" style={{ color: theme.colors.primary }} testID="breeding-next">
          {preview.next.kind === "calving" ? t("rec.expectedBirth", { date: fmt(preview.next.date) }) : t("rec.nextHeat", { date: fmt(preview.next.date) })}
        </Text>
      )}
    </FormScreen>
  );
}
