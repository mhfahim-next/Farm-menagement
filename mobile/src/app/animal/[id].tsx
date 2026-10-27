import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Divider, List, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { RecordMenu } from "@/components/record-menu";
import { deleteRow, isManager, isStaff, useOptions } from "@/lib/data";
import { fattenStats } from "@/lib/fattening";
import { useToast } from "@/lib/toast";
import { useSession } from "@/lib/session";
import { farmToday } from "@/lib/dates";
import { siteLink } from "@/lib/env";
import { ageParts, optionLabel } from "@/lib/options";
import { photoUrl } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";

type Detail = {
  animal: {
    id: string;
    tag_number: string;
    name: string | null;
    breed: string | null;
    category: string;
    status: string;
    species: string | null;
    date_of_birth: string | null;
    purchase_date: string | null;
    father: string | null;
    photo_path: string | null;
    purchase_price: number | null;
    is_fattening: boolean;
    fattening_start: string | null;
    target_weight_kg: number | null;
    created_at: string;
    mother: { tag_number: string; name: string | null } | null;
  } | null;
  weights: { id: string; weigh_date: string; weight_kg: number; method: string }[];
  costs: number;
  sale: { sale_date: string; amount: number } | null;
  settings: { targetDate: string | null; dailyCost: number; pricePerKg: number };
  milk: { record_date: string; quantity_liters: number }[];
  health: { id: string; record_date: string; record_type: string; description: string | null; product: string | null; next_due_date: string | null; cost: number | null }[];
  breeding: { id: string; event_date: string; event_type: string; result: string | null; expected_calving_date: string | null; cost: number | null }[];
};

