import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { AnimalPicker, ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useAnimals, useBuyers, useFlocks, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useDescribe } from "@/lib/describe";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { PRODUCTS, saleEntry, UNITS, uuid, type Product } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

const CASH = "cash";

/** A sale: milk, eggs, an animal, broiler birds, manure or anything else; cash or on credit to a buyer. */
export default function SaleRecord() {
  const params = useLocalSearchParams<{ buyer?: string; animal?: string }>();
  const { t, money } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const options = useOptions();
  const describe = useDescribe(options);
  const { data: buyers } = useBuyers(farm?.id);
  const { data: animals } = useAnimals(farm?.id);
  const { data: flocks } = useFlocks(farm?.id);
  const { save } = useOutbox();
  const toast = useToast();
  const currency = farm?.currency ?? "BDT";

  const offered = PRODUCTS.filter(
    (p) =>
      (p !== "milk" || farm?.has_dairy) &&
      (p !== "eggs" || farm?.has_layer) &&
      (p !== "birds" || farm?.has_broiler) &&
      (p !== "animal" || farm?.has_dairy || farm?.has_fattening || farm?.has_goat),
  );
  const [product, setProduct] = useState<Product>(params.animal ? "animal" : (offered[0] ?? "other"));
  const [unit, setUnit] = useState(UNITS[product][0]);
  const [buyerId, setBuyerId] = useState(params.buyer ?? CASH);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [animalId, setAnimalId] = useState<string | null>(params.animal ?? null);
  const [flockId, setFlockId] = useState<string | null>(null);
  const [heads, setHeads] = useState("");
  const [date, setDate] = useState(farmToday());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const buyer = (buyers ?? []).find((b) => b.id === buyerId) ?? null;
  const sellable = useMemo(() => (animals ?? []).filter((a) => a.status === "active"), [animals]);
  const flockChoices = (flocks ?? []).filter((f) => (product === "eggs" ? f.kind === "layer" : product === "birds" ? f.kind !== "layer" : false));
  const animal = sellable.find((a) => a.id === animalId) ?? null;
  const flock = flockChoices.find((f) => f.id === flockId) ?? (flockChoices.length === 1 ? flockChoices[0] : null);

  const pickProduct = (p: string) => {
    const next = p as Product;
    setProduct(next);
    setUnit(UNITS[next][0]);
    // The buyer's usual rate, when they have one.
    const rate = next === "milk" ? buyer?.milk_rate : next === "eggs" ? buyer?.egg_rate : null;
    setPrice(rate ? String(Number(rate)) : "");
    setError(null);
  };
  const pickBuyer = (id: string) => {
    setBuyerId(id);
    const b = (buyers ?? []).find((x) => x.id === id);
    const rate = product === "milk" ? b?.milk_rate : product === "eggs" && unit === "piece" ? b?.egg_rate : null;
    if (rate && !price) setPrice(String(Number(rate)));
  };

  const input = {
    date,
    product,
    unit,
    quantity: qty,
    price,
    amount,
    paid,
    buyerId: buyerId === CASH ? null : buyerId,
    animal: animal ? { id: animal.id, species: animal.species, is_fattening: animal.is_fattening } : null,
    flock: flock ? { id: flock.id, kind: flock.kind } : null,
    heads,
    notes,
  };
  const preview = saleEntry(input, farmToday());

  const submit = async () => {
    if (!farm) return;
    const r = saleEntry(input, farmToday());
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const what = product === "animal" && animal ? `#${animal.tag_number}` : t(`product.${product}`);
    const label = t("sale.saleLabel", { what, amount: money(r.entry.amount, currency), buyer: buyer?.name ?? t("sale.cash") });
    const res = await save({ kind: "sale", farmId: farm.id, data: { ...r.entry, id: uuid(), label } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    toast(res.status === "saved" ? t("sale.saved", { amount: money(r.entry.amount, currency) }) : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={t("sale.title")}
      testID="sale-form"
      footer={
        <>
          {preview.ok && (
            <Text variant="titleMedium" style={{ textAlign: "right" }} testID="sale-total">
              {t("sale.total", { amount: money(preview.entry.amount, currency) })}
              {preview.due > 0 ? <Text style={{ color: theme.colors.error }}>{`  ·  ${t("sale.dueN", { amount: money(preview.due, currency) })}`}</Text> : null}
            </Text>
          )}
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="sale-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <Label>{t("sale.what")}</Label>
      <ChoiceChips options={offered.map((p) => ({ value: p, label: t(`product.${p}`) }))} value={product} onChange={pickProduct} testID="product" />

      <Label>{t("sale.buyer")}</Label>
      <ChoiceChips
        options={[{ value: CASH, label: t("sale.cash"), icon: "cash" }, ...(buyers ?? []).map((b) => ({ value: b.id, label: b.name }))]}
        value={buyerId}
        onChange={pickBuyer}
        testID="buyer"
      />
      <Button mode="text" icon="account-plus-outline" compact style={{ alignSelf: "flex-start" }} onPress={() => router.push("/record/buyer")} testID="sale-new-buyer">
        {t("sale.newBuyer")}
      </Button>

      {product === "animal" ? (
        <>
          <Label>{t("sale.whichAnimal")}</Label>
          <AnimalPicker animals={sellable} selected={animalId ? [animalId] : []} onChange={(v) => setAnimalId(v[0] ?? null)} multi={false} describe={describe} />
          <NumberField label={t("sale.price")} value={amount} onChange={setAmount} icon="cash" testID="sale-amount" />
        </>
      ) : (
        <>
          {flockChoices.length > 0 && (
            <>
              <Label>{product === "birds" ? t("sale.batch") : t("sale.flock")}</Label>
              <ChoiceChips options={flockChoices.map((f) => ({ value: f.id, label: f.name }))} value={flock?.id ?? ""} onChange={setFlockId} testID="sale-flock" />
            </>
          )}
          {UNITS[product].length > 1 && (
            <>
              <Label>{t("sale.unit")}</Label>
              <ChoiceChips options={UNITS[product].map((u) => ({ value: u, label: t(`unit.${u}` as "unit.kg") }))} value={unit} onChange={setUnit} testID="unit" />
            </>
          )}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <NumberField label={t("sale.qty")} value={qty} onChange={setQty} affix={t(`unit.${unit}` as "unit.kg")} testID="sale-qty" />
            </View>
            <View style={{ flex: 1 }}>
              <NumberField label={t("sale.unitPrice")} value={price} onChange={setPrice} testID="sale-price" />
            </View>
          </View>
          {product === "birds" && <NumberField label={t("sale.heads")} value={heads} onChange={setHeads} testID="sale-heads" />}
          {!price && <NumberField label={t("sale.amount")} value={amount} onChange={setAmount} icon="cash" testID="sale-amount" />}
        </>
      )}

      {buyerId !== CASH && <NumberField label={t("sale.paidNow")} value={paid} onChange={setPaid} icon="cash-check" testID="sale-paid" />}
      <DateField value={date} onChange={setDate} />
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} />
    </FormScreen>
  );
}
