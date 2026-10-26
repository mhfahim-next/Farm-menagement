import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Dialog, Divider, List, Portal, RadioButton, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LanguageToggle } from "@/components/language-toggle";
import { siteLink } from "@/lib/env";
import { usePrefs, type ThemeMode } from "@/lib/prefs";
import { useSession } from "@/lib/session";

/** Account, farm switcher, language, theme, links and sign out. */
export default function More() {
  const { t, themeMode, setThemeMode } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const s = useSession();
  const [confirm, setConfirm] = useState(false);
  const email = s.session?.user.email ?? "";
  const name = s.profile?.full_name || email;
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const open = (path: string) => WebBrowser.openBrowserAsync(siteLink(path));

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} testID="more">
      <View style={styles.inner}>
        <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>
          {t("more.title")}
        </Text>

        <View style={[styles.account, { backgroundColor: theme.colors.elevation.level2 }]}>
          <Avatar.Text size={48} label={initials || "?"} />
          <View style={styles.flex}>
            <Text variant="titleMedium" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        {s.memberships.length > 1 && (
          <List.Section>
            <List.Subheader>{t("more.switchFarm")}</List.Subheader>
            <RadioButton.Group value={s.current?.farm.id ?? ""} onValueChange={s.setCurrentFarm}>
              {s.memberships.map((m) => (
                <RadioButton.Item key={m.farm.id} value={m.farm.id} label={`${m.farm.name} · ${t(`role.${m.role}`)}`} position="leading" labelStyle={styles.left} />
              ))}
            </RadioButton.Group>
          </List.Section>
        )}

        <List.Section>
          <List.Subheader>{t("more.language")}</List.Subheader>
          <View style={styles.pad}>
            <LanguageToggle />
          </View>
          <List.Subheader>{t("more.theme")}</List.Subheader>
          <View style={styles.pad}>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(v) => setThemeMode(v as ThemeMode)}
              buttons={[
                { value: "system", label: t("more.theme.system"), icon: "theme-light-dark" },
                { value: "light", label: t("more.theme.light"), icon: "white-balance-sunny" },
                { value: "dark", label: t("more.theme.dark"), icon: "weather-night" },
              ]}
            />
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader>{t("more.website")}</List.Subheader>
          <List.Item title={t("more.openWeb")} left={(p) => <List.Icon {...p} icon="web" />} right={(p) => <List.Icon {...p} icon="open-in-new" />} onPress={() => open("/dashboard")} />
          <List.Item title={t("more.help")} left={(p) => <List.Icon {...p} icon="lifebuoy" />} onPress={() => open("/contact")} />
          <List.Item title={t("more.privacy")} left={(p) => <List.Icon {...p} icon="shield-lock-outline" />} onPress={() => open("/privacy")} />
          <List.Item title={t("more.terms")} left={(p) => <List.Icon {...p} icon="file-document-outline" />} onPress={() => open("/terms")} />
        </List.Section>
        <Divider />
        <Button mode="outlined" icon="logout" textColor={theme.colors.error} style={styles.logout} onPress={() => setConfirm(true)} testID="logout">
          {t("more.logout")}
        </Button>
        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          FarmFlows · {t("more.version", { v: Constants.expoConfig?.version ?? "1.0.0" })}
        </Text>
      </View>

      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
          <Dialog.Title>{t("more.logout")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("more.logoutConfirm")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)}>{t("common.cancel")}</Button>
            <Button
              onPress={() => {
                setConfirm(false);
                s.signOut();
              }}
              testID="logout-confirm"
            >
              {t("more.logout")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center" },
  title: { paddingHorizontal: 4, marginBottom: 12 },
  account: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20 },
  flex: { flex: 1 },
  left: { textAlign: "left" },
  pad: { paddingHorizontal: 16, paddingBottom: 8 },
  logout: { marginTop: 20, borderRadius: 24 },
  version: { textAlign: "center", marginTop: 16 },
});
