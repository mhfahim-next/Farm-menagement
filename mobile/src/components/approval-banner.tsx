import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Card, Icon, Text, useTheme } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { isManager } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useApprovals } from "@/lib/site-api";

/** On Home for owners and managers: doctors' entries waiting for a decision. */
export function ApprovalBanner() {
  const { t, locale } = usePrefs();
  const theme = useTheme();
  const { current } = useSession();
  const { data, reload } = useApprovals(isManager(current?.role) ? current?.farm.id : undefined, locale);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const n = data?.waiting.length ?? 0;
  if (!n) return null;
  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.tertiaryContainer }]} onPress={() => router.push("/approvals")} testID="approval-banner">
      <Card.Content>
        <View style={styles.row}>
          <Icon source="clipboard-check-outline" size={24} color={theme.colors.onTertiaryContainer} />
          <Text variant="titleSmall" style={[styles.flex, { color: theme.colors.onTertiaryContainer }]}>
            {t("appr.waitingN", { n })}
          </Text>
          <Icon source="chevron-right" size={22} color={theme.colors.onTertiaryContainer} />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
});
