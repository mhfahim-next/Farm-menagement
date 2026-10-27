import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Dialog, Portal, SegmentedButtons, Switch, Text, TextInput } from "react-native-paper";
import { AnimalPicker, ChoiceChips, DateField, Label, NumberField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { PhotoPicker } from "@/components/photo-picker";
import { isStaff, knownDbError, useAnimals, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { useDescribe } from "@/lib/describe";
import { optionLabel, optionsOf } from "@/lib/options";
import { photoUrl, removePhoto, uploadPhoto } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { animalEntry, speciesOfCategory } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

type Row = {
  id: string;
  tag_number: string;
  name: string | null;
  category: string;
  breed: string | null;
  date_of_birth: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  mother_id: string | null;
  father: string | null;
  notes: string | null;
  status: string;
  species: string | null;
  photo_path: string | null;
};

const FEMALE = ["cow", "heifer", "doe", "doeling", "ewe", "ewe_lamb"];

/** Add an animal, or change one (with its photo). Owners and managers can also delete it. */
export default function AnimalForm() {
  const { id, group: groupParam } = useLocalSearchParams<{ id?: string; group?: string }>();
  const { t, locale } = usePrefs();
  const { current } = useSession();
  const farm = current?.farm;
  const options = useOptions();
  const describe = useDescribe(options);
  const { data: animals } = useAnimals(farm?.id);
  const toast = useToast();
  const editing = Boolean(id);
  const keepsCattle = Boolean(farm?.has_dairy || farm?.has_fattening);
  const keepsGoats = Boolean(farm?.has_goat);

  const [group, setGroup] = useState<"cattle" | "goats">(groupParam === "goats" || (!keepsCattle && keepsGoats) ? "goats" : "cattle");
  const [row, setRow] = useState<Row | null>(null);
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [breed, setBreed] = useState("");
  const [dob, setDob] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [motherId, setMotherId] = useState<string | null>(null);
  const [father, setFather] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [fattening, setFattening] = useState(false);
  const [targetKg, setTargetKg] = useState("");
  const [startKg, setStartKg] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editing: load the animal once.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("cattle")
        .select("id, tag_number, name, category, breed, date_of_birth, purchase_date, purchase_price, mother_id, father, notes, status, species, photo_path")
        .eq("id", id)
        .maybeSingle();
      if (cancelled || !data) return;
      const r = data as Row;
      setRow(r);
      setTag(r.tag_number);
      setName(r.name ?? "");
      setCategory(r.category);
      setBreed(r.breed ?? "");
      setDob(r.date_of_birth ?? "");
      setPurchaseDate(r.purchase_date ?? "");
      setPurchasePrice(r.purchase_price !== null ? String(Number(r.purchase_price)) : "");
      setMotherId(r.mother_id);
      setFather(r.father ?? "");
      setNotes(r.notes ?? "");
      setStatus(r.status);
      setGroup(r.species === "goat" || r.species === "sheep" ? "goats" : "cattle");
      setPhoto(photoUrl("animal-photos", r.photo_path));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const types = optionsOf(options, "cattle_category").filter((o) => (speciesOfCategory(o.meta) === "cattle") === (group === "cattle"));
  const species = speciesOfCategory(types.find((o) => o.value === category)?.meta ?? (group === "goats" ? { species: "goat" } : null));
  const breeds = optionsOf(options, "cattle_breed").filter((o) => speciesOfCategory(o.meta) === species);
  const mothers = (animals ?? []).filter((a) => a.id !== id && FEMALE.includes(a.category) && (a.species ?? "cattle") === species);
  const canDelete = current?.role === "owner" || current?.role === "manager";

  const submit = async () => {
    if (!farm) return;
    const r = animalEntry(
      { id: id ?? null, tag, name, category, breed, dob, purchaseDate, purchasePrice, motherId, father, notes, status, fattening, targetKg, startKg },
      farmToday(),
    );
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    try {
      let animalId = id ?? null;
      if (editing) {
        const { error: e } = await supabase.from("cattle").update(r.entry).eq("id", id!).eq("farm_id", farm.id);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from("cattle").insert({ farm_id: farm.id, ...r.entry }).select("id").single();
        if (e) throw e;
        animalId = (data as { id: string }).id;
        if (r.startKg) {
          await supabase.from("cattle_weights").insert({ farm_id: farm.id, cattle_id: animalId, weigh_date: r.entry.fattening_start ?? farmToday(), weight_kg: r.startKg, method: "scale" });
        }
      }
      if (photoChanged && animalId) {
        const path = photo ? await uploadPhoto("animal-photos", farm.id, photo) : null;
        const { error: e } = await supabase.from("cattle").update({ photo_path: path }).eq("id", animalId);
        if (e) throw e;
        if (row?.photo_path) await removePhoto("animal-photos", row.photo_path);
      }
      toast(editing ? t("animal.saved") : t("animal.added", { tag: r.entry.tag_number }));
      if (editing) router.back();
      else router.replace({ pathname: "/animal/[id]", params: { id: animalId! } });
    } catch (e) {
      const msg = (e as { message?: string }).message ?? String(e);
      const known = knownDbError(msg);
      setError(known ? t(known.key, { tag: tag.trim(), n: known.n ?? 0 }) : t("common.error"));
      setDetail(known ? null : msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!farm || !id) return;
    setConfirmDelete(false);
    setBusy(true);
    const { error: e } = await supabase.from("cattle").delete().eq("id", id).eq("farm_id", farm.id);
    setBusy(false);
    if (e) {
      setError(t("common.error"));
      setDetail(e.message);
      return;
    }
    await removePhoto("animal-photos", row?.photo_path);
    toast(t("animal.deleted", { tag: row?.tag_number ?? "" }));
    router.dismissTo("/animals");
  };

  if (!isStaff(current?.role)) return null;

  return (
    <FormScreen
      title={editing ? t("animal.editTitle") : t("animal.addTitle")}
      testID="animal-form"
      footer={
        <>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy || (editing && !row)} contentStyle={{ height: 50 }} testID="animal-save">
            {t("rec.save")}
          </Button>
        </>
      }
    >
      <PhotoPicker
        uri={photo}
        onPick={(u) => {
          setPhoto(u);
          setPhotoChanged(true);
        }}
        onRemove={() => {
          setPhoto(null);
          setPhotoChanged(true);
        }}
      />
      {!editing && keepsCattle && keepsGoats && (
        <SegmentedButtons
          value={group}
          onValueChange={(v) => {
            setGroup(v as "cattle" | "goats");
            setCategory("");
            setBreed("");
            setMotherId(null);
          }}
          buttons={[
            { value: "cattle", label: t("animals.cattle"), icon: "cow", testID: "new-cattle" },
            { value: "goats", label: t("animals.goats"), icon: "sheep", testID: "new-goats" },
          ]}
        />
      )}
      <TextInput mode="outlined" label={t("animal.tagLabel")} value={tag} onChangeText={setTag} autoCapitalize="characters" testID="animal-tag" />
      <TextInput mode="outlined" label={t("animal.nameLabel")} value={name} onChangeText={setName} testID="animal-name" />
      <Label>{t("animal.type")}</Label>
      <ChoiceChips options={types.map((o) => ({ value: o.value, label: optionLabel(options, "cattle_category", o.value, locale) }))} value={category} onChange={setCategory} testID="type" />
      <Label>{t("animal.breed")}</Label>
      <ChoiceChips options={breeds.map((o) => ({ value: o.value, label: optionLabel(options, "cattle_breed", o.value, locale) }))} value={breed} onChange={(v) => setBreed(v === breed ? "" : v)} testID="breed" />
      <DateField value={dob} onChange={setDob} label={t("animal.born")} optional testID="dob" />
      {!editing && (
        <>
          <DateField value={purchaseDate} onChange={setPurchaseDate} label={t("animal.boughtOn")} optional testID="bought" />
          {purchaseDate ? <NumberField label={t("animal.price")} value={purchasePrice} onChange={setPurchasePrice} icon="cash" testID="animal-price" /> : null}
        </>
      )}
      <Label>{t("animal.mother")}</Label>
      {mothers.length > 0 ? (
        <>
          <AnimalPicker animals={mothers} selected={motherId ? [motherId] : []} onChange={(v) => setMotherId(v[0] ?? null)} multi={false} describe={describe} />
          {motherId && (
            <Button mode="text" compact style={{ alignSelf: "flex-start" }} onPress={() => setMotherId(null)}>
              {t("animal.noMother")}
            </Button>
          )}
        </>
      ) : (
        <Text variant="bodySmall">{t("animal.noMothers")}</Text>
      )}
      <TextInput mode="outlined" label={t("animal.father")} value={father} onChangeText={setFather} />
      {editing && (
        <>
          <Label>{t("animal.status")}</Label>
          <ChoiceChips options={optionsOf(options, "cattle_status").map((o) => ({ value: o.value, label: optionLabel(options, "cattle_status", o.value, locale) }))} value={status} onChange={setStatus} testID="status" />
        </>
      )}
      {!editing && farm?.has_fattening && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="titleSmall" style={{ flex: 1 }}>
              {t("animal.fattening")}
            </Text>
            <Switch value={fattening} onValueChange={setFattening} testID="animal-fattening" />
          </View>
          {fattening && (
            <>
              <NumberField label={t("animal.startKg")} value={startKg} onChange={setStartKg} affix="kg" testID="animal-start-kg" />
              <NumberField label={t("animal.targetKg")} value={targetKg} onChange={setTargetKg} affix="kg" />
            </>
          )}
        </View>
      )}
      <TextInput mode="outlined" label={t("rec.notes")} value={notes} onChangeText={setNotes} multiline />
      {editing && canDelete && (
        <Button mode="text" icon="delete-outline" textColor="#b91c1c" onPress={() => setConfirmDelete(true)} testID="animal-delete">
          {t("animal.delete")}
        </Button>
      )}
      <Portal>
        <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
          <Dialog.Title>{t("animal.deleteTitle", { tag: row?.tag_number ?? "" })}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("animal.deleteBody")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(false)}>{t("common.cancel")}</Button>
            <Button textColor="#b91c1c" onPress={remove} testID="animal-delete-confirm">
              {t("animal.deleteYes")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </FormScreen>
  );
}