async function fetchDetail(id: string, since: string): Promise<Detail> {
  const [a, milk, health, breeding, weights, sale, sys] = await Promise.all([
    supabase
      .from("cattle")
      .select(
        "id, farm_id, tag_number, name, breed, category, status, species, date_of_birth, purchase_date, purchase_price, father, mother_id, photo_path, is_fattening, fattening_start, target_weight_kg, created_at",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("milk_records").select("record_date, quantity_liters").eq("cattle_id", id).gte("record_date", since),
    supabase
      .from("health_records")
      .select("id, record_date, record_type, description, product, next_due_date, cost")
      .eq("cattle_id", id)
      .order("record_date", { ascending: false })
      .limit(20),
    supabase
      .from("breeding_events")
      .select("id, event_date, event_type, result, expected_calving_date, cost")
      .eq("cattle_id", id)
      .order("event_date", { ascending: false })
      .limit(20),
    supabase
      .from("cattle_weights")
      .select("id, weigh_date, weight_kg, method")
      .eq("cattle_id", id)
      .order("weigh_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("sales").select("sale_date, amount").eq("cattle_id", id).eq("product", "animal").order("sale_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("system_settings").select("qurbani_date").eq("id", 1).maybeSingle(),
  ]);
  const err = a.error ?? milk.error ?? health.error ?? breeding.error ?? weights.error;
  if (err) throw new Error(err.message);
  const row = a.data as (Omit<NonNullable<Detail["animal"]>, "mother"> & { mother_id: string | null; farm_id: string }) | null;
  // The mother is another row of the same table.
  const mother = row?.mother_id ? await supabase.from("cattle").select("tag_number, name").eq("id", row.mother_id).maybeSingle() : null;
  if (mother?.error) throw new Error(mother.error.message);
  // The farm's fattening numbers (the row is per farm; RLS shows only the farms you belong to).
  const fs = row?.is_fattening
    ? (await supabase.from("fattening_settings").select("target_date, daily_cost_cattle, daily_cost_goat, price_kg_cattle, price_kg_goat").eq("farm_id", row.farm_id).maybeSingle()).data
    : null;
  const small = row?.species === "goat" || row?.species === "sheep";
  const s = (fs ?? {}) as { target_date?: string | null; daily_cost_cattle?: number | null; daily_cost_goat?: number | null; price_kg_cattle?: number | null; price_kg_goat?: number | null };
  const healthRows = (health.data ?? []) as Detail["health"];
  const breedingRows = (breeding.data ?? []) as Detail["breeding"];
  return {
    animal: row ? { ...row, mother: (mother?.data as NonNullable<Detail["animal"]>["mother"]) ?? null } : null,
    milk: (milk.data ?? []) as Detail["milk"],
    health: healthRows,
    breeding: breedingRows,
    weights: (weights.data ?? []) as Detail["weights"],
    costs: [...healthRows, ...breedingRows].reduce((sum, r) => sum + Number(r.cost ?? 0), 0),
    sale: (sale.data as Detail["sale"]) ?? null,
    settings: {
      targetDate: s.target_date ?? ((sys.data as { qurbani_date: string | null } | null)?.qurbani_date ?? null),
      dailyCost: Number((small ? s.daily_cost_goat : s.daily_cost_cattle) ?? 0),
      pricePerKg: Number((small ? s.price_kg_goat : s.price_kg_cattle) ?? 0),
    },
  };
}

const minusDays = (iso: string, n: number) => new Date(Date.parse(iso) - n * 86_400_000).toISOString().slice(0, 10);

/** One animal: its details, milk, and latest health and breeding records. */
export default function AnimalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, date, locale } = usePrefs();
  const theme = useTheme();
  const options = useOptions();
  const today = farmToday();
  const { data, offline, error, loading, reload } = useCached(id ? `animal.${id}` : null, () => fetchDetail(id, minusDays(today, 29)));
  const role = useSession().current?.role;
  const staff = isStaff(role);
  const manager = isManager(role);
  const { n, money } = usePrefs();
  const currency = useSession().current?.farm.currency ?? "BDT";
  const toast = useToast();
  const del = (table: Parameters<typeof deleteRow>[0], rowId: string) => async () => {
    const err = await deleteRow(table, rowId);
    toast(err ? `${t("common.error")} ${err}` : t("rec.deleted"));
    reload();
  };
  const setFattening = async (on: boolean) => {
    if (!data?.animal) return;
    const { error: e } = await supabase
      .from("cattle")
      .update(on ? { is_fattening: true, fattening_start: farmToday() } : { is_fattening: false, fattening_start: null })
      .eq("id", data.animal.id);
    toast(e ? `${t("common.error")} ${e.message}` : on ? t("fatten.started") : t("fatten.stopped"));
    reload();
  };
  // Fresh records when coming back from adding one.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const a = data?.animal;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/animals"));
  const label = (list: string, v: string | null | undefined) => optionLabel(options, list, v, locale);

  const since7 = minusDays(today, 6);
  const milk30 = (data?.milk ?? []).reduce((s, m) => s + Number(m.quantity_liters), 0);
  const milk7 = (data?.milk ?? []).filter((m) => m.record_date >= since7).reduce((s, m) => s + Number(m.quantity_liters), 0);
  const age = ageParts(a?.date_of_birth ?? null, today);
  const ageText = !age ? null : [age.y ? t("age.y", { n: age.y }) : "", age.m ? t("age.m", { n: age.m }) : "", !age.y && !age.m ? t("age.d", { n: age.d }) : ""].filter(Boolean).join(" ");

  const fattenFarm = Boolean(useSession().current?.farm.has_fattening);
  const fat = fattenStats({
    startDate: a?.fattening_start ?? a?.purchase_date ?? a?.created_at?.slice(0, 10) ?? today,
    purchasePrice: Number(a?.purchase_price ?? 0),
    weights: (data?.weights ?? []).map((w) => ({ date: w.weigh_date, kg: Number(w.weight_kg) })),
    directCosts: data?.costs ?? 0,
    dailyCost: data?.settings.dailyCost ?? 0,
    pricePerKg: data?.settings.pricePerKg ?? 0,
    targetDate: data?.settings.targetDate ?? null,
    today,
    sale: data?.sale ? { date: data.sale.sale_date, amount: Number(data.sale.amount) } : null,
  });

  const facts: [string, string | null | undefined][] = a
    ? [
        [t("animal.type"), label("cattle_category", a.category)],
        [t("animal.breed"), a.breed ? label("cattle_breed", a.breed) : null],
        [t("animal.age"), ageText ? `${ageText} (${date(a.date_of_birth)})` : null],
        [t("animal.status"), label("cattle_status", a.status)],
        [t("animal.mother"), a.mother ? `#${a.mother.tag_number}${a.mother.name ? ` · ${a.mother.name}` : ""}` : null],
        [t("animal.father"), a.father],
        [t("animal.bought"), a.purchase_date ? date(a.purchase_date) : null],
      ]
    : [];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="animal-page">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={a ? `#${a.tag_number}${a.name ? ` · ${a.name}` : ""}` : ""} />
        {a && staff ? <Appbar.Action icon="pencil-outline" onPress={() => router.push({ pathname: "/record/animal", params: { id: a.id } })} accessibilityLabel={t("animal.editTitle")} testID="animal-edit" /> : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {loading && <Text>{t("common.loading")}</Text>}
          {error && !a && <FormError message={t("common.error")} detail={error} />}
          {!loading && !error && !a && <Text variant="titleMedium">{t("animal.notFound")}</Text>}
          {a && (
            <>
              {a.photo_path ? <Image source={{ uri: photoUrl("animal-photos", a.photo_path)! }} style={styles.photo} resizeMode="cover" testID="animal-photo" /> : null}
              {staff && a.status === "active" && (
                <View style={styles.actions}>
                  <Button mode="contained-tonal" icon="needle" compact onPress={() => router.push({ pathname: "/record/health", params: { animal: a.id } })} testID="act-health">
                    {t("rec.healthTitle")}
                  </Button>
                  {["cow", "heifer", "doe", "doeling", "ewe", "ewe_lamb"].includes(a.category) && (
                    <Button mode="contained-tonal" icon="heart-pulse" compact onPress={() => router.push({ pathname: "/record/breeding", params: { animal: a.id } })} testID="act-breeding">
                      {t("rec.breedingTitle")}
                    </Button>
                  )}
                  <Button mode="contained-tonal" icon="cart-outline" compact onPress={() => router.push({ pathname: "/record/sale", params: { animal: a.id } })} testID="act-sell">
                    {t("animal.sell")}
                  </Button>
                </View>
              )}

              <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
                <Card.Content>
                  {facts
                    .filter(([, v]) => v)
                    .map(([k, v], i) => (
                      <View key={k}>
                        {i > 0 && <Divider />}
                        <View style={styles.fact}>
                          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {k}
                          </Text>
                          <Text variant="bodyLarge" style={styles.factValue}>
                            {v}
                          </Text>
                        </View>
                      </View>
                    ))}
                </Card.Content>
              </Card>

              {(a.species ?? "cattle") === "cattle" && (milk30 > 0 || ["cow", "heifer"].includes(a.category)) && (
                <Card mode="outlined" style={styles.card}>
                  <Card.Title title={t("animal.milk")} titleVariant="titleMedium" />
                  <Card.Content>
                    {milk30 > 0 ? (
                      <View style={styles.milk}>
                        <View style={styles.milkBox}>
                          <Text variant="headlineSmall" testID="milk-7">{t("home.litres", { n: Math.round(milk7 * 10) / 10 })}</Text>
                          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.milk7")}</Text>
                        </View>
                        <View style={styles.milkBox}>
                          <Text variant="headlineSmall">{t("home.litres", { n: Math.round(milk30 * 10) / 10 })}</Text>
                          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.milk30")}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.noMilk")}</Text>
                    )}
                  </Card.Content>
                </Card>
              )}

              <Card mode="outlined" style={styles.card} testID="weights-card">
                <Card.Title
                  title={t("weight.title")}
                  titleVariant="titleMedium"
                  right={() =>
                    staff ? (
                      <Button icon="plus" compact onPress={() => router.push({ pathname: "/record/weight", params: { animal: a.id } })} testID="add-weight">
                        {t("weight.add")}
                      </Button>
                    ) : null
                  }
                />
                {data.weights.length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("weight.none")}</Text>
                  </Card.Content>
                ) : (
                  <>
                    <Card.Content>
                      <Text variant="headlineSmall" testID="weight-latest">{`${n(Number(data.weights[0].weight_kg), 1)} kg`}</Text>
                      {fat.adg !== null && (
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} testID="weight-adg">
                          {t("weight.adg", { g: n(Math.round(fat.adg * 1000)) })}
                        </Text>
                      )}
                    </Card.Content>
                    {data.weights.slice(0, 6).map((w) => (
                      <List.Item
                        key={w.id}
                        title={`${n(Number(w.weight_kg), 1)} kg`}
                        description={`${date(w.weigh_date)} · ${t(w.method === "tape" ? "weight.tape" : "weight.scale")}`}
                        left={(p) => <List.Icon {...p} icon="scale" />}
                        right={() => (manager ? <RecordMenu onDelete={del("cattle_weights", w.id)} testID={`weight-menu-${w.id}`} /> : null)}
                      />
                    ))}
                  </>
                )}
              </Card>

              {a.is_fattening ? (
                <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]} testID="fatten-card">
                  <Card.Title title={t("fatten.title")} titleVariant="titleMedium" left={(p) => <List.Icon {...p} icon="weight-kilogram" />} />
                  <Card.Content style={{ gap: 4 }}>
                    <Text variant="bodyMedium">{t("fatten.days", { n: fat.daysOnFeed })}</Text>
                    {fat.gainKg !== null && <Text variant="bodyMedium">{t("fatten.gain", { kg: n(fat.gainKg, 1) })}</Text>}
                    {fat.projectedKg !== null && data.settings.targetDate && (
                      <Text variant="bodyMedium" testID="fatten-projected">{t("fatten.projected", { kg: n(fat.projectedKg, 0), date: date(data.settings.targetDate) })}</Text>
                    )}
                    <Text variant="bodyMedium">{t("fatten.costSoFar", { amount: money(fat.costSoFar, currency) })}</Text>
                    {fat.breakEvenPerKg !== null && <Text variant="bodyMedium">{t("fatten.breakEven", { amount: money(Math.round(fat.breakEvenPerKg), currency) })}</Text>}
                    {fat.estProfit !== null && (
                      <Text variant="titleSmall" style={{ color: fat.estProfit >= 0 ? theme.colors.primary : theme.colors.error }}>
                        {t("fatten.estProfit", { amount: money(Math.round(fat.estProfit), currency) })}
                      </Text>
                    )}
                    {fat.realProfit !== null && <Text variant="titleSmall">{t("fatten.realProfit", { amount: money(Math.round(fat.realProfit), currency) })}</Text>}
                    {!data.settings.pricePerKg && <Text variant="bodySmall">{t("fatten.setPrices")}</Text>}
                  </Card.Content>
                  {staff && a.status === "active" && (
                    <Card.Actions>
                      <Button onPress={() => setFattening(false)} testID="fatten-stop">
                        {t("fatten.stop")}
                      </Button>
                    </Card.Actions>
                  )}
                </Card>
              ) : staff && a.status === "active" && fattenFarm ? (
                <Button mode="outlined" icon="weight-kilogram" onPress={() => setFattening(true)} testID="fatten-start">
                  {t("fatten.start")}
                </Button>
              ) : null}

              <Card mode="outlined" style={styles.card}>
                <Card.Title title={t("animal.health")} titleVariant="titleMedium" />
                {data.health.length === 0 ? (
                  <Card.Content>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.noHealth")}</Text>
                  </Card.Content>
                ) : (
                  data.health.map((h) => (
                    <List.Item
                      key={h.id}
                      title={[label("health_type", h.record_type), h.product].filter(Boolean).join(" · ")}
                      description={[date(h.record_date), h.next_due_date ? t("animal.nextDue", { date: date(h.next_due_date) }) : "", h.description ?? ""].filter(Boolean).join(" · ")}
                      descriptionNumberOfLines={2}
                      left={(p) => <List.Icon {...p} icon="needle" />}
                      right={() => (
                        <RecordMenu
                          onEdit={staff ? () => router.push({ pathname: "/record/health", params: { id: h.id } }) : undefined}
                          onDelete={manager ? del("health_records", h.id) : undefined}
                          testID={`health-menu-${h.id}`}
                        />
                      )}
                    />
                  ))
                )}
              </Card>

              {(a.species ?? "cattle") !== "cattle" || ["cow", "heifer", "doe", "ewe"].includes(a.category) || data.breeding.length ? (
                <Card mode="outlined" style={styles.card}>
                  <Card.Title title={t("animal.breeding")} titleVariant="titleMedium" />
                  {data.breeding.length === 0 ? (
                    <Card.Content>
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("animal.noBreeding")}</Text>
                    </Card.Content>
                  ) : (
                    data.breeding.map((b) => (
                      <List.Item
                        key={b.id}
                        title={label("breeding_event", b.event_type)}
                        description={[date(b.event_date), b.result ? label("pregnancy_result", b.result) : "", b.expected_calving_date ? t("animal.expected", { date: date(b.expected_calving_date) }) : ""]
                          .filter(Boolean)
                          .join(" · ")}
                        left={(p) => <List.Icon {...p} icon="heart-pulse" />}
                        right={() => (
                          <RecordMenu
                            onEdit={staff ? () => router.push({ pathname: "/record/breeding", params: { id: b.id } }) : undefined}
                            onDelete={manager ? del("breeding_events", b.id) : undefined}
                            testID={`breeding-menu-${b.id}`}
                          />
                        )}
                      />
                    ))
                  )}
                </Card>
              ) : null}

              <Button mode="contained-tonal" icon="open-in-new" onPress={() => WebBrowser.openBrowserAsync(siteLink(`/dashboard/cattle/${a.id}`))} style={styles.card}>
                {t("animal.openWeb")}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 20 },
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 10 },
  factValue: { flexShrink: 1, textAlign: "right", fontWeight: "500" },
  milk: { flexDirection: "row", gap: 12 },
  milkBox: { flex: 1, gap: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
