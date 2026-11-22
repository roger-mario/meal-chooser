import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { Avatar, Button, Card, Dish, H, Sheet, T } from "@/components/ui";
import { api, type PlanEntry, type Shopping, type Slot } from "@/lib/api";
import { useNavScroll, useNavSpace } from "@/lib/navbar";
import { useData } from "@/lib/data";
import { addDays, dayLabel, isoDay, monthDays } from "@/lib/dates";
import { addToPlan, fillGaps, removeFromPlan, SLOT_LABEL, usePlan } from "@/lib/plan";
import { C } from "@/lib/theme";

type View_ = "today" | "tomorrow" | "week" | "month";
const VIEWS: [View_, string][] = [
  ["today", "Today"],
  ["tomorrow", "Tomorrow"],
  ["week", "Week"],
  ["month", "Month"],
];

export default function PlanTab() {
  const router = useRouter();
  const onScroll = useNavScroll();
  const bottom = useNavSpace();
  const { library, meal } = useData();
  const today = isoDay();
  const [view, setView] = useState<View_>("today");
  const month = monthDays(today);
  const range = useMemo(() => {
    if (view === "today") return [today, today];
    if (view === "tomorrow") return [addDays(today, 1), addDays(today, 1)];
    if (view === "week") return [today, addDays(today, 6)];
    return [month.days[0], month.days[month.days.length - 1]];
  }, [view, today, month.days]);
  const { plan, reload } = usePlan(range[0], range[1]);
  const [shopping, setShopping] = useState<Shopping | null>(null);
  const [undo, setUndo] = useState<number[] | null>(null);
  const [filling, setFilling] = useState(false);
  const [picking, setPicking] = useState<{ day: string; slot: Slot } | null>(null);
  const [whoFor, setWhoFor] = useState<PlanEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // The shopping list covers the coming week, whatever view is open.
  useEffect(() => {
    api<Shopping>(`/shopping?from=${today}&to=${addDays(today, 6)}`).then(setShopping, () => setShopping(null));
  }, [plan, today]);

  const days = useMemo(() => {
    const out: string[] = [];
    if (view === "month") return out;
    for (let d = range[0]; d <= range[1]; d = addDays(d, 1)) out.push(d);
    return out;
  }, [view, range]);
  const entries = plan?.entries ?? [];
  const byDay = (d: string) => entries.filter((e) => e.day === d);
  const people = plan?.people ?? [];

  async function fill() {
    setFilling(true);
    try {
      const r = await fillGaps(view === "month" ? today : range[0], view === "month" ? addDays(today, 13) : range[1]);
      setUndo(r.added.length ? r.added : null);
      await reload();
    } finally {
      setFilling(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.coral}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <T w="extrabold" s={28} style={{ flex: 1, letterSpacing: -0.6 }}>
            Our plan
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Who plans with you" onPress={() => router.push("/household")} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingLeft: 6, paddingRight: 14, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.card }}>
            <View style={{ flexDirection: "row" }}>
              {people.slice(0, 3).map((p, i) => (
                <View key={p.id} style={{ marginLeft: i ? -8 : 0, borderRadius: 16, borderWidth: 2, borderColor: "#FFFFFF" }}>
                  <Avatar name={p.name} id={p.id} size={26} />
                </View>
              ))}
            </View>
            <T w="bold" s={14}>
              Shared
            </T>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: C.sand, borderRadius: 22, padding: 4 }}>
          {VIEWS.map(([v, label]) => (
            <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: view === v }} onPress={() => setView(v)} style={{ flex: 1, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: view === v ? C.card : "transparent" }}>
              <T w="bold" s={14}>
                {label}
              </T>
            </Pressable>
          ))}
        </View>

        {view === "month" ? (
          <MonthGrid today={today} entries={entries} onPick={() => setView("week")} />
        ) : (
          days.map((d) => {
            const list = byDay(d);
            const slots: Slot[] = ["lunch", "dinner"];
            return (
              <Card key={d} style={{ gap: 8, padding: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <T w="extrabold" s={16}>
                    {new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric" })}
                  </T>
                  {d === today && (
                    <T s={13} color={C.muted}>
                      today
                    </T>
                  )}
                </View>
                {slots.map((slot) => {
                  const here = list.filter((e) => e.slot === slot);
                  if (!here.length)
                    return (
                      <Pressable key={slot} accessibilityRole="button" onPress={() => setPicking({ day: d, slot })} style={{ minHeight: 52, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: C.lineStrong, paddingHorizontal: 12, justifyContent: "center" }}>
                        <T w="bold" s={12} color={C.muted}>
                          {SLOT_LABEL[slot]}
                        </T>
                        <T w="semibold" s={15} color={C.muted}>
                          Nothing yet · tap to add
                        </T>
                      </Pressable>
                    );
                  return here.map((e) => {
                    const m = meal(e.mealId);
                    const suggested = undo?.includes(e.id);
                    return (
                      <Pressable
                        key={e.id}
                        accessibilityRole="button"
                        onPress={() => (m ? router.push(`/recipe/${m.id}`) : undefined)}
                        onLongPress={() => setWhoFor(e)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 6, borderRadius: 14, backgroundColor: suggested ? C.butter : "transparent", borderWidth: 1, borderColor: suggested ? C.butterLine : "transparent" }}
                      >
                        {m ? <Dish meal={m} style={{ width: 40, height: 40 }} radius={10} /> : <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.sand }} />}
                        <View style={{ flex: 1 }}>
                          <T w="bold" s={12} color={C.muted}>
                            {SLOT_LABEL[e.slot]}
                            {suggested ? " · suggested" : ""}
                          </T>
                          <T w="bold" s={15} numberOfLines={1}>
                            {m?.name ?? e.label}
                          </T>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel={e.cook ? `${e.cook} cooks` : "Who cooks?"} hitSlop={6} onPress={() => setWhoFor(e)}>
                          {e.cook ? (
                            <Avatar name={e.cook} id={e.cookId!} size={26} />
                          ) : (
                            <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: C.lineStrong }} />
                          )}
                        </Pressable>
                      </Pressable>
                    );
                  });
                })}
              </Card>
            );
          })
        )}

        <View style={{ alignItems: "center" }}>
          {undo ? (
            <Button
              label="Suggestions added · undo"
              kind="secondary"
              size="sm"
              style={{ backgroundColor: C.butter, borderColor: C.butterLine }}
              onPress={async () => {
                await Promise.all(undo.map((id) => removeFromPlan(id)));
                setUndo(null);
                await reload();
              }}
            />
          ) : (
            <Button label="Fill the gaps for me" kind="secondary" size="sm" icon={<Icon.sparkle size={14} />} busy={filling} onPress={fill} />
          )}
        </View>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <H style={{ flex: 1 }}>Shopping list</H>
            <T s={13} color={C.muted}>
              {shopping?.lines.length ?? 0} {shopping?.lines.length === 1 ? "item" : "items"} · next 7 days
            </T>
          </View>
          <T s={14} color={C.ink2} numberOfLines={3}>
            {shopping?.lines.length ? shopping.lines.map((l) => l.text).join(", ") : "Plan a few meals and their ingredients show up here. Basics like salt and oil are left out."}
          </T>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="What's at home" kind="secondary" style={{ flex: 1 }} onPress={() => router.push("/pantry")} />
            <Button label="Send to Bring" style={{ flex: 1 }} disabled={!shopping?.bringUrl} onPress={() => shopping?.bringUrl && Linking.openURL(shopping.bringUrl)} />
          </View>
        </Card>
      </ScrollView>

      <RecipePicker
        target={picking}
        onClose={() => setPicking(null)}
        meals={library?.meals ?? []}
        onPick={async (mealId) => {
          const t = picking!;
          setPicking(null);
          await addToPlan(t.day, t.slot, mealId);
          await reload();
        }}
      />
      <Sheet open={!!whoFor} onClose={() => setWhoFor(null)} title="Who cooks?">
        {people.map((p) => (
          <Button
            key={p.id}
            label={p.name}
            kind={whoFor?.cookId === p.id ? "dark" : "secondary"}
            icon={<Avatar name={p.name} id={p.id} size={24} />}
            onPress={async () => {
              const e = whoFor!;
              setWhoFor(null);
              await api(`/plan/${e.id}`, { method: "PATCH", body: { cookId: e.cookId === p.id ? null : p.id } });
              await reload();
            }}
          />
        ))}
        <Button
          label="Remove from plan"
          kind="ghost"
          onPress={async () => {
            const e = whoFor!;
            setWhoFor(null);
            await removeFromPlan(e.id);
            await reload();
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function MonthGrid({ today, entries, onPick }: { today: string; entries: PlanEntry[]; onPick: () => void }) {
  const m = monthDays(today);
  const planned = new Set(entries.filter((e) => e.slot === "dinner").map((e) => e.day));
  const cells = [...Array<string | null>(m.lead).fill(null), ...m.days];
  return (
    <View style={{ gap: 8 }}>
      <T w="extrabold" s={18}>
        {m.title}
      </T>
      <View style={{ flexDirection: "row" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <T key={i} w="bold" s={12} color={C.muted} style={{ flex: 1, textAlign: "center" }}>
            {d}
          </T>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((d, i) => {
          const bg = !d ? "transparent" : planned.has(d) ? C.mint : d >= today ? C.butter : C.sand;
          return (
            <View key={i} style={{ width: `${100 / 7}%`, padding: 3 }}>
              {d && (
                <Pressable accessibilityRole="button" onPress={onPick} style={{ aspectRatio: 1, borderRadius: 12, backgroundColor: bg, alignItems: "center", justifyContent: "center", borderWidth: d === today ? 2 : 0, borderColor: C.coral }}>
                  <T w="bold" s={14}>
                    {Number(d.slice(8))}
                  </T>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      <T s={13} color={C.muted}>
        Green days have dinner planned, yellow days still have gaps.
      </T>
    </View>
  );
}

function RecipePicker({ target, meals, onClose, onPick }: { target: { day: string; slot: Slot } | null; meals: { id: number; name: string; imageUrl: string | null; minutes: number | null; score: number | null }[]; onClose: () => void; onPick: (id: number) => void }) {
  const today = isoDay();
  return (
    <Sheet open={!!target} onClose={onClose} title={target ? `${dayLabel(target.day, today)} · ${SLOT_LABEL[target.slot]}` : ""}>
      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
        {[...meals]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((m) => (
            <Pressable key={m.id} accessibilityRole="button" onPress={() => onPick(m.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 6, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
              <Dish meal={m} style={{ width: 44, height: 44 }} radius={10} />
              <View style={{ flex: 1 }}>
                <T w="bold" s={15} numberOfLines={1}>
                  {m.name}
                </T>
                <T s={13} color={C.muted}>
                  {[m.minutes && `${m.minutes} min`, m.score != null && `Otao ${m.score}`].filter(Boolean).join(" · ")}
                </T>
              </View>
            </Pressable>
          ))}
      </ScrollView>
    </Sheet>
  );
}
