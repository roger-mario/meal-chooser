import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { RecipeGrid } from "@/components/RecipeGrid";
import { NewCollectionSheet } from "@/components/SaveSheet";
import { Avatar, Button, Card, Chip, Dish, Empty, H, Loading, Meta, ScoreChip, T } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { greeting, isoDay, longDate } from "@/lib/dates";
import { addToPlan, removeFromPlan, SLOT_LABEL, usePlan } from "@/lib/plan";
import { pantryMatch, usePrefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

type Lib = "mine" | "liked" | "colls";

export default function Home() {
  const router = useRouter();
  const { me } = useAuth();
  const { library, refresh, refreshing, error } = useData();
  const { prefs, update } = usePrefs();
  const today = isoDay();
  const { plan, reload } = usePlan(today, today);
  const [lib, setLib] = useState<Lib>("mine");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const meals = useMemo(() => library?.meals ?? [], [library]);
  const ideas = useMemo(() => {
    const scored = meals
      .filter((m) => m.ingredients.length > 0)
      .map((m) => ({ m, ...pantryMatch(m, prefs.pantry) }))
      .sort((a, b) => b.have / b.total - a.have / a.total || (b.m.score ?? 0) - (a.m.score ?? 0));
    return scored.slice(0, 3);
  }, [meals, prefs.pantry]);
  const tonight = useMemo(() => {
    const liked = new Set(library?.likedIds);
    return [...meals].sort((a, b) => Number(liked.has(b.id)) - Number(liked.has(a.id)) || (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
  }, [meals, library?.likedIds]);

  if (!library) return error ? <ErrorState text={error} onRetry={refresh} /> : <Loading />;

  const todays = (plan?.entries ?? []).filter((e) => e.day === today);
  const readyCount = ideas.filter((i) => i.have === i.total).length;
  const almost = meals.filter((m) => m.ingredients.length && pantryMatch(m, prefs.pantry).missing.length === 1).length;
  const libMeals = lib === "liked" ? meals.filter((m) => library.likedIds.includes(m.id)) : meals.filter((m) => m.mine);
  const cook = todays.find((e) => e.cook && e.cookId !== me?.id);

  async function fillToday() {
    const best = ideas[0]?.m ?? tonight[0];
    if (!best) return;
    setBusy(true);
    try {
      await addToPlan(today, "dinner", best.id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingBottom: 32, gap: 22 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void Promise.all([refresh(), reload()])} tintColor={C.coral} />}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 }}>
          <View style={{ flex: 1 }}>
            <T w="semibold" s={13} color={C.muted}>
              {longDate()}
            </T>
            <T w="extrabold" s={26} style={{ letterSpacing: -0.5, lineHeight: 31 }}>
              {greeting()}, {library.me.name}
            </T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="You" onPress={() => router.navigate("/you")}>
            <Avatar name={library.me.name} id={library.me.id} size={44} />
          </Pressable>
        </View>

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

        {prefs.usage === "plan" ? (
          todays.length > 0 ? (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <H style={{ flex: 1 }}>Today</H>
                <Pressable accessibilityRole="button" onPress={() => setEditing(!editing)} hitSlop={8}>
                  <T w="bold" s={14} color={C.coralInk}>
                    {editing ? "Done" : "Edit"}
                  </T>
                </Pressable>
              </View>
              {todays.map((e) => {
                const m = library.meals.find((x) => x.id === e.mealId);
                return (
                  <Card key={e.id} onPress={m && !editing ? () => router.push(`/recipe/${m.id}`) : undefined} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8 }}>
                    {m ? <Dish meal={m} style={{ width: 64, height: 64 }} /> : <View style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: C.sand }} />}
                    <View style={{ flex: 1 }}>
                      <T w="bold" s={12} color={C.muted} style={{ letterSpacing: 0.4 }}>
                        {SLOT_LABEL[e.slot].toUpperCase()}
                      </T>
                      <T w="bold" s={17} numberOfLines={1}>
                        {m?.name ?? e.label ?? "A recipe that was removed"}
                      </T>
                      {m && (
                        <Meta>
                          {m.minutes ? `${m.minutes} min` : ""}
                          {m.score != null ? ` · Otao ${m.score}` : ""}
                        </Meta>
                      )}
                    </View>
                    {editing && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${m?.name ?? e.label}`}
                        onPress={async () => {
                          await removeFromPlan(e.id);
                          await reload();
                        }}
                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.blush, alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon.close color={C.coralInk} />
                      </Pressable>
                    )}
                  </Card>
                );
              })}
              {cook && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Avatar name={cook.cook!} id={cook.cookId!} size={22} />
                  <T s={13} color={C.muted}>
                    {cook.cook} is cooking {SLOT_LABEL[cook.slot].toLowerCase()} today
                  </T>
                </View>
              )}
            </View>
          ) : (
            <Card style={{ marginHorizontal: 16, gap: 12 }}>
              <View style={{ gap: 2 }}>
                <T w="extrabold" s={19}>
                  Nothing planned today
                </T>
                <T s={14} color={C.muted}>
                  {prefs.pantry.length ? "Here are ideas that use what you have at home." : "Here are a few ideas. Add what's at home for better ones."}
                </T>
              </View>
              {ideas.map(({ m, have, total }) => (
                <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/recipe/${m.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Dish meal={m} style={{ width: 52, height: 52 }} radius={12} />
                  <View style={{ flex: 1 }}>
                    <T w="bold" s={15} numberOfLines={1}>
                      {m.name}
                    </T>
                    <T w="semibold" s={13} color={prefs.pantry.length ? C.mintInk : C.muted}>
                      {prefs.pantry.length ? `${have} of ${total} at home` : [m.minutes && `${m.minutes} min`, m.score != null && `Otao ${m.score}`].filter(Boolean).join(" · ")}
                    </T>
                  </View>
                  <Button
                    label="Today"
                    kind="secondary"
                    size="sm"
                    onPress={async () => {
                      await addToPlan(today, "dinner", m.id);
                      await reload();
                    }}
                  />
                </Pressable>
              ))}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button label="Fill for me" icon={<Icon.sparkle color={C.ink} />} busy={busy} onPress={fillToday} style={{ flex: 1 }} />
                <Button label="What's at home" kind="secondary" onPress={() => router.push("/pantry")} style={{ flex: 1 }} />
              </View>
            </Card>
          )
        ) : (
          <>
            <View style={{ gap: 10 }}>
              <H style={{ marginHorizontal: 16 }}>Ideas for tonight</H>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                {tonight.map((m) => (
                  <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/recipe/${m.id}`)} style={{ width: 220, backgroundColor: C.card, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: C.line }}>
                    <Dish meal={m} style={{ height: 150 }} radius={0} />
                    <ScoreChip score={m.score} style={{ position: "absolute", left: 10, top: 10 }} />
                    <View style={{ padding: 12, paddingTop: 10 }}>
                      <T w="bold" s={15} numberOfLines={1}>
                        {m.name}
                      </T>
                      <Meta>
                        {[m.minutes && `${m.minutes} min`, library.likedIds.includes(m.id) && "you liked it"].filter(Boolean).join(" · ")}
                      </Meta>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/pantry")} style={{ marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.mint, borderRadius: 18, padding: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                <Icon.fridge />
              </View>
              <View style={{ flex: 1 }}>
                <T w="extrabold" s={16} color="#173F2B">
                  Cook with what you have
                </T>
                <T s={13} color="#173F2B">
                  {prefs.pantry.length === 0
                    ? "Tell Otao what's in your kitchen"
                    : readyCount
                      ? `${prefs.pantry.length} items at home · ${readyCount} ready to cook`
                      : `${prefs.pantry.length} items at home · ${almost} need just one more thing`}
                </T>
              </View>
            </Pressable>
          </>
        )}

        <View style={{ gap: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            <Chip label="My recipes" tone="dark" on={lib === "mine"} onPress={() => setLib("mine")} />
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
      </ScrollView>
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
