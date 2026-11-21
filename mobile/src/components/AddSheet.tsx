import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, View } from "react-native";
import { API_URL } from "@/lib/api";
import { C } from "@/lib/theme";
import { Icon } from "./icons";
import { Sheet, T } from "./ui";

export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void; onPickRecipe?: (id: number) => void }) {
  const router = useRouter();
  const options = [
    {
      title: "Add a recipe",
      sub: "Write one or import it from a link. Opens Otao on the web for now.",
      bg: C.peach,
      icon: <Icon.plus size={20} color={C.coralInk} />,
      go: () => WebBrowser.openBrowserAsync(`${API_URL}/meals/new`),
    },
    { title: "Cook with what's at home", sub: "Type what you have, see what you can make", bg: C.mint, icon: <Icon.fridge size={20} />, go: () => router.push("/pantry") },
    { title: "Plan a meal", sub: "Pick a day in the shared plan", bg: C.sky, icon: <Icon.plan size={20} color={C.skyInk} />, go: () => router.navigate("/plan") },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Add">
      {options.map((o) => (
        <Pressable
          key={o.title}
          accessibilityRole="button"
          onPress={() => {
            onClose();
            void o.go();
          }}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 12, opacity: pressed ? 0.9 : 1 })}
        >
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: o.bg, alignItems: "center", justifyContent: "center" }}>{o.icon}</View>
          <View style={{ flex: 1 }}>
            <T w="bold" s={16}>
              {o.title}
            </T>
            <T s={13} color={C.muted}>
              {o.sub}
            </T>
          </View>
        </Pressable>
      ))}
    </Sheet>
  );
}
