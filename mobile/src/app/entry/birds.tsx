import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Chip, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EntryDone } from "@/components/entry-done";
import { DateField, Label } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useFlocks, useStock, type Flock } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { flockEntry, type FlockFields } from "@/lib/entries";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { addDays, isDate } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const EMPTY: FlockFields = { eggs: "", broken: "", mortality: "", culled: "", feed: "", weight: "" };
type Log = FlockFields & { feedItem: string | null };

async function loadLog(flockId: string, day: string): Promise<Log | null> {
  const { data, error } = await supabase
    .from("flock_daily_logs")
    .select("eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g, feed_item_id")
    .eq("flock_id", flockId)
    .eq("log_date", day)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));
  return { eggs: s(data.eggs_collected), broken: s(data.eggs_broken), mortality: s(data.mortality), culled: s(data.culled), feed: s(data.feed_kg), weight: s(data.avg_weight_g), feedItem: (data.feed_item_id as string | null) ?? null };
}

/** One flock's day: eggs, deaths, birds taken out, feed (from stock) and, for broilers, weight. */
export default function BirdSheet() {
  const { t, n, date } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current } = useSession();
  const farm = current?.farm;
  const { save } = useOutbox();
  const { data: flocks, offline, reload } = useFlocks(farm?.id);
  const { data: stock } = useStock(farm?.id);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const [day, setDay] = useState(farmToday());
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState<{ flock: Flock; eggs: number; queued: boolean } | null>(null);
  const flock = (flocks ?? []).find((f) => f.id === chosen) ?? flocks?.[0] ?? null;

  if (done) {
    const others = (flocks ?? []).filter((f) => f.id !== done.flock.id);
    const next = [
      ...others.slice(0, 3).map((f) => ({ label: t("birds.nextFlock", { name: f.name }), icon: "egg-outline", testID: `next-flock-${f.name}`, go: () => (setChosen(f.id), setDone(null)) })),
      ...(farm?.has_dairy ? [{ label: t("birds.nextMilk"), icon: "cup-water", testID: "next-milk", go: () => router.replace("/entry/milk") }] : []),
    ];
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <EntryDone
          title={t("birds.savedTitle", { name: done.flock.name })}
          body={`${date(day)}${done.flock.kind === "layer" ? ` · ${t("birds.savedEggs", { n: n(done.eggs) })}` : ""}`}
          queued={done.queued}
          next={next}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="bird-sheet">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/entry"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("hub.birds")} />
      </Appbar.Header>
      {offline && <OfflineNote />}
      {!flocks?.length ? (
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", margin: 24 }}>{t("entry.noFlocksBody")}</Text>
      ) : (
        flock && (
          <FlockDay
            key={`${flock.id}|${day}`}
            farmId={farm!.id}
            flocks={flocks}
            flock={flock}
            onFlock={setChosen}
            day={day}
            onDay={setDay}
            feeds={(stock ?? []).filter((i) => !i.archived && i.kind === "feed" && i.module !== "dairy" && (i.unit === "kg" || (i.unit === "bag" && i.unit_kg)))}
            save={save}
            onSaved={(eggs, queued) => setDone({ flock, eggs, queued })}
          />
        )
      )}
    </View>
  );
}

