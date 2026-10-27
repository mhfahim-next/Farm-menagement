import { Tabs } from "expo-router";
import { BottomNavigation, Icon } from "react-native-paper";
import { useAnimals, useFlocks, useOptions } from "@/lib/data";
import { useOutbox } from "@/lib/outbox";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";

const ICONS: Record<string, [string, string]> = {
  home: ["home", "home-outline"],
  animals: ["cow", "cow"],
  entry: ["clipboard-edit", "clipboard-edit-outline"],
  more: ["dots-horizontal-circle", "dots-horizontal-circle-outline"],
};

/** Material 3 bottom navigation; tabs the farm has no use for are left out. */
export default function TabsLayout() {
  const { t } = usePrefs();
  const { current } = useSession();
  const { waiting } = useOutbox();
  const farm = current?.farm;
  // Load the lists once at start, so entries work later even without internet.
  useOptions();
  useAnimals(farm?.has_dairy || farm?.has_fattening || farm?.has_goat ? farm.id : undefined);
  useFlocks(farm?.has_layer || farm?.has_broiler ? farm.id : undefined);
  const hidden = new Set<string>();
  if (!farm?.has_dairy && !farm?.has_fattening && !farm?.has_goat) hidden.add("animals");
  if (current?.role === "vet" || (!farm?.has_dairy && !farm?.has_layer && !farm?.has_broiler)) hidden.add("entry");
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigateToTab, insets }) => {
        const routes = state.routes.filter((r) => !hidden.has(r.name));
        const active = state.routes[state.index]?.key;
        return (
          <BottomNavigation.Bar
            navigationState={{
              index: Math.max(
                0,
                routes.findIndex((r) => r.key === active),
              ),
              routes: routes.map((r) => ({ key: r.key, name: r.name })),
            }}
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
            getBadge={({ route }) => ((route as { name: string }).name === "entry" && waiting > 0 ? waiting : false)}
            getTestID={({ route }) => `tab-${(route as { name: string }).name}`}
          />
        );
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="animals" options={{ title: t("tabs.animals") }} />
      <Tabs.Screen name="entry" options={{ title: t("tabs.entry") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
