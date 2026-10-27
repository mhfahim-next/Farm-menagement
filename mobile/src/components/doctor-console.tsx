import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Dialog, Icon, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChoiceChips, Label } from "@/components/fields";
import { InviteCards } from "@/components/invite-card";
import { useCached } from "@/lib/cache";
import { useOptions } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { optionLabel, optionsOf } from "@/lib/options";
import { usePrefs } from "@/lib/prefs";
import { overdueCount } from "@/lib/records";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

type DoctorData = {
  profile: { full_name: string | null; doctor_verified: boolean; doctor_reg_no: string | null; doctor_specialty: string | null } | null;
  farms: { id: string; name: string; location: string | null; owner: string | null; animals: number; overdue: number }[];
};

/** A doctor's farms (with animals and overdue vaccines), invitations, and their doctor details. */
async function fetchDoctor(userId: string): Promise<DoctorData> {
  const [{ data: profile }, { data: members, error }] = await Promise.all([
    supabase.from("profiles").select("full_name, doctor_verified, doctor_reg_no, doctor_specialty").eq("id", userId).maybeSingle(),
    supabase.from("farm_members").select("farms(id, name, location, owner_id, suspended)").eq("user_id", userId).eq("role", "vet"),
  ]);
  if (error) throw new Error(error.message);
  const farms = ((members ?? []) as unknown as { farms: { id: string; name: string; location: string | null; owner_id: string; suspended: boolean } | null }[])
    .map((m) => m.farms)
    .filter((f): f is NonNullable<typeof f> => Boolean(f) && !f!.suspended);
  const ids = farms.map((f) => f.id);
  const [cattle, records, owners] = ids.length
    ? await Promise.all([
        supabase.from("cattle").select("id, farm_id").in("farm_id", ids).eq("status", "active").is("deleted_at", null),
        supabase.from("health_records").select("farm_id, cattle_id, record_type, product, description, record_date, next_due_date").in("farm_id", ids).not("next_due_date", "is", null),
        supabase.from("profiles").select("id, full_name").in("id", farms.map((f) => f.owner_id)),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const today = farmToday();
  const ownerName = new Map(((owners.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));
  return {
    profile: profile as DoctorData["profile"],
    farms: farms.map((f) => {
      const animals = ((cattle.data ?? []) as { id: string; farm_id: string }[]).filter((c) => c.farm_id === f.id);
      const rows = ((records.data ?? []) as (Parameters<typeof overdueCount>[0][number] & { farm_id: string })[]).filter((r) => r.farm_id === f.id);
      return { id: f.id, name: f.name, location: f.location, owner: ownerName.get(f.owner_id) ?? null, animals: animals.length, overdue: overdueCount(rows, new Set(animals.map((a) => a.id)), today) };
    }),
  };
}

export function DoctorConsole({ standalone }: { standalone?: boolean }) {
  const { t, n, locale } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const s = useSession();
  const toast = useToast();
  const options = useOptions();
  const uid = s.session?.user.id;
  const { data, reload } = useCached(uid ? `doctor.${uid}` : null, () => fetchDoctor(uid!));
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const [leaving, setLeaving] = useState<{ id: string; name: string } | null>(null);
  const [regNo, setRegNo] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const reg = regNo ?? data?.profile?.doctor_reg_no ?? "";
  const spec = specialty ?? data?.profile?.doctor_specialty ?? "";
  const farms = data?.farms ?? [];

  const open = (id: string) => {
    s.setCurrentFarm(id);
    router.replace("/home");
  };
  const leave = async () => {
    const f = leaving;
    setLeaving(null);
    if (!f) return;
    const { error } = await supabase.rpc("leave_farm", { p_farm: f.id });
    toast(error ? t("team.err.forbidden") : t("team.left"));
    await s.reload();
    reload();
  };
  const saveDetails = async () => {
    if (!uid) return;
    if (!reg.trim()) return toast(t("doc.regRequired"));
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ doctor_reg_no: reg.trim(), doctor_specialty: spec || null }).eq("id", uid);
    setSaving(false);
    toast(error ? `${t("common.error")} ${error.message}` : t("doc.detailsSaved"));
    reload();
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: standalone ? insets.top + 16 : 16 }]} testID="doctor-console">
      <View style={styles.inner}>
        <View style={styles.head}>
          <Icon source="stethoscope" size={36} color={theme.colors.primary} />
          <View style={styles.flex}>
            <Text variant="headlineSmall">{data?.profile?.full_name || t("doc.title")}</Text>
            {data?.profile && (
              <Chip compact icon={data.profile.doctor_verified ? "check-decagram" : "clock-outline"} style={styles.badge} testID="doctor-badge">
                {data.profile.doctor_verified ? t("doc.verified") : t("doc.unverified")}
              </Chip>
            )}
          </View>
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("doc.desc")}
        </Text>

        <InviteCards />

        <View style={styles.stats}>
          {[
            { k: "doc.farms", v: farms.length },
            { k: "doc.animals", v: farms.reduce((a, f) => a + f.animals, 0) },
            { k: "doc.overdue", v: farms.reduce((a, f) => a + f.overdue, 0) },
          ].map((x) => (
            <Card key={x.k} mode="contained" style={[styles.stat, { backgroundColor: theme.colors.elevation.level2 }]}>
              <Card.Content>
                <Text variant="headlineSmall">{n(x.v)}</Text>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t(x.k as "doc.farms")}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {data && farms.length === 0 && (
          <Card mode="outlined" style={styles.card}>
            <Card.Content style={{ gap: 6 }}>
              <Text variant="titleMedium">{t("doc.emptyTitle")}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("doc.emptyBody")}
              </Text>
            </Card.Content>
          </Card>
        )}
        {farms.map((f) => (
          <Card key={f.id} mode="outlined" style={styles.card} testID={`doctor-farm-${f.name}`}>
            <Card.Content style={{ gap: 6 }}>
              <Text variant="titleMedium">{f.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {[f.location, f.owner ? t("doc.owner", { name: f.owner }) : "", t("doc.animalsN", { n: n(f.animals) })].filter(Boolean).join(" · ")}
              </Text>
              <Chip compact icon={f.overdue ? "alert-circle-outline" : "check-circle-outline"} style={[styles.badge, { backgroundColor: f.overdue ? theme.colors.errorContainer : theme.colors.primaryContainer }]}>
                {f.overdue ? t("doc.attention", { n: n(f.overdue) }) : t("doc.allGood")}
              </Chip>
              <View style={styles.row}>
                <Button mode="contained" icon="login" onPress={() => open(f.id)} testID={`doctor-open-${f.name}`}>
                  {t("doc.open")}
                </Button>
                <Button mode="text" textColor={theme.colors.error} onPress={() => setLeaving({ id: f.id, name: f.name })} testID={`doctor-leave-${f.name}`}>
                  {t("team.leave")}
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Card mode="outlined" style={styles.card}>
          <Card.Title title={t("doc.detailsTitle")} titleVariant="titleMedium" />
          <Card.Content style={{ gap: 10 }}>
            <TextInput mode="outlined" label={t("doc.regNo")} value={reg} onChangeText={setRegNo} maxLength={60} testID="doctor-reg" />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("doc.regHint")}
            </Text>
            <Label>{t("doc.specialty")}</Label>
            <ChoiceChips
              options={optionsOf(options ?? null, "doctor_specialty").map((o) => ({ value: o.value, label: optionLabel(options ?? null, "doctor_specialty", o.value, locale) }))}
              value={spec}
              onChange={(v) => setSpecialty(v === spec ? "" : v)}
              testID="doctor-specialty"
            />
            <Button mode="contained-tonal" onPress={saveDetails} loading={saving} disabled={saving} testID="doctor-save">
              {t("rec.save")}
            </Button>
          </Card.Content>
        </Card>

        {standalone && (
          <Button mode="outlined" icon="logout" onPress={s.signOut} testID="doctor-logout">
            {t("more.logout")}
          </Button>
        )}
      </View>
      <Portal>
        <Dialog visible={leaving !== null} onDismiss={() => setLeaving(null)}>
          <Dialog.Title>{t("team.leave")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("team.leaveBody", { farm: leaving?.name ?? "" })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLeaving(null)}>{t("common.cancel")}</Button>
            <Button textColor={theme.colors.error} onPress={leave} testID="doctor-leave-confirm">
              {t("team.leave")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  head: { flexDirection: "row", gap: 12, alignItems: "center" },
  badge: { alignSelf: "flex-start", marginTop: 4 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderRadius: 16 },
  card: { borderRadius: 20 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
