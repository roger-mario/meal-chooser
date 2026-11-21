import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Share, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { SaveSheet } from "@/components/SaveSheet";
import { Avatar, Button, Dish, Loading, T } from "@/components/ui";
import { API_URL, type MealSummary } from "@/lib/api";
import { useData } from "@/lib/data";
import { useNavSpace } from "@/lib/navbar";
import { C, chf, tileFor } from "@/lib/theme";

/** Reel-style feed: one recipe per screen, swipe up for the next. */
export default function Feed() {
  const { library, isLiked, toggleLike, inAnyCollection } = useData();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"all" | "friends">("all");
  const [saving, setSaving] = useState<number | null>(null);
  const navSpace = useNavSpace();
  const pageH = height;

  const items = useMemo(() => {
    const all = (library?.meals ?? []).filter((m) => (mode === "friends" ? !m.mine : true));
    // Best-scoring first, with a little shuffle so it doesn't always look the same.
    return [...all].sort((a, b) => (b.score ?? 0) + ((b.id * 7) % 13) - ((a.score ?? 0) + ((a.id * 7) % 13)));
  }, [library, mode]);

  if (!library) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={items}
        keyExtractor={(m) => String(m.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={pageH}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: pageH, offset: pageH * i, index: i })}
        renderItem={({ item }) => (
          <Reel meal={item} height={pageH} topInset={insets.top} bottomInset={navSpace - 12} liked={isLiked(item.id)} saved={inAnyCollection(item.id)} onLike={() => toggleLike(item.id)} onSave={() => setSaving(item.id)} />
        )}
        ListEmptyComponent={
          <View style={{ height: pageH, padding: 24, justifyContent: "center" }}>
            <T w="bold" s={17}>
              No recipes yet
            </T>
            <T color={C.muted}>Recipes from your household and friends show up here.</T>
          </View>
        }
      />
      <View style={{ position: "absolute", top: insets.top + 10, alignSelf: "center", flexDirection: "row", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 22, padding: 4 }}>
        {(["friends", "all"] as const).map((m) => (
          <Pressable key={m} accessibilityRole="tab" accessibilityState={{ selected: mode === m }} onPress={() => setMode(m)} style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: "center", backgroundColor: mode === m ? C.ink : "transparent" }}>
            <T w="bold" s={14} color={mode === m ? "#FFFFFF" : C.ink}>
              {m === "friends" ? "From others" : "For you"}
            </T>
          </Pressable>
        ))}
      </View>
      <SaveSheet mealId={saving} onClose={() => setSaving(null)} />
    </View>
  );
}

function Reel({ meal, height, topInset, bottomInset, liked, saved, onLike, onSave }: { meal: MealSummary; height: number; topInset: number; bottomInset: number; liked: boolean; saved: boolean; onLike: () => void; onSave: () => void }) {
  const router = useRouter();
  const author = meal.author ?? "Otao";
  return (
    <View style={{ height, backgroundColor: tileFor(meal.id) }}>
      {meal.imageUrl ? (
        <Dish meal={meal} style={{ position: "absolute", left: 0, right: 0, top: 0, height: height - 150 - bottomInset }} radius={0} />
      ) : (
        <Dish meal={meal} fit="contain" style={{ position: "absolute", left: 0, right: 0, top: topInset + 40, height: height - 330 - topInset - bottomInset, backgroundColor: "transparent" }} radius={0} />
      )}
      <View style={{ position: "absolute", right: 12, bottom: 290 + bottomInset, alignItems: "center", gap: 12 }}>
        <RoundButton label={liked ? "Unlike" : "Like"} onPress={onLike}>
          <Icon.heart fill={liked ? C.like : "none"} color={liked ? C.like : C.ink} />
        </RoundButton>
        <RoundButton label={saved ? "Saved" : "Save"} onPress={onSave}>
          <Icon.bookmark fill={saved ? C.ink : "none"} />
        </RoundButton>
        <RoundButton label="Share" onPress={() => Share.share({ message: `${meal.name} on Otao`, url: `${API_URL}/meals/${meal.id}` })}>
          <Icon.share />
        </RoundButton>
      </View>
      <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 + bottomInset, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, gap: 10, shadowColor: "#2A2622", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Avatar name={author} id={author.length} size={30} />
          <T w="semibold" s={14}>
            {meal.mine ? "You" : author}
          </T>
        </View>
        <T w="extrabold" s={24} style={{ letterSpacing: -0.4, lineHeight: 28 }} numberOfLines={2}>
          {meal.name}
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {meal.score != null && <Pill text={`Otao ${meal.score}`} tone="mint" />}
          {meal.minutes != null && <Pill text={`${meal.minutes} min`} />}
          {meal.kcal != null && <Pill text={`${meal.kcal} kcal`} />}
          {meal.costPerServing != null && <Pill text={chf(meal.costPerServing)!} />}
          <Pill text={`${meal.servings} ${meal.servings === 1 ? "portion" : "portions"}`} />
        </View>
        <Button label="See recipe" size="lg" onPress={() => router.push(`/recipe/${meal.id}`)} />
      </View>
    </View>
  );
}

function RoundButton({ children, label, onPress }: { children: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#2A2622", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      {children}
    </Pressable>
  );
}

function Pill({ text, tone }: { text: string; tone?: "mint" }) {
  return (
    <View style={{ height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: tone === "mint" ? C.mint : C.sand, justifyContent: "center" }}>
      <T w="bold" s={13} color={tone === "mint" ? C.mintInk : C.ink}>
        {text}
      </T>
    </View>
  );
}
