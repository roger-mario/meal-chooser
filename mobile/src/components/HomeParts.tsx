import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import type { MealSummary } from "@/lib/api";
import { C } from "@/lib/theme";
import { Icon } from "./icons";
import { Dish, Meta, ScoreChip, T } from "./ui";

export type QuickAction = { label: string; bg: string; icon: ReactNode; onPress: () => void };

/** Big round shortcuts under the headline. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 }}>
      {actions.map((a) => (
        <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} style={({ pressed }) => ({ width: "25%", alignItems: "center", gap: 8, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>{a.icon}</View>
          <T w="semibold" s={13} style={{ textAlign: "center" }} numberOfLines={1}>
            {a.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

/** A soft sky-blue wave with a little food illustration, flowing into a row of big recipe cards. */
export function WaveBanner({ pill, title, text, onPress, meals }: { pill: string; title: string; text: string; onPress: () => void; meals: MealSummary[] }) {
  return (
    <View>
      <View style={{ position: "absolute", left: 0, right: 0, top: 46, bottom: 150 }} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 390 300" preserveAspectRatio="none">
          <Path d="M0 34 C 70 4, 120 4, 190 24 S 320 52, 390 18 L 390 262 C 320 292, 250 296, 180 276 S 60 252, 0 278 Z" fill={C.sky} />
          <Path d="M0 60 C 40 40, 80 44, 110 62 S 150 92, 120 104 L 0 108 Z" fill="#F1F7FD" />
          <Path d="M210 250 C 260 236, 330 238, 390 226 L 390 262 C 330 282, 260 284, 210 270 Z" fill="#D6E8F8" />
        </Svg>
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
      </View>
      <RecipeCarousel meals={meals} />
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
            <Dish meal={m} style={{ height: 200 }} radius={20} />
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
      {/* basil leaf */}
      <Path d="M8 40 C 22 18, 48 16, 58 28 C 46 44, 24 50, 8 40 Z" fill={C.green} />
      <Path d="M10 40 C 26 34, 40 30, 56 28" stroke="#3E8F63" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* bowl */}
      <Ellipse cx={92} cy={58} rx={48} ry={12} fill="#FFFDF5" />
      <Circle cx={74} cy={54} r={9} fill="#F28C3B" />
      <Circle cx={92} cy={50} r={10} fill="#4E9A50" />
      <Circle cx={110} cy={55} r={8} fill="#E8473B" />
      <Circle cx={100} cy={60} r={6} fill="#F7DC5B" />
      <Circle cx={82} cy={61} r={5} fill="#A8CC6E" />
      <Path d="M44 58 C 46 86, 66 100, 92 100 C 118 100, 138 86, 140 58 Z" fill={C.coral} />
      <Path d="M52 70 C 60 72, 124 72, 132 70" stroke="#FFB59E" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* lemon slice */}
      <Circle cx={150} cy={26} r={17} fill="#F5D34A" />
      <Circle cx={150} cy={26} r={13} fill="#FFF2A8" />
      <Path d="M150 14 V38 M138 26 H162 M141.5 17.5 L158.5 34.5 M158.5 17.5 L141.5 34.5" stroke="#F5D34A" strokeWidth={1.6} />
    </Svg>
  );
}
