import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";
import { DateField, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useStaffMonth } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { usePrefs } from "@/lib/prefs";
import { useOutbox } from "@/lib/outbox";
import { staffPayEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Salary, an advance or a bonus paid to a worker for a month. It goes into the farm's expenses. */
export default function StaffPayForm() {
  const params = useLocalSearchParams<{ staff: string; month?: string; amount?: string }>();
  const { t, month: monthName } = usePrefs();
  const farm = useSession().current?.farm;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : farmToday().slice(0, 7);
  const { data } = useStaffMonth(farm?.id, month);
  const person = (data?.staff ?? []).find((s) => s.id === params.staff);
  const toast = useToast();
  const { save } = useOutbox();
  const [type, setType] = useState("salary");
  const [amount, setAmount] = useState(params.amount ?? "");
  const [paidOn, setPaidOn] = useState(farmToday());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!farm || !params.staff) return;
    const r = staffPayEntry({ month, type, amount, paidOn, note }, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const res = await save({
      kind: "insert",
      farmId: farm.id,
      data: { table: "staff_payments", row: { id: uuid(), staff_id: params.staff, ...r.entry }, label: `${t("staff.pay")} · ${person?.name ?? ""} · ${monthName(month)}` },
    });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "queued" ? t("entry.queued") : t("staff.paySaved"));
    router.back();
  };

  return (
    <FormScreen
      title={`${t("staff.pay")} · ${person?.name ?? ""} · ${monthName(month)}`}
      testID="staff-pay-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="staff-pay-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <SegmentedButtons
        value={type}
        onValueChange={setType}
        buttons={[
          { value: "salary", label: t("staff.type.salary"), testID: "pay-salary" },
          { value: "advance", label: t("staff.type.advance"), testID: "pay-advance" },
          { value: "bonus", label: t("staff.type.bonus"), testID: "pay-bonus" },
        ]}
      />
      <NumberField label={t("sale.amount")} value={amount} onChange={setAmount} testID="pay-amount" />
      <DateField label={t("staff.paidOn")} value={paidOn} onChange={setPaidOn} />
      <TextInput mode="outlined" label={t("rec.notes")} value={note} onChangeText={setNote} testID="pay-note" />
    </FormScreen>
  );
}
