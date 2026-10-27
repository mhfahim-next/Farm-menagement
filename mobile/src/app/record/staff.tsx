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
import { STAFF_SECTIONS, staffEntry } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
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
    const { error: e } = id
      ? await supabase.from("staff").update({ ...r.entry, active }).eq("id", id).eq("farm_id", farm.id)
      : await supabase.from("staff").insert({ farm_id: farm.id, ...r.entry });
    setBusy(false);
    if (e) {
      setError(t("common.error"));
      setDetail(e.message);
      return;
    }
    toast(id ? t("staff.updated") : t("staff.added", { name: r.entry.name }));
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
