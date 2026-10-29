import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Divider, List, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { useCached } from "@/lib/cache";
import { RecordMenu } from "@/components/record-menu";
import { fetchAnimalDetail, isManager, isStaff, minusDays, useOptions } from "@/lib/data";
import { fattenStats } from "@/lib/fattening";
import { useToast } from "@/lib/toast";
import { useSession } from "@/lib/session";
import { farmToday } from "@/lib/dates";
import { siteLink } from "@/lib/env";
import { ageParts, optionLabel } from "@/lib/options";
import { photoUrl } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { useOutbox, useRemove } from "@/lib/outbox";
import type { DeleteTable } from "@/lib/outbox-core";

/** One animal: its details, milk, and latest health and breeding records. */
export default function AnimalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, date, locale } = usePrefs();
  const theme = useTheme();
  const options = useOptions();
  const today = farmToday();
  const { data, offline, error, loading, reload } = useCached(id ? `animal.${id}` : null, () => fetchAnimalDetail(id, minusDays(today, 29)));
  const role = useSession().current?.role;
  const staff = isStaff(role);
  // Doctors add vaccines and breeding too; theirs go to the owner for approval.
  const vet = role === "vet";
  const manager = isManager(role);
  const { n, money } = usePrefs();
  const currency = useSession().current?.farm.currency ?? "BDT";
  const currentFarmId = useSession().current?.farm.id;
  const toast = useToast();
  const remove = useRemove();
  const { save } = useOutbox();
  const del = (table: DeleteTable, rowId: string) => async () => {
    const r = await remove(table, rowId, `${t("rec.delete")} · #${data?.animal?.tag_number ?? ""}`);
    toast(r.error ? `${t("common.error")} ${r.error}` : r.queued ? t("entry.queued") : t("rec.deleted"));
    reload();
  };
  const setFattening = async (on: boolean) => {
    const a = data?.animal;
    const farmId = currentFarmId;
    if (!a || !farmId) return;
    const patch = on ? { is_fattening: true, fattening_start: farmToday() } : { is_fattening: false, fattening_start: null };
    const r = await save({
      kind: "update",
      farmId,
      data: { table: "cattle", id: a.id, patch, seen: a.updated_at, before: { is_fattening: a.is_fattening, fattening_start: a.fattening_start }, label: `#${a.tag_number}` },
    });
    toast(r.status === "error" ? `${t("common.error")} ${r.error}` : r.status === "queued" ? t("entry.queued") : on ? t("fatten.started") : t("fatten.stopped"));
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
              {(staff || vet) && a.status === "active" && (
                <View style={styles.actions}>
                  <Button mode="contained-tonal" icon="needle" compact onPress={() => router.push({ pathname: "/record/health", params: { animal: a.id } })} testID="act-health">
                    {t("rec.healthTitle")}
                  </Button>
                  {["cow", "heifer", "doe", "doeling", "ewe", "ewe_lamb"].includes(a.category) && (
                    <Button mode="contained-tonal" icon="heart-pulse" compact onPress={() => router.push({ pathname: "/record/breeding", params: { animal: a.id } })} testID="act-breeding">
                      {t("rec.breedingTitle")}
                    </Button>
                  )}
                  {staff && (
                    <Button mode="contained-tonal" icon="cart-outline" compact onPress={() => router.push({ pathname: "/record/sale", params: { animal: a.id } })} testID="act-sell">
                      {t("animal.sell")}
                    </Button>
                  )}
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
                          onEdit={staff ? () => router.push({ pathname: "/record/health", params: { id: h.id, animal: a.id } }) : undefined}
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
                            onEdit={staff ? () => router.push({ pathname: "/record/breeding", params: { id: b.id, animal: a.id } }) : undefined}
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
