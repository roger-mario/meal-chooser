import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { Card, Dish, Empty, Meta, T } from "@/components/ui";
import { useData } from "@/lib/data";
import { C } from "@/lib/theme";

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { library, meal, deleteCollection } = useData();
  const c = library?.collections.find((x) => x.id === Number(id));
  if (!c) return null;
  const items = c.mealIds.map((m) => meal(m)).filter((m) => m != null);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingTop: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Icon.back />
        </Pressable>
        <T w="extrabold" s={24} style={{ flex: 1, letterSpacing: -0.4 }} numberOfLines={1}>
          {c.name}
        </T>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(`Delete "${c.name}"?`, "The recipes stay, only the collection goes.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteCollection(c.id).then(() => router.back()) },
            ])
          }
          style={{ paddingHorizontal: 12, height: 44, justifyContent: "center" }}
        >
          <T w="bold" s={14} color={C.muted}>
            Delete
          </T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {items.length === 0 ? (
          <Empty title="Empty for now" text="Save recipes here with the bookmark button in the feed or on a recipe." />
        ) : (
          items.map((m) => (
            <Card key={m.id} onPress={() => router.push(`/recipe/${m.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8 }}>
              <Dish meal={m} style={{ width: 64, height: 64 }} />
              <View style={{ flex: 1 }}>
                <T w="bold" s={16} numberOfLines={1}>
                  {m.name}
                </T>
                <Meta>{[m.minutes && `${m.minutes} min`, m.score != null && `Otao ${m.score}`].filter(Boolean).join(" · ")}</Meta>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
