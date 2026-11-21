import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddSheet } from "@/components/AddSheet";
import { Icon } from "@/components/icons";
import { T } from "@/components/ui";
import { C } from "@/lib/theme";

const TABS = [
  { name: "index", label: "Home", icon: Icon.home },
  { name: "feed", label: "Feed", icon: Icon.feed },
  { name: "plan", label: "Plan", icon: Icon.plan },
  { name: "you", label: "You", icon: Icon.you },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}
        tabBar={({ state, navigateToTab }) => (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Math.max(insets.bottom, 10), paddingTop: 8 }}>
            {[TABS[0], TABS[1], null, TABS[2], TABS[3]].map((tab) => {
              if (!tab)
                return (
                  <View key="add" style={{ flex: 1, alignItems: "center" }}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={() => setAdding(true)} style={{ width: 54, height: 40, borderRadius: 20, backgroundColor: C.coral, alignItems: "center", justifyContent: "center" }}>
                      <Icon.plus size={24} />
                    </Pressable>
                  </View>
                );
              const index = state.routes.findIndex((r) => r.name === tab.name);
              const focused = state.index === index;
              const color = focused ? C.ink : C.off;
              const Glyph = tab.icon;
              return (
                <Pressable
                  key={tab.name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={tab.label}
                  onPress={() => (focused || index < 0 ? null : navigateToTab(state.routes[index].key))}
                  style={{ flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 }}
                >
                  <Glyph color={color} width={focused ? 2.2 : 1.9} />
                  <T w={focused ? "bold" : "semibold"} s={11} color={color}>
                    {tab.label}
                  </T>
                </Pressable>
              );
            })}
          </View>
        )}
      >
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} />
        ))}
      </Tabs>
      <AddSheet open={adding} onClose={() => setAdding(false)} onPickRecipe={(id) => router.push(`/recipe/${id}`)} />
    </>
  );
}
