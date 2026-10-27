import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useFlocks, useStock } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { usePrefs } from "@/lib/prefs";
import { STOCK_SECTIONS, stockMoveEntry } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** Bought more, used some, or counted what is left. Purchases go into the farm's expenses. */
export default function StockMoveForm() {
  const params = useLocalSearchParams<{ item: string; type?: string }>();
  const { t, n } = usePrefs();
  const farm = useSession().current?.farm;
  const { data } = useStock(farm?.id);
  const { data: flocks } = useFlocks(farm?.id);
  const item = (data ?? []).find((i) => i.id === params.item);
  const toast = useToast();
  const [type, setType] = useState(params.type === "use" || params.type === "adjust" ? params.type : "purchase");
  const [date, setDate] = useState(farmToday());
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [counted, setCounted] = useState("");
  const [module, setModule] = useState(item?.module ?? "general");
  const [flockId, setFlockId] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const unit = item ? t(`unit.${item.unit}` as "unit.kg") : "";
  const layerFlocks = flocks ?? [];

  const submit = async () => {
    if (!farm || !item) return;
    const r = stockMoveEntry({ type, date, qty, price, amount, counted, onHand: Number(item.on_hand), module, flockId, supplier, notes }, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    if (!r.entry) {
      toast(t("stock.countMatches"));
      return router.back();
    }
    setBusy(true);
    const { error: e } = await supabase.from("inventory_moves").insert({ farm_id: farm.id, item_id: item.id, ...r.entry });
    setBusy(false);
    if (e) {
      setError(t("common.error"));
      setDetail(e.message);
      return;
    }
    toast(t(`stock.saved.${r.entry.move_type}`));
    router.back();
  };

  return (
    <FormScreen
      title={item?.name ?? t("stock.title")}
      testID="stock-move-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy || !item} contentStyle={{ height: 50 }} testID="stock-move-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <SegmentedButtons
        value={type}
        onValueChange={setType}
        buttons={[
          { value: "purchase", label: t("stock.buy"), testID: "move-purchase" },
          { value: "use", label: t("stock.use"), testID: "move-use" },
          { value: "adjust", label: t("stock.count"), testID: "move-adjust" },
        ]}
      />
      {item && <Text variant="bodyMedium">{t("stock.onHandNow", { n: n(Number(item.on_hand), 2), unit })}</Text>}
      <DateField value={date} onChange={setDate} />
      {type === "adjust" ? (
        <NumberField label={t("stock.counted")} value={counted} onChange={setCounted} affix={unit} testID="move-counted" />
      ) : (
        <NumberField label={t("stock.qty")} value={qty} onChange={setQty} affix={unit} testID="move-qty" />
      )}
      {type === "purchase" && (
        <>
          <NumberField label={t("stock.unitPrice", { unit })} value={price} onChange={setPrice} testID="move-price" />
          {!price && <NumberField label={t("stock.total")} value={amount} onChange={setAmount} testID="move-amount" />}
          <TextInput mode="outlined" label={t("stock.supplier")} value={supplier} onChangeText={setSupplier} testID="move-supplier" />
        </>
      )}
      {type === "use" && (
        <>
          <Label>{t("stock.usedFor")}</Label>
          <ChoiceChips options={STOCK_SECTIONS.map((s) => ({ value: s, label: t(`stock.sec.${s}`) }))} value={module} onChange={setModule} testID="move-section" />
          {module !== "dairy" && layerFlocks.length > 0 && (
            <>
              <Label>{t("stock.flock")}</Label>
              <ChoiceChips
                options={layerFlocks.map((f) => ({ value: f.id, label: f.name }))}
                value={flockId ?? ""}
                onChange={(v) => setFlockId(v === flockId ? null : v)}
                testID="move-flock"
              />
            </>
          )}
        </>
      )}
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline testID="move-notes" />
    </FormScreen>
  );
}
