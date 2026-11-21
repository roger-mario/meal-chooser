import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddSheet } from "@/components/AddSheet";
import { PlanStrip, WaveBanner } from "@/components/HomeParts";
import { Icon } from "@/components/icons";
import { RecipeGrid } from "@/components/RecipeGrid";
import { NewCollectionSheet } from "@/components/SaveSheet";
import { Button, Chip, Dish, Empty, H, Loading, T } from "@/components/ui";
import { useData } from "@/lib/data";
import { useNavScroll, useNavSpace } from "@/lib/navbar";
import { addDays, isoDay } from "@/lib/dates";
import { addToPlan, usePlan } from "@/lib/plan";
import { pantryMatch, usePrefs } from "@/lib/prefs";
import { suggestFor } from "@/lib/taste";
import { C } from "@/lib/theme";

type Lib = "mine" | "liked" | "colls";

export default function Home() {
  const router = useRouter();
  const { library, refresh, refreshing, error } = useData();
  const { prefs, update } = usePrefs();
  const today = isoDay();
  const { plan, reload } = usePlan(today, addDays(today, 6));
  const [lib, setLib] = useState<Lib>("mine");
  const [filling, setFilling] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const onScroll = useNavScroll();
  const bottom = useNavSpace();

  const meals = useMemo(() => library?.meals ?? [], [library]);
  const picks = useMemo(() => suggestFor(meals, prefs.likes, prefs.avoid, library?.likedIds ?? []), [meals, prefs.likes, prefs.avoid, library?.likedIds]);

  if (!library) return error ? <ErrorState text={error} onRetry={refresh} /> : <Loading />;

  const firstName = library.me.name.split(" ")[0];
  const libMeals = lib === "liked" ? meals.filter((m) => library.likedIds.includes(m.id)) : meals.filter((m) => m.mine);
  const likes = prefs.likes.slice(0, 2).map((l) => l.toLowerCase());
  const suggestText = likes.length ? `Picked for you, because you like ${likes.join(" and ")}.` : "Healthy picks to get you started. They get better as Otao learns what you like.";

  async function fill(day: string) {
    const planned = new Set((plan?.entries ?? []).map((e) => e.mealId));
    const ranked = meals.filter((m) => m.ingredients.length).sort((a, b) => {
      const pa = pantryMatch(a, prefs.pantry), pb = pantryMatch(b, prefs.pantry);
      return pb.have / pb.total - pa.have / pa.total;
    });
    const best = [...picks, ...ranked].find((m) => !planned.has(m.id));
    if (!best) return;
    setFilling(day);
    try {
      await addToPlan(day, "dinner", best.id);
      await reload();
    } finally {
      setFilling(null);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ paddingTop: 14, gap: 20, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void Promise.all([refresh(), reload()])} tintColor={C.coral} />}>
        <View style={{ paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <T w="extrabold" s={22} numberOfLines={1} style={{ flex: 1, letterSpacing: -0.4, lineHeight: 28 }}>
            What’s cooking, {firstName}?
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={() => setAdding(true)} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: C.coral, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.85 : 1 })}>
            <Icon.plus size={22} />
          </Pressable>
        </View>

        <>
            {!prefs.bannerHidden && prefs.likes.length === 0 && (
              <View style={{ marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.butter, borderRadius: 18, paddingVertical: 12, paddingLeft: 14, paddingRight: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                  <Icon.sun />
                </View>
                <Pressable accessibilityRole="button" style={{ flex: 1 }} onPress={() => router.push("/onboarding?step=2")}>
                  <T s={14} color="#4A3A00">
                    <T w="bold" s={14} color="#4A3A00">
                      Tell Otao what you like
                    </T>{" "}
                    and ideas will fit you better.
                  </T>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={() => update({ bannerHidden: true })} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                  <Icon.close color={C.butterInk} />
                </Pressable>
              </View>
            )}

            {prefs.usage === "plan" && <PlanStrip today={today} entries={plan?.entries ?? []} meal={(id) => (id == null ? undefined : meals.find((m) => m.id === id))} onFill={fill} filling={filling} />}

            <View style={{ flexGrow: 1 }}>
              <WaveBanner pill="FOR YOU" title="Otao suggests" text={suggestText} action={{ label: prefs.pantry.length ? "Cook with what’s at home" : "Add what’s at home", onPress: () => router.push("/pantry") }} meals={picks} onPress={() => router.navigate("/feed")}>
                <View style={{ gap: 12, paddingBottom: bottom }}>
                  <H style={{ marginHorizontal: 16 }}>Your recipes</H>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                    <Chip label="Mine" tone="dark" on={lib === "mine"} onPress={() => setLib("mine")} />
                    <Chip label="Liked" tone="dark" on={lib === "liked"} onPress={() => setLib("liked")} />
                    <Chip label="Collections" tone="dark" on={lib === "colls"} onPress={() => setLib("colls")} />
                  </ScrollView>
                  {lib === "colls" ? (
                    <Collections />
                  ) : libMeals.length ? (
                    <RecipeGrid meals={libMeals} />
                  ) : (
                    <View style={{ paddingHorizontal: 16 }}>
                      <Empty
                        title={lib === "liked" ? "Nothing liked yet" : "No recipes of your own yet"}
                        text={lib === "liked" ? "Tap the heart on any recipe in the feed and it shows up here." : "Add your first recipe with the + button."}
                      />
                    </View>
                  )}
                </View>
              </WaveBanner>
            </View>
        </>
      </ScrollView>
      <AddSheet open={adding} onClose={() => setAdding(false)} />
    </SafeAreaView>
  );
}

function Collections() {
  const router = useRouter();
  const { library, meal, createCollection } = useData();
  const [naming, setNaming] = useState(false);
  if (!library) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 }}>
      {library.collections.map((c) => {
        const first = meal(c.mealIds[0]);
        return (
          <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push(`/collection/${c.id}`)} style={{ width: "48.5%", height: 120, borderRadius: 18, overflow: "hidden", backgroundColor: C.sand }}>
            {first && <Dish meal={first} style={{ position: "absolute", inset: 0 }} radius={0} />}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, paddingTop: 18, backgroundColor: "rgba(255,255,255,0.92)" }}>
              <T w="extrabold" s={15} numberOfLines={1}>
                {c.name}
              </T>
              <T s={13} color={C.ink2}>
                {c.mealIds.length} {c.mealIds.length === 1 ? "recipe" : "recipes"}
              </T>
            </View>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        onPress={() => setNaming(true)}
        style={{ width: "48.5%", height: 120, borderRadius: 18, borderWidth: 2, borderStyle: "dashed", borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" }}
      >
        <T w="bold" s={14} color={C.muted}>
          + New collection
        </T>
      </Pressable>
      <NewCollectionSheet open={naming} onClose={() => setNaming(false)} onCreate={(name) => createCollection(name)} />
    </View>
  );
}


function ErrorState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: 16, justifyContent: "center" }}>
      <Empty title="Couldn't load your recipes" text={text} action={<Button label="Try again" kind="secondary" size="sm" onPress={onRetry} style={{ marginTop: 6 }} />} />
    </SafeAreaView>
  );
}
