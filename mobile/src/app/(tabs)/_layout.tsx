import { TopTabs } from "expo-router/js-top-tabs";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { NAV_HEIGHT, NavBarProvider, useNavBar } from "@/lib/navbar";
import { C } from "@/lib/theme";

const TABS = [
  { name: "index", label: "Home", icon: Icon.home },
  { name: "feed", label: "Feed", icon: Icon.feed },
  { name: "plan", label: "Plan", icon: Icon.plan },
  { name: "search", label: "Search", icon: Icon.search },
  { name: "you", label: "You", icon: Icon.you },
] as const;

type BarProps = { routes: { key: string; name: string }[]; index: number; go: (key: string) => void };

/** A floating, rounded tab bar that gets a touch smaller while you scroll down. Swiping the screens left and right also moves between tabs. */
function FloatingBar({ routes, index, go }: BarProps) {
  const insets = useSafeAreaInsets();
  const { compact } = useNavBar();
  const scale = compact.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  const lift = compact.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: Math.max(insets.bottom, 12), alignItems: "center" }}>
      <Animated.View
        style={{
          width: "92%",
          maxWidth: 420,
          height: NAV_HEIGHT,
          borderRadius: NAV_HEIGHT / 2,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderWidth: 1,
          borderColor: C.line,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          shadowColor: "#2A2622",
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          transform: [{ translateY: lift }, { scale }],
        }}
      >
        {TABS.map((tab) => {
          const i = routes.findIndex((r) => r.name === tab.name);
          const focused = index === i;
          const Glyph = tab.icon;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => (focused || i < 0 ? null : go(routes[i].key))}
              style={{ flex: 1, height: NAV_HEIGHT - 14, borderRadius: (NAV_HEIGHT - 14) / 2, alignItems: "center", justifyContent: "center", backgroundColor: focused ? C.peach : "transparent" }}
            >
              <Glyph color={focused ? C.coralInk : C.ink} width={focused ? 2.3 : 1.9} size={26} />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <NavBarProvider>
      {/* A pager underneath, so you can swipe left and right between the main tabs. */}
      <TopTabs tabBarPosition="bottom" screenOptions={{ sceneStyle: { backgroundColor: C.bg }, lazy: true }} tabBar={({ state, navigateToTab }) => <FloatingBar routes={state.routes} index={state.index} go={navigateToTab} />}>
        {TABS.map((t) => (
          <TopTabs.Screen key={t.name} name={t.name} />
        ))}
      </TopTabs>
    </NavBarProvider>
  );
}
