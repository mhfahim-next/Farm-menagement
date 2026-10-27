import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useBuyers } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { PAY_METHODS, paymentEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Money received from a buyer against what they owe. */
export default function Payment() {
  const { buyer } = useLocalSearchParams<{ buyer?: string }>();
  const { t, money } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const { data: buyers } = useBuyers(farm?.id);
  const b = (buyers ?? []).find((x) => x.id === buyer);
  const { save } = useOutbox();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [date, setDate] = useState(farmToday());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const currency = farm?.currency ?? "BDT";

  const submit = async () => {
    if (!farm) return;
    const r = paymentEntry({ buyerId: buyer ?? null, date, amount, method, notes }, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const label = t("sale.paymentLabel", { name: b?.name ?? "", amount: money(r.entry.amount, currency) });
    const res = await save({ kind: "payment", farmId: farm.id, data: { ...r.entry, id: uuid(), label } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "saved" ? t("sale.paymentSaved", { amount: money(r.entry.amount, currency) }) : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={t("sale.paymentTitle")}
      testID="payment-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="cash-check" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="payment-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      {b && (
        <Text variant="titleMedium">
          {b.name}
          <Text style={{ color: Number(b.due) > 0 ? theme.colors.error : theme.colors.onSurfaceVariant }}>{`  ·  ${t("sale.dueN", { amount: money(Number(b.due), currency) })}`}</Text>
        </Text>
      )}
      <NumberField label={t("sale.amountReceived")} value={amount} onChange={setAmount} icon="cash" testID="payment-amount" />
      {b && Number(b.due) > 0 && (
        <Button mode="text" compact style={{ alignSelf: "flex-start" }} onPress={() => setAmount(String(Number(b.due)))} testID="payment-full">
          {t("sale.payAll", { amount: money(Number(b.due), currency) })}
        </Button>
      )}
      <Label>{t("sale.method")}</Label>
      <ChoiceChips options={PAY_METHODS.map((m) => ({ value: m, label: t(`pay.${m}`) }))} value={method} onChange={setMethod} testID="method" />
      <DateField value={date} onChange={setDate} />
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} />
    </FormScreen>
  );
}
