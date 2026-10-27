import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Switch, Text, TextInput } from "react-native-paper";
import { View } from "react-native";
import { ChoiceChips, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useStock } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { ITEM_KINDS, ITEM_UNITS, STOCK_SECTIONS, stockItemEntry } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** A new stock item (a feed, a medicine…), or changes to one. */
export default function StockItemForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = usePrefs();
  const farm = useSession().current?.farm;
  const { data } = useStock(farm?.id);
  const old = id ? (data ?? []).find((i) => i.id === id) : undefined;
  const toast = useToast();
  const [name, setName] = useState(old?.name ?? "");
  const [kind, setKind] = useState(old?.kind ?? "feed");
  const [unit, setUnit] = useState(old?.unit ?? "kg");
  const [unitKg, setUnitKg] = useState(old?.unit_kg != null ? String(Number(old.unit_kg)) : "");
  const [module, setModule] = useState(old?.module ?? (farm?.has_dairy ? "dairy" : farm?.has_layer ? "layer" : "general"));
  const [lowStock, setLowStock] = useState(old?.low_stock != null ? String(Number(old.low_stock)) : "");
  const [notes, setNotes] = useState(old?.notes ?? "");
  const [archived, setArchived] = useState(old?.archived ?? false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!farm) return;
    const r = stockItemEntry({ name, kind, unit, unitKg, module, lowStock, notes });
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const { error: e } = id
      ? await supabase.from("inventory_items").update({ ...r.entry, archived }).eq("id", id).eq("farm_id", farm.id)
      : await supabase.from("inventory_items").insert({ farm_id: farm.id, ...r.entry });
    setBusy(false);
    if (e) {
      setError(e.code === "23505" ? t("stock.err.taken") : t("common.error"));
      setDetail(e.code === "23505" ? null : e.message);
      return;
    }
    toast(t("stock.itemSaved"));
    router.back();
  };

  return (
    <FormScreen
      title={id ? t("stock.editItem") : t("stock.newItem")}
      testID="stock-item-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="stock-item-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <TextInput mode="outlined" label={t("stock.name")} value={name} onChangeText={setName} testID="stock-name" />
      <Label>{t("stock.kind")}</Label>
      <ChoiceChips options={ITEM_KINDS.map((k) => ({ value: k, label: t(`stock.kind.${k}`) }))} value={kind} onChange={setKind} testID="stock-kind" />
      <Label>{t("stock.unit")}</Label>
      <ChoiceChips options={ITEM_UNITS.map((u) => ({ value: u, label: t(`unit.${u}` as "unit.kg") }))} value={unit} onChange={setUnit} testID="stock-unit" />
      {unit === "bag" && <NumberField label={t("stock.unitKg")} value={unitKg} onChange={setUnitKg} affix="kg" testID="stock-bag-kg" />}
      <Label>{t("stock.section")}</Label>
      <ChoiceChips options={STOCK_SECTIONS.map((s) => ({ value: s, label: t(`stock.sec.${s}`) }))} value={module} onChange={setModule} testID="stock-section" />
      <NumberField label={t("stock.lowStock")} value={lowStock} onChange={setLowStock} testID="stock-low-at" />
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline testID="stock-notes" />
      {id ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="bodyLarge">{t("stock.archive")}</Text>
          <Switch value={archived} onValueChange={setArchived} testID="stock-archived" />
        </View>
      ) : null}
    </FormScreen>
  );
}
