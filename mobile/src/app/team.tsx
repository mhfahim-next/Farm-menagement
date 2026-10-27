import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Dialog, List, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { ChoiceChips } from "@/components/fields";
import { FormError } from "@/components/form-error";
import { RecordMenu } from "@/components/record-menu";
import { useCached } from "@/lib/cache";
import { fetchTeam, inviteError, isManager } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Who works on the farm: invite people by email, remove them, or leave the farm. */
export default function Team() {
  const { t } = usePrefs();
  const theme = useTheme();
  const s = useSession();
  const farm = s.current?.farm;
  const role = s.current?.role;
  const me = s.session?.user.id;
  const manager = isManager(role);
  const { data, reload } = useCached(farm ? `team.${farm.id}` : null, () => fetchTeam(farm!.id, manager));
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("worker");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const roles = (role === "owner" ? ["manager", "worker", "vet"] : ["worker", "vet"]) as ("manager" | "worker" | "vet")[];
  const back = () => (router.canGoBack() ? router.back() : router.replace("/more"));

  const invite = async () => {
    if (!farm) return;
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address)) return setError(t("team.err.email"));
    setError(null);
    setBusy(true);
    const { error: e } = await supabase.from("farm_invites").insert({ farm_id: farm.id, email: address, role: inviteRole });
    setBusy(false);
    if (e) {
      const key = inviteError(e.message);
      const limit = /PLAN_LIMIT:\w+:(\d+)/.exec(e.message);
      if (key) return setError(t(key));
      if (limit) return setError(t("plan.err.limit", { n: Number(limit[1]) }));
      return setError(e.code === "23505" ? t("team.err.duplicate") : `${t("common.error")} ${e.message}`);
    }
    setEmail("");
    toast(t("team.invited", { email: address }));
    reload();
  };

  const leave = async () => {
    if (!farm) return;
    const { error: e } = await supabase.rpc("leave_farm", { p_farm: farm.id });
    setLeaving(false);
    if (e) return toast(t("team.err.ownerLeave"));
    toast(t("team.left"));
    await s.reload();
    router.replace("/");
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="team">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("team.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Card mode="outlined" style={styles.card}>
            <Card.Title title={t("team.members")} titleVariant="titleMedium" />
            {(data?.members ?? []).map((m) => (
              <List.Item
                key={m.user_id}
                title={`${m.name || t("team.noName")}${m.user_id === me ? ` (${t("team.you")})` : ""}`}
                description={t(`role.${m.role}` as "role.worker")}
                left={(p) => <List.Icon {...p} icon={m.role === "owner" ? "crown-outline" : m.role === "vet" ? "stethoscope" : "account-outline"} />}
                right={() =>
                  role === "owner" && m.role !== "owner" ? (
                    <RecordMenu
                      testID={`member-menu-${m.name ?? m.user_id}`}
                      onDelete={async () => {
                        const { data: gone, error: e } = await supabase.from("farm_members").delete().eq("farm_id", farm!.id).eq("user_id", m.user_id).neq("role", "owner").select("user_id");
                        toast(e || !gone?.length ? t("team.err.forbidden") : t("team.removed"));
                        reload();
                      }}
                    />
                  ) : null
                }
                testID={`member-${m.name ?? m.user_id}`}
              />
            ))}
          </Card>

          {manager && (
            <Card mode="outlined" style={styles.card}>
              <Card.Title title={t("team.invite")} titleVariant="titleMedium" />
              <Card.Content style={{ gap: 10 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t("team.inviteHint")}
                </Text>
                <TextInput mode="outlined" label={t("team.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="invite-email" />
                <ChoiceChips options={roles.map((r) => ({ value: r, label: t(`role.${r}`) }))} value={inviteRole} onChange={setInviteRole} testID="invite-role" />
                <FormError message={error} />
                <Button mode="contained" icon="email-fast-outline" onPress={invite} loading={busy} disabled={busy} testID="invite-send">
                  {t("team.send")}
                </Button>
              </Card.Content>
              {(data?.invites ?? []).length > 0 && (
                <>
                  <List.Subheader>{t("team.pending")}</List.Subheader>
                  {(data?.invites ?? []).map((i) => (
                    <View key={i.id} style={styles.invite}>
                      <View style={styles.flex}>
                        <Text variant="bodyLarge">{i.email}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {t(`role.${i.role}` as "role.worker")}
                        </Text>
                      </View>
                      <Button
                        compact
                        onPress={async () => {
                          const { error: e } = await supabase.rpc("revoke_farm_invite", { p_id: i.id });
                          toast(e ? t("team.err.forbidden") : t("team.revoked"));
                          reload();
                        }}
                        testID={`revoke-${i.email}`}
                      >
                        {t("team.revoke")}
                      </Button>
                    </View>
                  ))}
                </>
              )}
            </Card>
          )}

          {role !== "owner" && (
            <Button mode="outlined" icon="exit-run" textColor={theme.colors.error} onPress={() => setLeaving(true)} testID="leave-farm">
              {t("team.leave")}
            </Button>
          )}
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={leaving} onDismiss={() => setLeaving(false)}>
          <Dialog.Title>{t("team.leave")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("team.leaveBody", { farm: farm?.name ?? "" })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLeaving(false)}>{t("common.cancel")}</Button>
            <Button textColor={theme.colors.error} onPress={leave} testID="leave-confirm">
              {t("team.leave")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20 },
  invite: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
});
