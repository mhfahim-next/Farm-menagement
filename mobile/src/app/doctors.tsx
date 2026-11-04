import { router } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Avatar, Button, Card, Chip, Searchbar, Text, useTheme } from "react-native-paper";
import { DistrictPicker } from "@/components/district-picker";
import { OfflineNote } from "@/components/offline-note";
import { whatsappLink } from "@/lib/bill-doc";
import { useCached } from "@/lib/cache";
import { isManager, useOptions } from "@/lib/data";
import { districtByKey, districtIn } from "@/lib/districts";
import { usePrefs } from "@/lib/prefs";
import { optionLabel } from "@/lib/options";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

type Doctor = { id: string; full_name: string | null; avatar_url: string | null; specialty: string | null; district: string | null; area: string | null; phone: string | null; farms_served: number };

async function fetchDoctors(district: string | null, q: string) {
  const { data, error } = await supabase.rpc("find_doctors", { p_district: district, p_search: q || null, p_only_district: false, p_limit: 60 });
  if (error) throw new Error(error.message);
  return (data ?? []) as Doctor[];
}

/** Find a vet: verified doctors, the farm's district first; owners and managers invite one in a tap. */
export default function DoctorsScreen() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const toast = useToast();
  const current = useSession().current;
  const farm = current?.farm;
  const options = useOptions();
  const [district, setDistrict] = useState(districtIn(farm?.location) ?? "");
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const list = useCached(farm ? `doctors.${district}.${q}` : null, () => fetchDoctors(district || null, q));
  const canInvite = isManager(current?.role);
  const name = (key: string | null) => {
    const d = districtByKey(key);
    return d ? (locale === "bn" ? d.bn : d.en) : null;
  };
  const invite = async (d: Doctor) => {
    if (!farm) return;
    setBusy(d.id);
    const { data, error } = await supabase.rpc("invite_listed_doctor", { p_farm: farm.id, p_doctor: d.id });
    setBusy(null);
    if (error) return toast(error.message.includes("TOO_MANY_INVITES") ? t("vets.err.tooMany") : error.message.includes("DOCTOR_NOT_FOUND") ? t("vets.err.notFound") : `${t("common.error")} ${error.message}`);
    toast(data === "member" ? t("vets.alreadyMember") : data === "pending" ? t("vets.alreadyInvited") : t("vets.invited"));
  };
  const doctors = list.data ?? [];
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="doctors-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("vets.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("vets.desc")}
          </Text>
          <DistrictPicker value={district} onChange={setDistrict} placeholder={t("vets.chooseDistrict")} allLabel={t("vets.allDistricts")} testID="vets-district" />
          <Searchbar placeholder={t("vets.searchHint")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} onClearIconPress={() => setQ("")} testID="vets-search" />
          {list.offline && <OfflineNote />}
          {!canInvite && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("vets.askOwner")}
            </Text>
          )}
          {list.error && !list.data ? (
            <Text>{t("vets.unavailable")}</Text>
          ) : list.data && doctors.length === 0 ? (
            <Text>{`${t("vets.none")}. ${t("vets.noneHint")}`}</Text>
          ) : (
            doctors.map((d) => (
              <Card key={d.id} mode="outlined" style={styles.card} testID={`vet-${d.id}`}>
                <Card.Title
                  title={d.full_name ?? "—"}
                  subtitle={[d.specialty && optionLabel(options ?? null, "doctor_specialty", d.specialty, locale), [d.area, name(d.district)].filter(Boolean).join(", ") || t("vets.noArea")].filter(Boolean).join(" · ")}
                  subtitleNumberOfLines={2}
                  left={(p) => (d.avatar_url ? <Avatar.Image {...p} source={{ uri: d.avatar_url }} /> : <Avatar.Icon {...p} icon="stethoscope" />)}
                />
                <Card.Content style={{ gap: 8 }}>
                  <View style={styles.row}>
                    <Chip compact icon="check-decagram">
                      {t("doc.verified")}
                    </Chip>
                    {district && d.district === district && <Chip compact icon="map-marker">{name(district)}</Chip>}
                  </View>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t("vets.serves", { n: Number(d.farms_served) })}
                  </Text>
                  <View style={styles.row}>
                    {d.phone && (
                      <>
                        <Button mode="outlined" icon="phone" onPress={() => Linking.openURL(`tel:${d.phone}`)} testID="vet-call">
                          {d.phone}
                        </Button>
                        <Button mode="outlined" icon="whatsapp" onPress={() => Linking.openURL(whatsappLink(d.phone, ""))}>
                          WhatsApp
                        </Button>
                      </>
                    )}
                    {canInvite && (
                      <Button mode="contained" icon="account-plus" loading={busy === d.id} disabled={busy !== null} onPress={() => invite(d)} testID={`vet-invite-${d.id}`}>
                        {t("vets.invite")}
                      </Button>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
});