function FlockDay({
  farmId,
  flocks,
  flock,
  onFlock,
  day,
  onDay,
  feeds,
  save,
  onSaved,
}: {
  farmId: string;
  flocks: Flock[];
  flock: Flock;
  onFlock: (id: string) => void;
  day: string;
  onDay: (d: string) => void;
  feeds: { id: string; name: string }[];
  save: ReturnType<typeof useOutbox>["save"];
  onSaved: (eggs: number, queued: boolean) => void;
}) {
  const { t, n } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const layer = flock.kind === "layer";
  const [existing, setExisting] = useState<Log | null>(null);
  const [yesterday, setYesterday] = useState<Log | null>(null);
  const [typed, setTyped] = useState<Partial<FlockFields>>({});
  const [feedItem, setFeedItem] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isDate(day)) return;
    let cancelled = false;
    loadLog(flock.id, day).then((v) => !cancelled && setExisting(v), () => {});
    loadLog(flock.id, addDays(day, -1)).then((v) => !cancelled && setYesterday(v), () => {});
    return () => {
      cancelled = true;
    };
  }, [flock.id, day]);

  const f: FlockFields = { ...EMPTY, ...(existing ?? {}), ...typed };
  const item = feedItem === undefined ? (existing?.feedItem ?? null) : feedItem;
  const set = (k: keyof FlockFields) => (v: string) => {
    setError(null);
    setTyped((x) => ({ ...x, [k]: v }));
  };

  const submit = async () => {
    if (!isDate(day)) return setError(t("rec.err.date"));
    const r = flockEntry(flock.id, day, layer ? f : { ...f, eggs: "", broken: "" }, !layer);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    const res = await save({ kind: "flock", farmId, data: { ...r.entry, feed_item_id: item, flock_name: flock.name } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    onSaved(r.entry.eggs_collected, res.status === "queued");
  };

  const field = (k: keyof FlockFields, label: string, icon: string, hint?: string) => (
    <View style={styles.half}>
      <TextInput
        mode="outlined"
        label={label}
        value={f[k] ?? ""}
        onChangeText={set(k)}
        keyboardType={k === "feed" || k === "weight" ? "decimal-pad" : "number-pad"}
        left={<TextInput.Icon icon={icon} />}
        testID={`flock-${k}`}
      />
      <HelperText type="info" visible style={styles.hint}>
        {[hint, yesterday && yesterday[k] ? t("birds.yesterday", { v: n(Number(yesterday[k])) }) : ""].filter(Boolean).join(" · ")}
      </HelperText>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <DateField value={day} onChange={onDay} label={t("milk.whichDay")} testID="birds-day" />
          {flocks.length > 1 && (
            <>
              <Label>{t("birds.whichFlock")}</Label>
              <View style={styles.chips}>
                {flocks.map((x) => (
                  <Chip key={x.id} selected={x.id === flock.id} showSelectedCheck onPress={() => onFlock(x.id)} testID={`flock-${x.name}`}>
                    {x.name}
                  </Chip>
                ))}
              </View>
            </>
          )}
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {`${t(`entry.kind.${flock.kind}`)} · ${t("entry.birdsCount", { n: flock.birds })}`}
          </Text>
          {existing && (
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }} testID="flock-existing">
              {t("entry.existing")}
            </Text>
          )}
          <View style={styles.grid}>
            {layer && field("eggs", t("entry.eggs"), "egg-outline")}
            {layer && field("broken", t("entry.broken"), "egg-off-outline")}
            {field("mortality", t("entry.mortality"), "skull-outline")}
            {field("culled", t("birds.culled"), "minus-circle-outline", t("birds.culledHint"))}
            {field("feed", t("entry.feed"), "sack")}
            {!layer && field("weight", t("entry.weight"), "scale")}
          </View>
          {feeds.length > 0 && (
            <>
              <Label>{t("birds.feedFrom")}</Label>
              <View style={styles.chips}>
                <Chip selected={!item} showSelectedCheck onPress={() => setFeedItem(null)} testID="feed-none">
                  {t("birds.feedNone")}
                </Chip>
                {feeds.map((x) => (
                  <Chip key={x.id} selected={item === x.id} showSelectedCheck onPress={() => setFeedItem(x.id)} testID={`feed-${x.name}`}>
                    {x.name}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: theme.colors.outlineVariant }]}>
        <FormError message={error} detail={detail} />
        <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="flock-save">
          {t("entry.saveDay")}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 10 },
  half: { flexGrow: 1, flexBasis: "45%" },
  hint: { minHeight: 20 },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8, width: "100%", maxWidth: 752, alignSelf: "center" },
  btn: { height: 50 },
});
