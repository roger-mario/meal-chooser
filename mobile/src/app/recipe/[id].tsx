import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { SaveSheet } from "@/components/SaveSheet";
import { Avatar, Button, Card, Dish, Empty, H, Loading, Sheet, T } from "@/components/ui";
import { api, type MealDetail, type Slot } from "@/lib/api";
import { useData } from "@/lib/data";
import { addDays, dayLabel, isoDay } from "@/lib/dates";
import { addToPlan, SLOT_LABEL } from "@/lib/plan";
import { atHome, usePrefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

export default function Recipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLiked, toggleLike, inAnyCollection } = useData();
  const { prefs } = usePrefs();
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allNutrients, setAllNutrients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api<MealDetail>(`/meals/${id}`).then(setMeal, (e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (error) return <View style={{ flex: 1, padding: 16, paddingTop: insets.top + 60, backgroundColor: C.bg }}><Empty title="Couldn't open this recipe" text={error} action={<Button label="Back" kind="secondary" size="sm" onPress={() => router.back()} />} /></View>;
  if (!meal) return <Loading />;

  const liked = isLiked(meal.id);
  const micros = meal.nutrition?.micros.filter((m) => !m.limit) ?? [];
  const shown = allNutrients ? micros : micros.slice(0, 6);
  const missing = meal.ingredientLines.filter((i) => !i.staple && !atHome(prefs.pantry, i.name)).length;
  const video = meal.links.find((l) => l.video);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <Dish meal={meal} style={{ height: 300 }} radius={0} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ position: "absolute", top: insets.top + 8, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
            <Icon.back />
          </Pressable>
          {video && (
            <Pressable accessibilityRole="button" onPress={() => WebBrowser.openBrowserAsync(video.url)} style={{ position: "absolute", right: 12, bottom: 36, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon.play size={12} />
              <T w="bold" s={14}>
                Video
              </T>
            </Pressable>
          )}
        </View>
        <View style={{ marginTop: -24, backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, gap: 22 }}>
          <View style={{ gap: 8 }}>
            <T w="extrabold" s={28} style={{ letterSpacing: -0.6, lineHeight: 32 }}>
              {meal.name}
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {meal.author && <Avatar name={meal.author} id={meal.author.length} size={26} />}
              <T s={14} color={C.muted} style={{ flex: 1 }} numberOfLines={1}>
                <T w="bold" s={14}>
                  {meal.mine ? "You" : meal.author ?? "Otao"}
                </T>
                {[meal.minutes && ` · ${meal.minutes} min`, ` · ${meal.servings} ${meal.servings === 1 ? "portion" : "portions"}`].filter(Boolean).join("")}
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} hitSlop={10} onPress={() => toggleLike(meal.id)}>
                <Icon.heart fill={liked ? C.like : "none"} color={liked ? C.like : C.ink} />
              </Pressable>
            </View>
            {meal.description ? (
              <T s={15} color={C.ink2}>
                {meal.description}
              </T>
            ) : null}
          </View>

          {meal.health && (
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: C.mint, borderRadius: 20, padding: 14 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                <T w="extrabold" s={20} color={C.mintInk}>
                  {meal.health.score}
                </T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T w="extrabold" s={16} color="#173F2B">
                  Otao score · {meal.health.label}
                </T>
                <T s={13} color="#173F2B">
                  {scoreWhy(meal)}
                </T>
              </View>
            </View>
          )}

          {meal.nutrition && (
            <View style={{ gap: 12 }}>
              <H>Nutrition per portion</H>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  [meal.nutrition.kcal, "kcal", ""],
                  [meal.nutrition.protein, "protein", "g"],
                  [meal.nutrition.carbs, "carbs", "g"],
                  [meal.nutrition.fat, "fat", "g"],
                ].map(([v, label, unit]) => (
                  <View key={String(label)} style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 10, alignItems: "center" }}>
                    <T w="extrabold" s={18}>
                      {v == null ? "–" : `${v}${unit}`}
                    </T>
                    <T s={12} color={C.muted}>
                      {label}
                    </T>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 12 }}>
                {shown.map((n) => (
                  <View key={n.key} style={{ width: "47%", gap: 5 }}>
                    <View style={{ flexDirection: "row" }}>
                      <T s={13} style={{ flex: 1 }} numberOfLines={1}>
                        {n.label}
                      </T>
                      <T w="bold" s={13}>
                        {n.pct ?? "–"}%
                      </T>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: C.sand }}>
                      <View style={{ width: `${Math.min(100, n.pct ?? 0)}%`, height: 6, borderRadius: 3, backgroundColor: (n.pct ?? 0) >= 30 ? C.green : C.warn }} />
                    </View>
                  </View>
                ))}
              </View>
              {micros.length > 6 && <Button label={allNutrients ? "Show fewer" : `Show all ${micros.length} vitamins and minerals`} kind="secondary" size="sm" onPress={() => setAllNutrients(!allNutrients)} />}
              <T s={12} color={C.muted}>
                Share of an adult’s daily need.{meal.nutrition.estimated ? " Estimated from the ingredients." : ""}
              </T>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <H style={{ flex: 1 }}>Ingredients</H>
              <Button label="Send to Bring" size="sm" icon={<Icon.cart size={16} />} onPress={() => Linking.openURL(meal.bringUrl)} />
            </View>
            <T s={13} color={C.muted}>
              For {meal.servings} {meal.servings === 1 ? "portion" : "portions"}.{prefs.pantry.length ? ` A green dot means it's at home${missing ? `, ${missing} missing` : ""}.` : ""}
            </T>
            {meal.ingredientLines.map((i, n) => (
              <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line }}>
                {prefs.pantry.length > 0 && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.staple || atHome(prefs.pantry, i.name) ? C.green : C.lineStrong }} />}
                <T s={15} style={{ flex: 1 }} color={i.staple ? C.muted : C.ink}>
                  {i.text}
                </T>
              </View>
            ))}
          </View>

          {meal.steps.length > 0 && (
            <View style={{ gap: 14 }}>
              <H>Steps</H>
              {meal.steps.map((s, n) => (
                <View key={n} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.peach, alignItems: "center", justifyContent: "center" }}>
                    <T w="extrabold" s={14} color={C.coralInk}>
                      {n + 1}
                    </T>
                  </View>
                  <T s={15} style={{ flex: 1, lineHeight: 22 }}>
                    {s}
                  </T>
                </View>
              ))}
            </View>
          )}

          {meal.comments.length > 0 && (
            <View style={{ gap: 10 }}>
              <H>Comments</H>
              {meal.comments.map((c) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 10 }}>
                  <Avatar name={c.author ?? "?"} id={(c.author ?? "").length} size={30} />
                  <Card style={{ flex: 1, padding: 10, borderRadius: 16 }}>
                    <T w="bold" s={14}>
                      {c.author ?? "Someone"}
                    </T>
                    <T s={15}>{c.body}</T>
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, padding: 12, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
        <Button label={inAnyCollection(meal.id) ? "Saved" : "Save"} kind="secondary" size="lg" icon={<Icon.bookmark size={18} fill={inAnyCollection(meal.id) ? C.ink : "none"} />} onPress={() => setSaving(true)} />
        <Button label="Add to our plan" size="lg" style={{ flex: 1 }} onPress={() => setPlanning(true)} />
      </View>

      {toast ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 24, right: 24, bottom: insets.bottom + 90, backgroundColor: C.ink, borderRadius: 22, padding: 12, alignItems: "center" }}>
          <T w="bold" s={14} color="#FFFFFF">
            {toast}
          </T>
        </View>
      ) : null}

      <SaveSheet mealId={saving ? meal.id : null} onClose={() => setSaving(false)} />
      <PlanSheet
        open={planning}
        onClose={() => setPlanning(false)}
        onPick={async (day, slot) => {
          setPlanning(false);
          try {
            await addToPlan(day, slot, meal.id);
            setToast(`Added to ${dayLabel(day, isoDay()).toLowerCase()} · ${SLOT_LABEL[slot].toLowerCase()}`);
          } catch (e) {
            setToast((e as Error).message);
          }
        }}
      />
    </View>
  );
}

