import { Image } from "expo-image";
import { useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { dishSvg, foodFor, type Kind } from "@/lib/art";
import { avatarColors, C, F, initials, tileFor } from "@/lib/theme";

type Weight = keyof typeof F;

/** Text in Otao's font. `w` picks the weight, `s` the size. */
export function T({ w = "regular", s = 15, color = C.ink, style, ...rest }: TextProps & { w?: Weight; s?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: s, color, lineHeight: Math.round(s * 1.35) }, style]} />;
}

export function H({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <T w="extrabold" s={19} style={[{ letterSpacing: -0.2 }, style]}>
      {children}
    </T>
  );
}

type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  kind?: "primary" | "secondary" | "dark" | "ghost";
  size?: "md" | "lg" | "sm";
  icon?: ReactNode;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, kind = "primary", size = "md", icon, busy, style, disabled, ...rest }: ButtonProps) {
  const h = size === "lg" ? 54 : size === "sm" ? 36 : 46;
  const bg = kind === "primary" ? C.coral : kind === "dark" ? C.ink : kind === "secondary" ? C.card : "transparent";
  const fg = kind === "dark" ? "#FFFFFF" : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      {...rest}
      style={({ pressed }) => [
        {
          height: h,
          borderRadius: h / 2,
          backgroundColor: bg,
          borderWidth: kind === "secondary" ? 1 : 0,
          borderColor: C.lineStrong,
          paddingHorizontal: size === "sm" ? 14 : 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : icon}
      <T w="bold" s={size === "lg" ? 17 : size === "sm" ? 13 : 15} color={fg}>
        {label}
      </T>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, tone = "mint" }: { label: string; on?: boolean; onPress?: () => void; tone?: "mint" | "dark" }) {
  const active = tone === "dark" ? { bg: C.ink, fg: "#FFFFFF", border: C.ink } : { bg: C.mint, fg: C.mintInk, border: "#BFE3C9" };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: on ? active.border : C.lineStrong, backgroundColor: on ? active.bg : C.card, justifyContent: "center" }}
    >
      <T w="semibold" s={14} color={on ? active.fg : C.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const base: ViewStyle = { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 14 };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

export function Avatar({ name, id, size = 32 }: { name: string; id: number; size?: number }) {
  const [bg, fg] = avatarColors(id);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <T w="extrabold" s={Math.round(size * 0.36)} color={fg}>
        {initials(name)}
      </T>
    </View>
  );
}

/** The recipe photo, or a friendly illustration when there is none. */
export function Dish({ meal, style, kind, radius = 14, fit = "cover" }: { meal: { id: number; name: string; imageUrl: string | null }; style?: StyleProp<ViewStyle>; kind?: Kind; radius?: number; fit?: "cover" | "contain" }) {
  const xml = useMemo(() => (meal.imageUrl && !kind ? null : dishSvg(foodFor(meal.name, meal.id), meal.name + meal.id, kind)), [meal.id, meal.name, meal.imageUrl, kind]);
  return (
    <View style={[{ backgroundColor: tileFor(meal.id), borderRadius: radius, overflow: "hidden" }, style]}>
      {xml ? (
        <SvgXml xml={xml} width="100%" height="100%" preserveAspectRatio={fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"} />
      ) : (
        <Image source={{ uri: meal.imageUrl! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} alt="" accessibilityIgnoresInvertColors />
      )}
    </View>
  );
}

export function ScoreChip({ score, style }: { score: number | null; style?: StyleProp<ViewStyle> }) {
  if (score == null) return null;
  return (
    <View style={[{ height: 26, paddingHorizontal: 9, borderRadius: 13, backgroundColor: "#FFFFFF", justifyContent: "center", alignSelf: "flex-start" }, style]}>
      <T w="extrabold" s={12} color={C.mintInk}>
        Otao {score}
      </T>
    </View>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return (
    <T s={13} color={C.muted} numberOfLines={1}>
      {children}
    </T>
  );
}

/** A bottom sheet. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(42,38,34,0.35)" }} />
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, paddingBottom: 16 + insets.bottom, gap: 12 }}>
        <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, marginBottom: 4 }} />
        <T w="extrabold" s={20}>
          {title}
        </T>
        {children}
      </View>
    </Modal>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: "flex-start", gap: 6 }}>
      <T w="bold" s={16}>
        {title}
      </T>
      <T s={14} color={C.muted}>
        {text}
      </T>
      {action}
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
      <ActivityIndicator color={C.coral} />
    </View>
  );
}
