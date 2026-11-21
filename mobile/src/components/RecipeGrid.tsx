import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import type { MealSummary } from "@/lib/api";
import { Dish, Meta, T } from "./ui";

export function RecipeGrid({ meals, showAuthor }: { meals: MealSummary[]; showAuthor?: boolean }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 }}>
      {meals.map((m) => (
        <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/recipe/${m.id}`)} style={{ width: "47.5%", gap: 6 }}>
          <Dish meal={m} style={{ height: 130 }} radius={18} />
          <View>
            <T w="bold" s={15} numberOfLines={2}>
              {m.name}
            </T>
            <Meta>{[showAuthor && (m.mine ? "You" : m.author), m.minutes && `${m.minutes} min`, m.score != null && `Otao ${m.score}`].filter(Boolean).join(" · ")}</Meta>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
