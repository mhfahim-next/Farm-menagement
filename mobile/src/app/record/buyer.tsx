import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput } from "react-native-paper";
import { NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { writeCache, readCache } from "@/lib/cache";
import type { Buyer } from "@/lib/data";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { buyerEntry, uuid } from "@/lib/records";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** A new buyer (a sweet shop, a milk collector, a trader…). Works offline too. */
export default function NewBuyer() {
  const { t } = usePrefs();
  const farm = useSession().current?.farm;
  const { save } = useOutbox();
  const toast = useToast();
  const [id] = useState(uuid);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [milkRate, setMilkRate] = useState("");
  const [eggRate, setEggRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!farm) return;
    const r = buyerEntry({ id, name, phone, milkRate, eggRate });
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setBusy(true);
    const res = await save({ kind: "buyer", farmId: farm.id, data: { ...r.entry, label: t("sale.newBuyerLabel", { name: r.entry.name }) } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    // Show the buyer in the lists at once, even before the server has it.
    const key = `buyers.${farm.id}`;
    const list = readCache<Buyer[]>(key) ?? [];
    writeCache(key, [...list.filter((b) => b.id !== id), { ...r.entry, due: 0, last_sale: null }].sort((a, b) => a.name.localeCompare(b.name)));
    toast(res.status === "saved" ? t("sale.buyerSaved") : t("entry.queued"));
    router.back();
  };

  return (
    <FormScreen
      title={t("sale.newBuyer")}
      testID="buyer-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="account-plus-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={{ height: 50 }} testID="buyer-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <TextInput mode="outlined" label={t("sale.buyerName")} value={name} onChangeText={setName} testID="buyer-name" />
      <TextInput mode="outlined" label={t("sale.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="buyer-phone" />
      {farm?.has_dairy && <NumberField label={t("sale.milkRate")} value={milkRate} onChange={setMilkRate} testID="buyer-milk-rate" />}
      {farm?.has_layer && <NumberField label={t("sale.eggRate")} value={eggRate} onChange={setEggRate} testID="buyer-egg-rate" />}
    </FormScreen>
  );
}
