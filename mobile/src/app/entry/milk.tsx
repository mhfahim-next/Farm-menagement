import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, IconButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EntryDone } from "@/components/entry-done";
import { DateField } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useAnimals, useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { milkEntry } from "@/lib/entries";
import { defaultSession, farmHour, fillFrom, filledCount, stepLitres } from "@/lib/entry-helpers";
import { milkingCategories, optionLabel, optionsOf } from "@/lib/options";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { addDays, isDate } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

const SESSION_ICON: Record<string, string> = { morning: "weather-sunset-up", evening: "weather-night", other: "plus-circle-outline" };

/** Litres per cow for one milking, read back when it was already written. */
async function loadMilk(farmId: string, day: string, session: string) {
  const { data, error } = await supabase.from("milk_records").select("cattle_id, quantity_liters").eq("farm_id", farmId).eq("record_date", day).eq("session", session);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.cattle_id as string, String(Number(r.quantity_liters))]));
}

/** The milking sheet: one line per milking cow, the total and Save always at the bottom. */
export default function MilkSheet() {
  const params = useLocalSearchParams<{ session?: string; day?: string }>();
  const { t, n, locale, date } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { current } = useSession();
  const farm = current?.farm;
  const options = useOptions();
  const { save } = useOutbox();
  const sessions = optionsOf(options, "milk_session").map((s) => s.value);
  const [day, setDay] = useState(params.day && isDate(params.day) ? params.day : farmToday());
  const [session, setSession] = useState(params.session ?? defaultSession(farmHour()));
  const { data: animals, offline, reload } = useAnimals(farm?.id);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const cows = useMemo(() => {
    const cats = milkingCategories(options);
    return (animals ?? []).filter((a) => a.status === "active" && (a.species ?? "cattle") === "cattle" && cats.includes(a.category));
  }, [animals, options]);
  const ids = cows.map((c) => c.id);
  const key = `${day}|${session}`;
  const [saved, setSaved] = useState<Record<string, Record<string, string>>>({});
  const [typed, setTyped] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ total: number; cows: number; queued: boolean } | null>(null);

  // What is already written for this day and milking.
  useEffect(() => {
    if (!farm || !isDate(day)) return;
    let cancelled = false;
    loadMilk(farm.id, day, session).then(
      (v) => !cancelled && setSaved((s) => ({ ...s, [key]: v })),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [farm, day, session, key]);

  const existing = saved[key] ?? {};
  const onSheet = new Set(ids);
  const values = Object.fromEntries(Object.entries({ ...existing, ...(typed[key] ?? {}) }).filter(([id]) => onSheet.has(id)));
  const total = milkEntry(day, session, values);
  const filled = filledCount(values, ids);
  const set = (id: string, v: string) => {
    setError(null);
    setTyped((x) => ({ ...x, [key]: { ...(x[key] ?? {}), [id]: v } }));
  };

  const sameAsYesterday = async () => {
    if (!farm) return;
    try {
      const prev = await loadMilk(farm.id, addDays(day, -1), session);
      const r = fillFrom(prev, values, ids);
      if (!r.filled) return toast(t("milk.nothingYesterday"));
      setTyped((x) => ({ ...x, [key]: { ...(x[key] ?? {}), ...r.values } }));
      toast(t("milk.filled", { n: r.filled }));
    } catch {
      toast(t("common.network"));
    }
  };

  const submit = async () => {
    if (!farm) return;
    if (!isDate(day)) return setError(t("rec.err.date"));
    const r = milkEntry(day, session, values);
    if (!r.ok) return setError(t(r.error));
    setError(null);
    setDetail(null);
    setBusy(true);
    const res = await save({ kind: "milk", farmId: farm.id, data: r.entry });
    setBusy(false);
    if (res.status === "error") {
      setError(t("common.error"));
      setDetail(res.error);
      return;
    }
    setDone({ total: r.total, cows: r.entry.rows.length, queued: res.status === "queued" });
  };

  const sessionName = (v: string) => optionLabel(options, "milk_session", v, locale) || v;

  if (done) {
    const next = [
      ...(session === "morning" && day === farmToday()
        ? [{ label: t("milk.nextEvening"), icon: "weather-night", testID: "next-evening", go: () => (setDone(null), setTyped({}), setSession("evening")) }]
        : []),
      ...(farm?.has_layer || farm?.has_broiler ? [{ label: t("milk.nextEggs"), icon: "egg-outline", testID: "next-eggs", go: () => router.replace("/entry/birds") }] : []),
    ];
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <EntryDone
          title={t("milk.savedTitle", { session: sessionName(session) })}
          body={`${date(day)} · ${t("milk.savedBody", { l: n(Math.round(done.total * 10) / 10, 1), n: n(done.cows) })}`}
          queued={done.queued}
          next={next}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="milk-sheet">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/entry"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("hub.milk")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <DateField value={day} onChange={setDay} label={t("milk.whichDay")} testID="milk-day" />
          <SegmentedButtons
            value={session}
            onValueChange={(v) => {
              setSession(v);
              setError(null);
            }}
            buttons={(sessions.length ? sessions : ["morning", "evening"]).map((v) => ({ value: v, label: sessionName(v), icon: SESSION_ICON[v] ?? "clock-outline", testID: `session-${v}` }))}
          />
          {offline && <OfflineNote />}
          {Object.keys(existing).length > 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }} testID="milk-existing">
              {t("entry.existing")}
            </Text>
          )}
          {cows.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>{t("entry.noCowsBody")}</Text>
          ) : (
            <>
              <View style={styles.tools}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} testID="milk-progress">
                  {t("milk.progress", { done: n(filled), all: n(cows.length) })}
                </Text>
                <Button mode="outlined" compact icon="content-copy" onPress={sameAsYesterday} testID="milk-yesterday">
                  {t("milk.sameAsYesterday")}
                </Button>
              </View>
              {cows.map((a) => {
                const v = values[a.id] ?? "";
                return (
                  <View key={a.id} style={[styles.cow, { backgroundColor: v ? theme.colors.primaryContainer : theme.colors.elevation.level1 }]}>
                    <View style={styles.flex}>
                      <Text variant="titleSmall">#{a.tag_number}</Text>
                      {a.name ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                          {a.name}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton icon="minus" mode="outlined" size={18} onPress={() => set(a.id, stepLitres(v, -0.5))} accessibilityLabel={t("milk.less")} testID={`milk-minus-${a.tag_number}`} />
                    <TextInput
                      mode="outlined"
                      dense
                      value={v}
                      onChangeText={(x) => set(a.id, x)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      right={<TextInput.Affix text={locale === "bn" ? "লি." : "L"} />}
                      style={styles.litres}
                      accessibilityLabel={`#${a.tag_number}`}
                      testID={`milk-${a.tag_number}`}
                    />
                    <IconButton icon="plus" mode="contained-tonal" size={18} onPress={() => set(a.id, stepLitres(v, 0.5))} accessibilityLabel={t("milk.more")} testID={`milk-plus-${a.tag_number}`} />
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
      {cows.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.background }]}>
          <FormError message={error} detail={detail} />
          <View style={styles.footRow}>
            <View style={styles.flex}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("milk.total")}
              </Text>
              <Text variant="titleLarge" testID="milk-total">
                {t("milk.totalValue", { l: n(total.ok ? Math.round(total.total * 10) / 10 : 0, 1), n: n(total.ok ? total.entry.rows.length : 0) })}
              </Text>
            </View>
            <Button mode="contained" icon="content-save-outline" onPress={submit} loading={busy} disabled={busy} contentStyle={styles.btn} testID="milk-save">
              {t("rec.save")}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 10 },
  tools: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  cow: { flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 14, paddingRight: 4, paddingVertical: 4, borderRadius: 16 },
  litres: { width: 104, textAlign: "right" },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8, width: "100%", maxWidth: 752, alignSelf: "center" },
  footRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  btn: { height: 50, paddingHorizontal: 12 },
});
