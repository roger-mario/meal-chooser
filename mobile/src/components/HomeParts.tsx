import { useRouter } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, useWindowDimensions, View, type ScrollViewInstance } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import type { MealSummary, PlanEntry } from "@/lib/api";
import { addDays, shortDate } from "@/lib/dates";
import { SLOT_LABEL, SLOT_ORDER } from "@/lib/plan";
import { C, tileFor } from "@/lib/theme";
import { Icon } from "./icons";
import { Button, Dish, Meta, ScoreChip, T } from "./ui";


// Tiles on the blue wave must stand out from it, so blue tiles swap to a warm one.
const onSky = (tile: string) => (tile === "#E6EEFB" ? C.peach : tile);

const PAGES = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This week" },
] as const;

const dateOf = (iso: string) => new Date(`${iso}T12:00:00`);
const weekday = (iso: string) => dateOf(iso).toLocaleDateString("en-GB", { weekday: "short" });

/** Today, tomorrow and the week ahead, one swipeable card each. */
export function PlanStrip({ today, entries, meal, onFill, filling }: { today: string; entries: PlanEntry[]; meal: (id: number | null) => MealSummary | undefined; onFill: (day: string) => void; filling: string | null }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageW = width - 32;
  const ref = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const [heights, setHeights] = useState<number[]>([]);
  const measure = (i: number) => (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    setHeights((old) => (old[i] === h ? old : Object.assign([...old], { [i]: h })));
  };
  const byDay = (day: string) => entries.filter((e) => e.day === day).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  function go(i: number) {
    setPage(i);
    ref.current?.scrollTo({ x: i * (pageW + 12), animated: true });
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 }}>
        {PAGES.map((p, i) => (
          <Pressable key={p.key} accessibilityRole="tab" accessibilityState={{ selected: page === i }} onPress={() => go(i)} style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: "center", backgroundColor: page === i ? C.ink : "transparent" }}>
            <T w="bold" s={14} color={page === i ? "#FFFFFF" : C.muted}>
              {p.label}
            </T>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" onPress={() => router.navigate("/plan")} hitSlop={8}>
          <T w="bold" s={14} color={C.coralInk}>
            Plan
          </T>
        </Pressable>
      </View>
      <ScrollView
        ref={ref}
        horizontal
        style={heights[page] ? { height: heights[page] } : undefined}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageW + 12}
        decelerationRate="fast"
        scrollEventThrottle={32}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (pageW + 12));
          if (i !== page && i >= 0 && i < PAGES.length) setPage(i);
        }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 16, alignItems: "flex-start" }}
      >
        {[today, addDays(today, 1)].map((day, idx) => {
          const list = byDay(day);
          return (
            <View key={day} onLayout={measure(idx)} style={{ width: pageW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 12, gap: 10 }}>
              <T w="semibold" s={13} color={C.muted}>
                {dateOf(day).toLocaleDateString("en-GB", { weekday: "long" })}, {shortDate(dateOf(day))}
              </T>
              {list.length ? (
                list.map((e) => {
                  const m = meal(e.mealId);
                  return (
                    <Pressable key={e.id} accessibilityRole="button" disabled={!m} onPress={() => m && router.push(`/recipe/${m.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {m ? <Dish meal={m} style={{ width: 56, height: 56 }} radius={14} /> : <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.sand }} />}
                      <View style={{ flex: 1 }}>
                        <T w="bold" s={12} color={C.muted} style={{ letterSpacing: 0.4 }}>
                          {SLOT_LABEL[e.slot].toUpperCase()}
                        </T>
                        <T w="bold" s={16} numberOfLines={1}>
                          {m?.name ?? e.label ?? "A recipe that was removed"}
                        </T>
                        {m && <Meta>{[m.minutes && `${m.minutes} min`, m.score != null && `Otao ${m.score}`].filter(Boolean).join(" · ")}</Meta>}
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <T w="bold" s={16}>
                      Nothing planned yet
                    </T>
                    <T s={13} color={C.muted}>
                      Otao can pick something you’ll like.
                    </T>
                  </View>
                  <Button label="Fill for me" size="sm" icon={<Icon.sparkle color={C.ink} />} busy={filling === day} onPress={() => onFill(day)} />
                </View>
              )}
            </View>
          );
        })}
        <View onLayout={measure(2)} style={{ width: pageW, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 4 }}>
          {week.map((day, i) => {
            const names = byDay(day)
              .map((e) => meal(e.mealId)?.name ?? e.label)
              .filter(Boolean);
            return (
              <Pressable key={day} accessibilityRole="button" onPress={() => router.navigate("/plan")} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.sand }}>
                <T w="bold" s={14} color={i === 0 ? C.coralInk : C.ink} style={{ width: 64 }}>
                  {i === 0 ? "Today" : `${weekday(day)} ${dateOf(day).getDate()}`}
                </T>
                <T s={14} w={names.length ? "semibold" : "regular"} color={names.length ? C.ink : C.off} numberOfLines={1} style={{ flex: 1 }}>
                  {names.length ? names.join(" · ") : "Nothing yet"}
                </T>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * A soft sky-blue wave with a little food illustration. It flows into a row of big recipe cards
 * and ends in a rounded edge where the next section (`children`) begins.
 */
export function WaveBanner({ pill, title, text, action, onPress, meals, children }: { pill: string; title: string; text: string; action?: { label: string; onPress: () => void }; onPress: () => void; meals: MealSummary[]; children?: ReactNode }) {
  return (
    <View>
      <View style={{ position: "absolute", left: 0, right: 0, top: 46, bottom: 0 }} pointerEvents="none">
        <Svg width="100%" height={64} viewBox="0 0 390 64" preserveAspectRatio="none">
          <Path d="M0 34 C 70 4, 120 4, 190 24 S 320 52, 390 18 L 390 64 L 0 64 Z" fill={C.sky} />
        </Svg>
        <View style={{ flex: 1, marginTop: -1, backgroundColor: C.sky }}>
          <Svg width={150} height={90} viewBox="0 0 150 90" style={{ position: "absolute", left: 0, top: 4 }}>
            <Path d="M0 16 C 40 -4, 80 0, 110 18 S 150 48, 120 60 L 0 64 Z" fill="#F1F7FD" />
          </Svg>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", paddingRight: 24, height: 104 }} pointerEvents="none">
        <FoodArt />
      </View>
      <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 18 }}>
        <View style={{ alignSelf: "flex-start", backgroundColor: C.coral, borderRadius: 12, paddingHorizontal: 10, height: 24, justifyContent: "center" }}>
          <T w="extrabold" s={12} color="#FFFFFF" style={{ letterSpacing: 0.6 }}>
            {pill}
          </T>
        </View>
        <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <T w="extrabold" s={22} style={{ flex: 1, letterSpacing: -0.4, lineHeight: 27 }}>
            {title}
          </T>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
            <View style={{ transform: [{ rotate: "180deg" }] }}>
              <Icon.back size={18} />
            </View>
          </View>
        </Pressable>
        <T s={15} color={C.ink2}>
          {text}
        </T>
        {action && (
          <Pressable accessibilityRole="button" onPress={action.onPress} style={({ pressed }) => ({ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: "#FFFFFF", opacity: pressed ? 0.85 : 1, marginTop: 2 })}>
            <Icon.fridge size={18} />
            <T w="bold" s={13} color={C.mintInk}>
              {action.label}
            </T>
          </Pressable>
        )}
      </View>
      <RecipeCarousel meals={meals} />
      {children && <View style={{ marginTop: 28, backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 22 }}>{children}</View>}
    </View>
  );
}

/** Wide cards with a large picture, scrolling sideways. */
export function RecipeCarousel({ meals }: { meals: MealSummary[] }) {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }} decelerationRate="fast" snapToInterval={252}>
      {meals.map((m) => (
        <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/recipe/${m.id}`)} style={({ pressed }) => ({ width: 240, gap: 8, opacity: pressed ? 0.9 : 1 })}>
          <View>
            <Dish meal={m} style={{ height: 200, backgroundColor: onSky(tileFor(m.id)) }} radius={20} />
            <ScoreChip score={m.score} style={{ position: "absolute", left: 10, top: 10 }} />
          </View>
          <View style={{ gap: 2 }}>
            <T w="extrabold" s={17} numberOfLines={2} style={{ lineHeight: 22 }}>
              {m.name}
            </T>
            <Meta>{[m.mine ? "You" : m.author, m.minutes && `${m.minutes} min`].filter(Boolean).join(" · ")}</Meta>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** A bowl with a lemon slice and a basil leaf, in Otao's colours. */
function FoodArt() {
  return (
    <Svg width={170} height={104} viewBox="0 0 170 104">
      <Path d="M8 40 C 22 18, 48 16, 58 28 C 46 44, 24 50, 8 40 Z" fill={C.green} />
      <Path d="M10 40 C 26 34, 40 30, 56 28" stroke="#3E8F63" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={92} cy={58} rx={48} ry={12} fill="#FFFDF5" />
      <Circle cx={74} cy={54} r={9} fill="#F28C3B" />
      <Circle cx={92} cy={50} r={10} fill="#4E9A50" />
      <Circle cx={110} cy={55} r={8} fill="#E8473B" />
      <Circle cx={100} cy={60} r={6} fill="#F7DC5B" />
      <Circle cx={82} cy={61} r={5} fill="#A8CC6E" />
      <Path d="M44 58 C 46 86, 66 100, 92 100 C 118 100, 138 86, 140 58 Z" fill={C.coral} />
      <Path d="M52 70 C 60 72, 124 72, 132 70" stroke="#FFB59E" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={150} cy={26} r={17} fill="#F5D34A" />
      <Circle cx={150} cy={26} r={13} fill="#FFF2A8" />
      <Path d="M150 14 V38 M138 26 H162 M141.5 17.5 L158.5 34.5 M158.5 17.5 L141.5 34.5" stroke="#F5D34A" strokeWidth={1.6} />
    </Svg>
  );
}