function scoreWhy(m: MealDetail) {
  const good = m.health!.badges.filter((b) => b.tone === "good").map((b) => b.label.toLowerCase());
  const watch = m.health!.badges.filter((b) => b.tone === "watch").map((b) => b.label.toLowerCase());
  const parts = [];
  if (good.length) parts.push(`${cap(good.slice(0, 3).join(", "))}.`);
  if (watch.length) parts.push(`Watch out: ${watch.join(", ")}.`);
  return parts.join(" ") || "Balanced, nothing stands out.";
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function PlanSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (day: string, slot: Slot) => void }) {
  const today = isoDay();
  const [slot, setSlot] = useState<Slot>("dinner");
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <Sheet open={open} onClose={onClose} title="Add to our plan">
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["lunch", "dinner"] as Slot[]).map((s) => (
          <Pressable key={s} accessibilityRole="tab" accessibilityState={{ selected: slot === s }} onPress={() => setSlot(s)} style={{ flex: 1, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: slot === s ? C.ink : C.sand }}>
            <T w="bold" s={14} color={slot === s ? "#FFFFFF" : C.ink}>
              {SLOT_LABEL[s]}
            </T>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {days.map((d) => (
          <Pressable key={d} accessibilityRole="button" onPress={() => onPick(d, slot)} style={{ width: "31.5%", height: 52, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}>
            <T w="bold" s={14}>
              {dayLabel(d, today).split(" ")[0]}
            </T>
            {d !== today && d !== addDays(today, 1) && (
              <T s={12} color={C.muted}>
                {d.slice(8).replace(/^0/, "")}.
              </T>
            )}
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
