import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Icon, SegmentedButtons, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { SyncBar } from "@/components/sync-bar";
import { useAnimals, useFlocks, useOptions, type Flock } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { flockEntry, milkEntry, type FlockFields } from "@/lib/entries";
import { milkingCategories, optionLabel, optionsOf } from "@/lib/options";
import { useOutbox, type SaveResult } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const minusDays = (iso: string, n: number) => new Date(Date.parse(iso) - n * 86_400_000).toISOString().slice(0, 10);

/** Today's milk and bird numbers; kept on the phone when there is no internet. */
export default function Entry() {
  const { t, date } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current } = useSession();
  const farm = current?.farm;
  const canMilk = Boolean(farm?.has_dairy);
  const canBirds = Boolean(farm?.has_layer || farm?.has_broiler);
  const [what, setWhat] = useState<"milk" | "birds">(canMilk || !canBirds ? "milk" : "birds");
  const today = farmToday();
  const [day, setDay] = useState(today);
  const [toast, setToast] = useState<string | null>(null);

  const done = (r: SaveResult) => {
    if (r.status !== "error") setToast(r.status === "saved" ? t("entry.saved") : t("entry.queued"));
  };

  if (!farm || !current) return null;
  const staff = current.role !== "vet";

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="entry">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text variant="headlineSmall" accessibilityRole="header">
            {t("entry.title")}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("entry.sub")}
          </Text>
          <SyncBar />
          {!staff ? (
            <Empty icon="stethoscope" title={t("entry.vetOnly")} />
          ) : !canMilk && !canBirds ? (
            <Empty icon="information-outline" title={t("entry.nothingKept")} />
          ) : (
            <>
              {canMilk && canBirds && (
                <SegmentedButtons
                  value={what}
                  onValueChange={(v) => setWhat(v as "milk" | "birds")}
                  buttons={[
                    { value: "milk", label: t("entry.milk"), icon: "water-outline", testID: "entry-milk" },
                    { value: "birds", label: t("entry.birds"), icon: "egg-outline", testID: "entry-birds" },
                  ]}
                />
              )}
              <SegmentedButtons
                value={day}
                onValueChange={setDay}
                density="small"
                buttons={[
                  { value: today, label: t("entry.today"), testID: "day-today" },
                  { value: minusDays(today, 1), label: t("entry.yesterday"), testID: "day-yesterday" },
                  { value: minusDays(today, 2), label: date(minusDays(today, 2), true) },
                ]}
              />
              {what === "milk" ? <MilkSheet key={`milk-${day}`} farmId={farm.id} day={day} onDone={done} /> : <BirdSheet farmId={farm.id} day={day} onDone={done} />}
            </>
          )}
        </View>
      </ScrollView>
      <Snackbar visible={toast !== null} onDismiss={() => setToast(null)} duration={3500} testID="entry-toast">
        {toast ?? ""}
      </Snackbar>
    </View>
  );
}

