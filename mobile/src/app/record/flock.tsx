import { router } from "expo-router";
import { useState } from "react";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { knownDbError, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel, optionsOf } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { flockNew, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Start a layer flock, or a broiler / Sonali batch. */
export default function NewFlock() {
  const { t, locale } = usePrefs();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const toast = useToast();
  const { save } = useOutbox();
  const kinds = [...(farm?.has_layer ? ["layer"] : []), ...(farm?.has_broiler ? ["broiler", "sonali"] : [])];
  const [kind, setKind] = useState(kinds[0] ?? "layer");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [shed, setShed] = useState("");
  const [date, setDate] = useState(farmToday());
  const [count, setCount] = useState("");
  const [ageWeeks, setAgeWeeks] = useState("");
  const [chickPrice, setChickPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const meat = kind !== "layer";
  const breeds = optionsOf(options, "flock_breed").filter((o) => (o.meta?.kind === "meat") === meat || o.value === "Other" || (kind === "sonali" && o.value === "Sonali"));

  const submit = async () => {
    if (!farm) return;
    const r = flockNew({ name, kind, breed, shed, date, count, ageWeeks, chickPrice }, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const id = uuid();
    const res = await save({ kind: "insert", farmId: farm.id, data: { table: "flocks", row: { id, ...r.entry }, label: `${t("flock.new")} · ${r.entry.name}` } });
    setBusy(false);
    if (res.status === "error") {
      const known = knownDbError(res.error);
      setError(known ? t(known.key, { n: known.n ?? 0, tag: "" }) : t("common.error"));
      setDetail(known ? null : res.error);
      return;
    }
    toast(res.status === "queued" ? t("entry.queued") : t("flock.added", { name: r.entry.name }));
    router.replace({ pathname: "/flock/[id]", params: { id } });
  };

  return (
    <FormScreen
      title={t("flock.new")}
      testID="flock-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="flock-new-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      {kinds.length > 1 && (
        <SegmentedButtons
          value={kind}
          onValueChange={(v) => {
            setKind(v);
            setBreed("");
          }}
          buttons={kinds.map((k) => ({ value: k, label: t(`entry.kind.${k}` as "entry.kind.layer"), testID: `kind-${k}` }))}
        />
      )}
      <TextInput mode="outlined" label={t("flock.name")} value={name} onChangeText={setName} testID="flock-name" />
      <NumberField label={meat ? t("flock.chicks") : t("flock.birds")} value={count} onChange={setCount} testID="flock-count" />
      {meat ? (
        <NumberField label={t("flock.chickPrice")} value={chickPrice} onChange={setChickPrice} icon="cash" testID="flock-chick-price" />
      ) : (
        <NumberField label={t("flock.ageWeeks")} value={ageWeeks} onChange={setAgeWeeks} affix={t("flock.weeksShort")} testID="flock-age" />
      )}
      <Label>{t("animal.breed")}</Label>
      <ChoiceChips options={breeds.map((o) => ({ value: o.value, label: optionLabel(options, "flock_breed", o.value, locale) }))} value={breed} onChange={(v) => setBreed(v === breed ? "" : v)} testID="fbreed" />
      <TextInput mode="outlined" label={t("flock.shed")} value={shed} onChangeText={setShed} />
      <DateField value={date} onChange={setDate} label={t("flock.placed")} />
    </FormScreen>
  );
}
