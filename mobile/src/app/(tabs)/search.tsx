import { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { RecipeGrid } from "@/components/RecipeGrid";
import { Chip, H, Loading, T } from "@/components/ui";
import { useData } from "@/lib/data";
import { useNavScroll, useNavSpace } from "@/lib/navbar";
import { usePrefs } from "@/lib/prefs";
import { suggestFor } from "@/lib/taste";
import { C, F } from "@/lib/theme";

const IDEAS = ["Chicken", "Salmon", "Pasta", "Bowl", "Soup", "Vegetarian", "Quick"];

/** Find recipes from everyone you cook with, by dish, ingredient or who added it. */
export default function Search() {
  const { library } = useData();
  const { prefs } = usePrefs();
  const [query, setQuery] = useState("");
  const onScroll = useNavScroll();
  const bottom = useNavSpace();
  const meals = useMemo(() => library?.meals ?? [], [library]);
  const popular = useMemo(() => suggestFor(meals, prefs.likes, prefs.avoid, library?.likedIds ?? []), [meals, prefs.likes, prefs.avoid, library?.likedIds]);
  if (!library) return <Loading />;

  const q = query.trim().toLowerCase();
  const found = q
    ? meals
        .filter((m) => (q === "quick" ? (m.minutes ?? 99) <= 25 : [m.name, m.author ?? "", m.diet ?? "", ...m.ingredients, ...m.categories].some((t) => t.toLowerCase().includes(q))))
        .sort((a, b) => Number(a.mine) - Number(b.mine) || (b.score ?? 0) - (a.score ?? 0))
    : [];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 12 }}>
        <T w="extrabold" s={22} style={{ letterSpacing: -0.4, lineHeight: 28 }}>
          Search
        </T>
        <View style={{ justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 16, zIndex: 1 }} pointerEvents="none">
            <Icon.search />
          </View>
          <TextInput value={query} onChangeText={setQuery} placeholder="Dishes, ingredients or friends" placeholderTextColor={C.off} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" accessibilityLabel="Search recipes" style={{ height: 48, borderRadius: 24, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.card, paddingLeft: 44, paddingRight: 16, fontSize: 16, fontFamily: F.regular, color: C.ink }} />
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ gap: 14, paddingTop: 6, paddingBottom: bottom }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {IDEAS.map((i) => (
            <Chip key={i} label={i} on={q === i.toLowerCase()} onPress={() => setQuery(q === i.toLowerCase() ? "" : i)} />
          ))}
        </ScrollView>
        <H style={{ marginHorizontal: 16 }}>{q ? (found.length ? `${found.length} ${found.length === 1 ? "recipe" : "recipes"}` : "No recipes found") : "Popular with your people"}</H>
        {q && !found.length ? (
          <T s={14} color={C.muted} style={{ marginHorizontal: 16 }}>
            Try a dish, an ingredient or a friend’s name.
          </T>
        ) : (
          <RecipeGrid meals={q ? found : popular} showAuthor />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
