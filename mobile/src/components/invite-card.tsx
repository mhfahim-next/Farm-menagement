import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { useCached } from "@/lib/cache";
import { fetchMyInvites, inviteError } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

/** Invitations to join someone's farm, with accept / decline. Shows nothing when there are none. */
export function InviteCards() {
  const { t } = usePrefs();
  const theme = useTheme();
  const s = useSession();
  const uid = s.session?.user.id;
  const { data, reload } = useCached(uid ? `invites.${uid}` : null, fetchMyInvites);
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const respond = async (id: string, farmId: string, accept: boolean) => {
    setBusy(id);
    const { error } = await supabase.rpc("respond_farm_invite", { p_id: id, p_accept: accept });
    setBusy(null);
    if (error) {
      const key = inviteError(error.message);
      toast(key ? t(key) : `${t("common.error")} ${error.message}`);
      return reload();
    }
    toast(accept ? t("team.joined") : t("team.declined"));
    reload();
    if (accept) {
      await s.reload();
      s.setCurrentFarm(farmId);
    }
  };

  if (!data?.length) return null;
  return (
    <>
      {data.map((i) => (
        <Card key={i.id} mode="contained" style={[styles.card, { backgroundColor: theme.colors.tertiaryContainer }]} testID="invite-card">
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onTertiaryContainer }}>
              {t("team.invitedTo", { farm: i.farm_name, role: t(`role.${i.role}` as "role.worker") })}
            </Text>
            {i.invited_by_name ? <Text variant="bodyMedium">{t("team.invitedBy", { name: i.invited_by_name })}</Text> : null}
            <View style={styles.row}>
              <Button mode="contained" onPress={() => respond(i.id, i.farm_id, true)} loading={busy === i.id} disabled={busy !== null} testID="invite-accept">
                {t("team.accept")}
              </Button>
              <Button mode="text" onPress={() => respond(i.id, i.farm_id, false)} disabled={busy !== null} testID="invite-decline">
                {t("team.decline")}
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
