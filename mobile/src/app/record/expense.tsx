import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel, optionsOf } from "@/lib/options";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { farmSections, txnEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** A cost (feed, labour, electricity…) or other money in, for one part of the farm or the whole farm. */
export default function Expense() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { t, locale, money } = usePrefs();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const { save } = useOutbox();
  const toast = useToast();
  const sections = farm ? farmSections(farm) : ["general" as const];
  const [type, setType] = useState(params.type === "income" ? "income" : "expense");
  const [section, setSection] = useState<string>(sections[0] ?? "general");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(farmToday());
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const currency = farm?.currency ?? "BDT";

  const categories = optionsOf(options, "finance_category").filter((o) => (o.meta?.txn_type ?? "expense") === type);
  const input = { date, type, module: section, category, amount, quantity, rate, description };
  const preview = txnEntry(input, farmToday());

  const submit = async () => {
    if (!farm) return;
    const r = txnEntry(input, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const label = `${optionLabel(options, "finance_category", r.entry.category, locale)} · ${money(r.entry.amount, currency)}`;
    const res = await save({ kind: "txn", farmId: farm.id, data: { ...r.entry, id: uuid(), label } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "saved" ? t("txn.saved", { amount: money(r.entry.amount, currency) }) : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={type === "income" ? t("txn.incomeTitle") : t("txn.title")}
      testID="expense-form"
      footer={
        <>
          {preview.ok && (
            <Text variant="titleMedium" style={{ textAlign: "right" }} testID="expense-total">
              {t("sale.total", { amount: money(preview.entry.amount, currency) })}
            </Text>
          )}
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="expense-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <SegmentedButtons
        value={type}
        onValueChange={(v) => {
          setType(v);
          setCategory("");
        }}
        buttons={[
          { value: "expense", label: t("txn.expense"), icon: "arrow-up-circle-outline", testID: "txn-expense" },
          { value: "income", label: t("txn.income"), icon: "arrow-down-circle-outline", testID: "txn-income" },
        ]}
      />
      <Label>{t("txn.category")}</Label>
      <ChoiceChips options={categories.map((o) => ({ value: o.value, label: optionLabel(options, "finance_category", o.value, locale) }))} value={category} onChange={setCategory} testID="cat" />
      {sections.length > 1 && (
        <>
          <Label>{t("txn.section")}</Label>
          <ChoiceChips options={sections.map((s) => ({ value: s, label: t(`section.${s}`) }))} value={section} onChange={setSection} testID="section" />
        </>
      )}
      <NumberField label={t("sale.amount")} value={amount} onChange={setAmount} icon="cash" testID="expense-amount" />
      <Text variant="labelMedium">{t("txn.orQtyRate")}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <NumberField label={t("sale.qty")} value={quantity} onChange={setQuantity} testID="expense-qty" />
        </View>
        <View style={{ flex: 1 }}>
          <NumberField label={t("sale.unitPrice")} value={rate} onChange={setRate} testID="expense-rate" />
        </View>
      </View>
      <TextInput mode="outlined" label={t("txn.description")} value={description} onChangeText={setDescription} testID="expense-desc" />
      <DateField value={date} onChange={setDate} />
    </FormScreen>
  );
}
