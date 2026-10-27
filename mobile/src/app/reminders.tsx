import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Icon, Text, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { OfflineNote } from "@/components/offline-note";
import { ReminderItem } from "@/components/reminder-item";
import { writeCache } from "@/lib/cache";
import { usePrefs } from "@/lib/prefs";
import { markDone, useReminders } from "@/lib/reminders";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";

/** Everything that needs doing, most urgent first; tick one off when it's done. */
export default function Reminders() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const { current, session } = useSession();
  const farm = current?.farm;
  const { data, offline, error, reload } = useReminders(farm?.id, locale);
  const toast = useToast();
  const [hidden, setHidden] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const open = (data?.open ?? []).filter((r) => !hidden.includes(r.key));
  const done = async (key: string) => {
    if (!farm || !session) return;
    setHidden((h) => [...h, key]);
    try {
      await markDone(session.user.id, farm.id, key);
      if (data) writeCache(`reminders.${farm.id}.${locale}`, { ...data, open: data.open.filter((r) => r.key !== key), done: data.done + 1 });
      toast(t("rem.doneOk"));
    } catch {
      setHidden((h) => h.filter((k) => k !== key));
      toast(t("common.network"));
    }
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="reminders">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={back} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("rem.title")} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.inner}>
          {offline && <OfflineNote />}
          {error && !data && <FormError message={t("common.error")} detail={error} />}
          {data && open.length === 0 ? (
            <View style={styles.empty}>
              <Icon source="check-decagram-outline" size={48} color={theme.colors.primary} />
              <Text variant="titleMedium">{t("rem.allClear")}</Text>
            </View>
          ) : (
            open.map((r) => <ReminderItem key={r.key} r={r} onDone={() => done(r.key)} />)
          )}
          {data && data.done > 0 && (
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
              {t("rem.doneCount", { n: data.done })}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center" },
  empty: { alignItems: "center", gap: 12, marginTop: 48 },
});
