import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Switch, Text, TextInput } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useOptions, useStaffMonth } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel, optionsOf } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { diff } from "@/lib/outbox-core";
import { STAFF_SECTIONS, staffEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** A new worker, or changes to one (including marking them as no longer working). */
export default function StaffForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, locale } = usePrefs();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const { data } = useStaffMonth(farm?.id, farmToday().slice(0, 7));
  const old = id ? (data?.staff ?? []).find((s) => s.id === id) : undefined;
  const toast = useToast();
  const { save } = useOutbox();
  const [name, setName] = useState(old?.name ?? "");
  const [phone, setPhone] = useState(old?.phone ?? "");
  const [position, setPosition] = useState(old?.position ?? "");
  const [module, setModule] = useState(old?.module ?? (farm?.has_dairy && !farm?.has_layer ? "dairy" : farm?.has_layer && !farm?.has_dairy ? "layer" : "both"));
  const [salary, setSalary] = useState(old ? String(Number(old.monthly_salary)) : "");
  const [joinDate, setJoinDate] = useState(old?.join_date ?? farmToday());
  const [notes, setNotes] = useState(old?.notes ?? "");
  const [active, setActive] = useState(old?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const positions = optionsOf(options ?? null, "staff_position");

  const submit = async () => {
    if (!farm) return;
    const r = staffEntry({ name, phone, position, module, salary, joinDate, notes }, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const label = `${id ? t("staff.edit") : t("staff.add")} · ${r.entry.name}`;
    const was = (old ?? {}) as unknown as Record<string, unknown>;
    const patch = diff({ ...r.entry, active }, was);
    const res = id
      ? await save({ kind: "update", farmId: farm.id, data: { table: "staff", id, patch, before: Object.fromEntries(Object.keys(patch).map((k) => [k, was[k] ?? null])), label } })
      : await save({ kind: "insert", farmId: farm.id, data: { table: "staff", row: { id: uuid(), ...r.entry }, label } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "queued" ? t("entry.queued") : id ? t("staff.updated") : t("staff.added", { name: r.entry.name }));
    router.back();
  };

  return (
    <FormScreen
      title={id ? t("staff.edit") : t("staff.add")}
      testID="staff-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="staff-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <TextInput mode="outlined" label={t("staff.name")} value={name} onChangeText={setName} testID="staff-name" />
      <TextInput mode="outlined" label={t("sale.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="staff-phone" />
      {positions.length > 0 && (
        <>
          <Label>{t("staff.position")}</Label>
          <ChoiceChips
            options={positions.map((o) => ({ value: o.value, label: optionLabel(options ?? null, "staff_position", o.value, locale) }))}
            value={position}
            onChange={(v) => setPosition(v === position ? "" : v)}
            testID="staff-position"
          />
        </>
      )}
      {farm?.has_dairy && farm?.has_layer && (
        <>
          <Label>{t("staff.worksOn")}</Label>
          <ChoiceChips options={STAFF_SECTIONS.map((s) => ({ value: s, label: t(`staff.sec.${s}`) }))} value={module} onChange={setModule} testID="staff-section" />
        </>
      )}
      <NumberField label={t("staff.salary")} value={salary} onChange={setSalary} testID="staff-salary" />
      {!id && <DateField label={t("staff.joinDate")} value={joinDate} onChange={setJoinDate} />}
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline testID="staff-notes" />
      {id ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="bodyLarge">{t("staff.stillWorking")}</Text>
          <Switch value={active} onValueChange={setActive} testID="staff-active" />
        </View>
      ) : null}
    </FormScreen>
  );
}