function Empty({ icon, title, body }: { icon: string; title: string; body?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <Icon source={icon} size={40} color={theme.colors.outline} />
      <Text variant="titleMedium" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

/** Numbers already saved for a day, so they can be checked and changed. */
function useExisting<T>(load: (() => PromiseLike<T | null>) | null, deps: unknown[]) {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    (async () => {
      const v = await Promise.resolve(load()).then(
        (x) => x,
        () => null,
      );
      if (!cancelled) setValue(v);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

function MilkSheet({ farmId, day, onDone }: { farmId: string; day: string; onDone: (r: SaveResult) => void }) {
  const { t, n, locale } = usePrefs();
  const theme = useTheme();
  const options = useOptions();
  const { save } = useOutbox();
  const sessions = optionsOf(options, "milk_session");
  const [session, setSession] = useState("morning");
  const { data: animals, offline } = useAnimals(farmId);
  const milking = useMemo(() => {
    const cats = milkingCategories(options);
    return (animals ?? []).filter((a) => a.status === "active" && (a.species ?? "cattle") === "cattle" && cats.includes(a.category));
  }, [animals, options]);
  const [typed, setTyped] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const existing = useExisting(
    () =>
      supabase
        .from("milk_records")
        .select("cattle_id, quantity_liters")
        .eq("farm_id", farmId)
        .eq("record_date", day)
        .eq("session", session)
        .then(({ data, error: e }) => {
          if (e) throw e;
          return Object.fromEntries((data ?? []).map((r) => [r.cattle_id as string, String(Number(r.quantity_liters))]));
        }),
    [farmId, day, session],
  );
  // Only animals on the sheet count (one sold or removed meanwhile drops out).
  const onSheet = new Set(milking.map((a) => a.id));
  const litres = Object.fromEntries(Object.entries({ ...(existing ?? {}), ...(typed[session] ?? {}) }).filter(([id]) => onSheet.has(id)));
  const total = milkEntry(day, session, litres);

  const submit = async () => {
    const r = milkEntry(day, session, litres);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    const res = await save({ kind: "milk", farmId, data: r.entry });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
    } else onDone(res);
  };

  return (
    <View style={styles.sheet}>
      <SegmentedButtons
        value={session}
        onValueChange={(v) => {
          setSession(v);
          setError(null);
        }}
        buttons={(sessions.length ? sessions.map((s) => s.value) : ["morning", "evening"]).map((v) => ({
          value: v,
          label: optionLabel(options, "milk_session", v, locale) || v,
          testID: `session-${v}`,
        }))}
      />
      {offline && <OfflineNote />}
      {existing && Object.keys(existing).length > 0 && (
        <Text variant="bodySmall" style={{ color: theme.colors.primary }} testID="milk-existing">
          {t("entry.existing")}
        </Text>
      )}
      {milking.length === 0 ? (
        <Empty icon="cow" title={t("entry.noCows")} body={t("entry.noCowsBody")} />
      ) : (
        <>
          {milking.map((a) => (
            <View key={a.id} style={[styles.cow, { backgroundColor: theme.colors.elevation.level1 }]}>
              <View style={styles.flex}>
                <Text variant="titleSmall">#{a.tag_number}</Text>
                {a.name ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                    {a.name}
                  </Text>
                ) : null}
              </View>
              <TextInput
                mode="outlined"
                dense
                value={litres[a.id] ?? ""}
                onChangeText={(v) => {
                  setError(null);
                  setTyped((x) => ({ ...x, [session]: { ...(x[session] ?? {}), [a.id]: v } }));
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                right={<TextInput.Affix text={locale === "bn" ? "লি." : "L"} />}
                style={styles.litres}
                accessibilityLabel={`#${a.tag_number}`}
                testID={`milk-${a.tag_number}`}
              />
            </View>
          ))}
          <Text variant="titleMedium" style={styles.total} testID="milk-total">
            {total.ok
              ? total.entry.rows.length === 1
                ? t("entry.total_one", { l: n(total.total, 1) })
                : t("entry.total", { l: n(total.total, 1), n: total.entry.rows.length })
              : t("entry.total", { l: n(0), n: 0 })}
          </Text>
          <FormError message={error} detail={detail} />
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="milk-save">
            {t("entry.saveMilk")}
          </Button>
        </>
      )}
    </View>
  );
}

const EMPTY: FlockFields = { eggs: "", broken: "", mortality: "", culled: "", feed: "", weight: "" };

function BirdSheet({ farmId, day, onDone }: { farmId: string; day: string; onDone: (r: SaveResult) => void }) {
  const { t } = usePrefs();
  const theme = useTheme();
  const { data: flocks, offline } = useFlocks(farmId);
  const [chosen, setChosen] = useState<string | null>(null);
  const flock = (flocks ?? []).find((f) => f.id === chosen) ?? flocks?.[0] ?? null;

  if (!flocks?.length) return offline ? <OfflineNote /> : <Empty icon="egg-outline" title={t("entry.noFlocks")} body={t("entry.noFlocksBody")} />;
  return (
    <View style={styles.sheet}>
      {offline && <OfflineNote />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {flocks.map((f) => (
          <Chip key={f.id} selected={f.id === flock?.id} showSelectedCheck onPress={() => setChosen(f.id)} testID={`flock-${f.name}`}>
            {f.name}
          </Chip>
        ))}
      </ScrollView>
      {flock && (
        <>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {`${t(`entry.kind.${flock.kind}`)} · ${t("entry.birdsCount", { n: flock.birds })}`}
          </Text>
          <FlockForm key={`${flock.id}-${day}`} farmId={farmId} flock={flock} day={day} onDone={onDone} />
        </>
      )}
    </View>
  );
}

function FlockForm({ farmId, flock, day, onDone }: { farmId: string; flock: Flock; day: string; onDone: (r: SaveResult) => void }) {
  const { t } = usePrefs();
  const theme = useTheme();
  const { save } = useOutbox();
  const layer = flock.kind === "layer";
  const [typed, setTyped] = useState<Partial<FlockFields>>({});
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const existing = useExisting<FlockFields>(
    () =>
      supabase
        .from("flock_daily_logs")
        .select("eggs_collected, eggs_broken, mortality, culled, feed_kg, avg_weight_g")
        .eq("flock_id", flock.id)
        .eq("log_date", day)
        .maybeSingle()
        .then(({ data, error: e }) => {
          if (e) throw e;
          if (!data) return null;
          const s = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));
          return { eggs: s(data.eggs_collected), broken: s(data.eggs_broken), mortality: s(data.mortality), culled: s(data.culled), feed: s(data.feed_kg), weight: s(data.avg_weight_g) };
        }),
    [flock.id, day],
  );
  const f: FlockFields = { ...EMPTY, ...(existing ?? {}), ...typed };
  const set = (k: keyof FlockFields) => (v: string) => {
    setError(null);
    setTyped((x) => ({ ...x, [k]: v }));
  };

  const submit = async () => {
    const r = flockEntry(flock.id, day, layer ? f : { ...f, eggs: "", broken: "" }, !layer);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    const res = await save({ kind: "flock", farmId, data: { ...r.entry, flock_name: flock.name } });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
    } else onDone(res);
  };

  const field = (k: keyof FlockFields, label: string, icon: string) => (
    <TextInput
      mode="outlined"
      label={label}
      value={f[k] ?? ""}
      onChangeText={set(k)}
      keyboardType={k === "feed" || k === "weight" ? "decimal-pad" : "number-pad"}
      left={<TextInput.Icon icon={icon} />}
      style={styles.half}
      testID={`flock-${k}`}
    />
  );

  return (
    <View style={styles.sheet}>
      {existing && (
        <Text variant="bodySmall" style={{ color: theme.colors.primary }} testID="flock-existing">
          {t("entry.existing")}
        </Text>
      )}
      <View style={styles.grid}>
        {layer && field("eggs", t("entry.eggs"), "egg-outline")}
        {layer && field("broken", t("entry.broken"), "egg-off-outline")}
        {field("mortality", t("entry.mortality"), "skull-outline")}
        {field("culled", t("entry.culled"), "minus-circle-outline")}
        {field("feed", t("entry.feed"), "sack")}
        {!layer && field("weight", t("entry.weight"), "scale")}
      </View>
      <FormError message={error} detail={detail} />
      <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="flock-save">
        {t("entry.saveDay")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  sheet: { gap: 10 },
  cow: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 8, paddingVertical: 6, borderRadius: 16 },
  litres: { width: 130, textAlign: "right" },
  total: { textAlign: "right", marginTop: 4, fontVariant: ["tabular-nums"] },
  btn: { height: 50 },
  chips: { gap: 8, paddingVertical: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  half: { flexGrow: 1, flexBasis: "45%" },
  empty: { alignItems: "center", gap: 8, marginTop: 32, paddingHorizontal: 24 },
  center: { textAlign: "center" },
});
