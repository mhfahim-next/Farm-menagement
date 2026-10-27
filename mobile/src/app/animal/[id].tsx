import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Divider, List, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { siteLink } from "@/lib/env";
import { ageParts, optionLabel } from "@/lib/options";
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
    mother: { tag_number: string; name: string | null } | null;
  } | null;
  milk: { record_date: string; quantity_liters: number }[];
  health: { id: string; record_date: string; record_type: string; description: string | null; product: string | null; next_due_date: string | null }[];
  breeding: { id: string; event_date: string; event_type: string; result: string | null; expected_calving_date: string | null }[];
};

async function fetchDetail(id: string, since: string): Promise<Detail> {
  const [a, milk, health, breeding] = await Promise.all([
    supabase
      .from("cattle")
      .select("id, tag_number, name, breed, category, status, species, date_of_birth, purchase_date, father, mother_id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("milk_records").select("record_date, quantity_liters").eq("cattle_id", id).gte("record_date", since),
    supabase
      .from("health_records")
      .select("id, record_date, record_type, description, product, next_due_date")
      .eq("cattle_id", id)
      .order("record_date", { ascending: false })
      .limit(5),
    supabase
      .from("breeding_events")
      .select("id, event_date, event_type, result, expected_calving_date")
      .eq("cattle_id", id)
      .order("event_date", { ascending: false })
      .limit(5),
  ]);
  const err = a.error ?? milk.error ?? health.error ?? breeding.error;
  if (err) throw new Error(err.message);
  const row = a.data as (Omit<NonNullable<Detail["animal"]>, "mother"> & { mother_id: string | null }) | null;
  // The mother is another row of the same table.
  const mother = row?.mother_id ? await supabase.from("cattle").select("tag_number, name").eq("id", row.mother_id).maybeSingle() : null;
  if (mother?.error) throw new Error(mother.error.message);
  return {
    animal: row ? { ...row, mother: (mother?.data as NonNullable<Detail["animal"]>["mother"]) ?? null } : null,
    milk: (milk.data ?? []) as Detail["milk"],
    health: (health.data ?? []) as Detail["health"],
    breeding: (breeding.data ?? []) as Detail["breeding"],
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
  const { data, offline, error, loading } = useCached(id ? `animal.${id}` : null, () => fetchDetail(id, minusDays(today, 29)));
  const a = data?.animal;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/animals"));
  const label = (list: string, v: string | null | undefined) => optionLabel(options, list, v, locale);

  const since7 = minusDays(today, 6);
  const milk30 = (data?.milk ?? []).reduce((s, m) => s + Number(m.quantity_liters), 0);
  const milk7 = (data?.milk ?? []).filter((m) => m.record_date >= since7).reduce((s, m) => s + Number(m.quantity_liters), 0);
  const age = ageParts(a?.date_of_birth ?? null, today);
  const ageText = !age ? null : [age.y ? t("age.y", { n: age.y }) : "", age.m ? t("age.m", { n: age.m }) : "", !age.y && !age.m ? t("age.d", { n: age.d }) : ""].filter(Boolean).join(" ");

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
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {loading && <Text>{t("common.loading")}</Text>}
          {error && !a && <FormError message={t("common.error")} detail={error} />}
          {!loading && !error && !a && <Text variant="titleMedium">{t("animal.notFound")}</Text>}
          {a && (
            <>
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

              {(a.species ?? "cattle") === "cattle" && (
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
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 10 },
  factValue: { flexShrink: 1, textAlign: "right", fontWeight: "500" },
  milk: { flexDirection: "row", gap: 12 },
  milkBox: { flex: 1, gap: 2 },
});
