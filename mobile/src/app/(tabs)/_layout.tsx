import { Tabs } from "expo-router";
import { BottomNavigation, Icon } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";

const ICONS: Record<string, [string, string]> = {
  home: ["home", "home-outline"],
  more: ["dots-horizontal-circle", "dots-horizontal-circle-outline"],
};

/** Material 3 bottom navigation. More tabs (animals, entries, money) come in the next steps. */
export default function TabsLayout() {
  const { t } = usePrefs();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigateToTab, insets }) => (
        <BottomNavigation.Bar
          navigationState={{ index: state.index, routes: state.routes.map((r) => ({ key: r.key, name: r.name })) }}
          safeAreaInsets={insets}
          onTabPress={({ route }) => navigateToTab(route.key)}
          renderIcon={({ route, focused, color }) => {
            const name = (route as { name: string }).name;
            return <Icon source={(ICONS[name] ?? ["circle", "circle-outline"])[focused ? 0 : 1]} size={24} color={color} />;
          }}
          getLabelText={({ route }) => {
            const d = descriptors[route.key];
            return (d?.options.title as string | undefined) ?? (route as { name: string }).name;
          }}
          getTestID={({ route }) => `tab-${(route as { name: string }).name}`}
        />
      )}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
