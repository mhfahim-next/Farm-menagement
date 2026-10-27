import { router } from "expo-router";
import { View } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import { DoctorConsole } from "@/components/doctor-console";
import { usePrefs } from "@/lib/prefs";

/** The doctor console for a doctor already working on farms (from More). */
export default function DoctorScreen() {
  const { t } = usePrefs();
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("doc.title")} />
      </Appbar.Header>
      <DoctorConsole />
    </View>
  );
}
