import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState, type ReactNode } from "react";
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
import { C, chf } from "@/lib/theme";

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
  // Which sections are open. Ingredients start open, the rest start folded so the page feels calm.
  const [open, setOpen] = useState<Record<string, boolean>>({});

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

  const perPortion = chf(meal.cost?.perServing ?? meal.costPerServing);
  const facts = [
    meal.minutes ? { value: `${meal.minutes}`, label: "minutes" } : null,
    { value: String(meal.servings), label: meal.servings === 1 ? "portion" : "portions" },
    perPortion ? { value: perPortion.replace("≈ CHF ", ""), label: "CHF / portion" } : null,
    meal.nutrition?.kcal != null ? { value: String(meal.nutrition.kcal), label: "kcal" } : null,
  ].filter((f): f is { value: string; label: string } => !!f);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <View>
          <Dish meal={meal} style={{ height: 320 }} radius={0} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ position: "absolute", top: insets.top + 8, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
            <Icon.back />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} onPress={() => toggleLike(meal.id)} style={{ position: "absolute", top: insets.top + 8, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
            <Icon.heart size={22} fill={liked ? C.like : "none"} color={liked ? C.like : C.ink} />
          </Pressable>
          {video && (
            <Pressable accessibilityRole="button" onPress={() => WebBrowser.openBrowserAsync(video.url)} style={{ position: "absolute", right: 12, bottom: 40, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon.play size={12} />
              <T w="bold" s={14}>
                Video
              </T>
            </Pressable>
          )}
        </View>

        <View style={{ marginTop: -28, backgroundColor: C.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 24, gap: 26 }}>
          <View style={{ gap: 10 }}>
            <T w="extrabold" s={27} style={{ letterSpacing: -0.6, lineHeight: 32 }}>
              {meal.name}
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {meal.author && <Avatar name={meal.author} id={meal.author.length} size={24} />}
              <T s={14} color={C.muted}>
                by{" "}
                <T w="bold" s={14}>
                  {meal.mine ? "you" : meal.author ?? "Otao"}
                </T>
              </T>
            </View>
            {meal.description ? (
              <T s={15} color={C.ink2} style={{ lineHeight: 22 }}>
                {meal.description}
              </T>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, paddingVertical: 14 }}>
            {facts.map((f, i) => (
              <View key={f.label} style={{ flex: 1, alignItems: "center", gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: C.sand }}>
                <T w="extrabold" s={18}>
                  {f.value}
                </T>
                <T s={12} color={C.muted}>
                  {f.label}
                </T>
              </View>
            ))}
          </View>

          {meal.health && (
            <Pressable accessibilityRole="button" onPress={() => setOpen((o) => ({ ...o, score: !o.score }))} style={{ backgroundColor: C.mint, borderRadius: 20, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                  <T w="extrabold" s={19} color={C.mintInk}>
                    {meal.health.score}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T w="extrabold" s={16} color="#173F2B">
                    Otao score · {meal.health.label}
                  </T>
                  <T s={13} color="#173F2B">
                    {open.score ? "Tap to hide" : "Tap to see why"}
                  </T>
                </View>
                <Chevron open={!!open.score} color={C.mintInk} />
              </View>
              {open.score && (
                <T s={14} color="#173F2B" style={{ lineHeight: 20 }}>
                  {scoreWhy(meal)}
                </T>
              )}
            </Pressable>
          )}

          <View>
            <Section
              title="Ingredients"
              summary={`${meal.ingredientLines.length} items${prefs.pantry.length && missing ? ` · ${missing} not at home` : ""}`}
              open={open.ingredients !== false}
              onToggle={() => setOpen((o) => ({ ...o, ingredients: o.ingredients === false }))}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <T s={13} color={C.muted} style={{ flex: 1 }}>
                  For {meal.servings} {meal.servings === 1 ? "portion" : "portions"}.{prefs.pantry.length ? " Green means it’s at home." : ""}
                </T>
                <Button label="Send to Bring" size="sm" icon={<Icon.cart size={16} />} onPress={() => Linking.openURL(meal.bringUrl)} />
              </View>
              <View>
                {meal.ingredientLines.map((i, n) => (
                  <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: n ? 1 : 0, borderTopColor: C.sand }}>
                    {prefs.pantry.length > 0 && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.staple || atHome(prefs.pantry, i.name) ? C.green : C.lineStrong }} />}
                    <T s={15} style={{ flex: 1 }} color={i.staple ? C.muted : C.ink}>
                      {i.text}
                    </T>
                  </View>
                ))}
              </View>
            </Section>

            {meal.steps.length > 0 && (
              <Section title="Steps" summary={`${meal.steps.length} ${meal.steps.length === 1 ? "step" : "steps"}`} open={!!open.steps} onToggle={() => setOpen((o) => ({ ...o, steps: !o.steps }))}>
                <View style={{ gap: 18 }}>
                  {meal.steps.map((st, n) => (
                    <View key={n} style={{ flexDirection: "row", gap: 14 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.peach, alignItems: "center", justifyContent: "center" }}>
                        <T w="extrabold" s={14} color={C.coralInk}>
                          {n + 1}
                        </T>
                      </View>
                      <T s={15} style={{ flex: 1, lineHeight: 23, paddingTop: 3 }}>
                        {st}
                      </T>
                    </View>
                  ))}
                </View>
              </Section>
            )}

            {meal.nutrition && (
              <Section
                title="Nutrition"
                summary={[meal.nutrition.protein != null && `${meal.nutrition.protein} g protein`, micros.length && `${micros.length} vitamins and minerals`].filter(Boolean).join(" · ")}
                open={!!open.nutrition}
                onToggle={() => setOpen((o) => ({ ...o, nutrition: !o.nutrition }))}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[
                    [meal.nutrition.protein, "protein"],
                    [meal.nutrition.carbs, "carbs"],
                    [meal.nutrition.fat, "fat"],
                    [meal.nutrition.fiber, "fibre"],
                  ].map(([v, label]) => (
                    <View key={String(label)} style={{ flex: 1, backgroundColor: C.sand, borderRadius: 14, paddingVertical: 10, alignItems: "center" }}>
                      <T w="extrabold" s={16}>
                        {v == null ? "–" : `${v} g`}
                      </T>
                      <T s={12} color={C.muted}>
                        {label}
                      </T>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 14 }}>
                  {shown.map((n) => (
                    <View key={n.key} style={{ width: "46%", gap: 6 }}>
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
                {micros.length > 6 && <Button label={allNutrients ? "Show fewer" : `Show all ${micros.length}`} kind="secondary" size="sm" onPress={() => setAllNutrients(!allNutrients)} />}
                <T s={12} color={C.muted}>
                  Per portion, as a share of an adult’s daily need.{meal.nutrition.estimated ? " Estimated from the ingredients." : ""}
                </T>
              </Section>
            )}

            {meal.cost && meal.cost.items.length > 0 && (
              <Section title="Cost" summary={`${perPortion} per portion`} open={!!open.cost} onToggle={() => setOpen((o) => ({ ...o, cost: !o.cost }))}>
                <View>
                  {meal.cost.items.map((it, n) => (
                    <View key={n} style={{ flexDirection: "row", paddingVertical: 9, borderTopWidth: n ? 1 : 0, borderTopColor: C.sand }}>
                      <T s={14} style={{ flex: 1 }}>
                        {it.name}
                      </T>
                      <T s={14} color={C.muted}>
                        {it.chf == null ? "–" : it.chf.toFixed(2)}
                      </T>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }}>
                    <T w="bold" s={14} style={{ flex: 1 }}>
                      Whole recipe
                    </T>
                    <T w="bold" s={14}>
                      CHF {meal.cost.total?.toFixed(2)}
                    </T>
                  </View>
                </View>
                <T s={12} color={C.muted}>
                  {meal.cost.estimated ? `Estimated from regular ${meal.cost.store} prices. Promotions and budget lines are cheaper.` : "Prices you entered."}
                </T>
              </Section>
            )}

            {meal.comments.length > 0 && (
              <Section title="Comments" summary={String(meal.comments.length)} open={!!open.comments} onToggle={() => setOpen((o) => ({ ...o, comments: !o.comments }))} last>
                {meal.comments.map((c) => (
                  <View key={c.id} style={{ flexDirection: "row", gap: 10 }}>
                    <Avatar name={c.author ?? "?"} id={(c.author ?? "").length} size={30} />
                    <Card style={{ flex: 1, padding: 12, borderRadius: 16 }}>
                      <T w="bold" s={14}>
                        {c.author ?? "Someone"}
                      </T>
                      <T s={15}>{c.body}</T>
                    </Card>
                  </View>
                ))}
              </Section>
            )}
          </View>
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

/** A foldable recipe section: a big tappable header with a short summary, and the details below. */
function Section({ title, summary, open, onToggle, last, children }: { title: string; summary?: string; open: boolean; onToggle: () => void; last?: boolean; children: ReactNode }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, borderBottomWidth: last ? 1 : 0, borderBottomColor: C.line }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 18 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <H>{title}</H>
          {summary ? (
            <T s={13} color={C.muted} numberOfLines={1}>
              {summary}
            </T>
          ) : null}
        </View>
        <Chevron open={open} />
      </Pressable>
      {open && <View style={{ gap: 14, paddingBottom: 22 }}>{children}</View>}
    </View>
  );
}

function Chevron({ open, color = C.muted }: { open: boolean; color?: string }) {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: open ? C.sand : "transparent", alignItems: "center", justifyContent: "center", transform: [{ rotate: open ? "-90deg" : "90deg" }] }}>
      <Icon.chevron color={color} />
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
