import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { C } from "@/lib/theme";

// The Otao icon: a white bowl of orange food with a leaf and three lines of steam on a green tile,
// drawn on a 512 x 512 grid. Keep it in step with public/icon.svg and src/components/v7/Logo.tsx.
const G_SIZE = 512;
const RADIUS = 112;
const STEAM = ["M200 150c-14-18 14-32 0-54", "M256 136c-14-20 14-36 0-60", "M312 150c-14-18 14-32 0-54"];
// When each line of steam starts, in ms after the intro, so they rise one after another.
const STEAM_DELAY = [350, 0, 700];

const Tile = () => (
  <>
    <Defs>
      <LinearGradient id="otBg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#059669" />
        <Stop offset="1" stopColor="#064e3b" />
      </LinearGradient>
    </Defs>
    <Rect width={G_SIZE} height={G_SIZE} rx={RADIUS} fill="url(#otBg)" />
  </>
);
const SteamLine = ({ d }: { d: string }) => <Path d={d} fill="none" stroke="#fef3c7" strokeWidth={16} strokeLinecap="round" opacity={0.85} />;
const Food = () => (
  <>
    <Defs>
      <LinearGradient id="otFood" x1="0" y1="1" x2="0" y2="0">
        <Stop offset="0" stopColor="#ff5e3a" />
        <Stop offset="1" stopColor="#ffc14d" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#otFood)" d="M118 266c14-46 70-74 138-74s124 28 138 74z" />
    <Circle cx={190} cy={232} r={15} fill="#fde68a" opacity={0.9} />
    <Circle cx={318} cy={236} r={13} fill="#fde68a" opacity={0.9} />
    <Circle cx={246} cy={220} r={10} fill="#c2410c" opacity={0.55} />
  </>
);
const Leaf = () => (
  <G>
    <Path fill="#34d399" d="M256 204c-6-30 10-52 40-60 6 30-10 52-40 60z" />
    <Path fill="#10b981" d="M252 206c-22-20-46-20-64-6 20 18 44 20 64 6z" />
  </G>
);
const Bowl = () => (
  <>
    <Defs>
      <LinearGradient id="otBowl" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#fffaf0" />
        <Stop offset="1" stopColor="#fde7c2" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#otBowl)" d="M96 262h320c0 92-70 160-160 160S96 354 96 262z" />
    <Rect x={84} y={250} width={344} height={28} rx={14} fill="#fffaf0" />
  </>
);

/** The static Otao icon. */
export function Logo({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${G_SIZE} ${G_SIZE}`}>
      <Tile />
      {STEAM.map((d) => (
        <SteamLine key={d} d={d} />
      ))}
      <Food />
      <Leaf />
      <Bowl />
    </Svg>
  );
}

/** "otao" next to the icon, for headers and the intro screen. */
export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.32 }}>
      <Logo size={size * 1.4} />
      <Text style={{ fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: size, letterSpacing: -size * 0.04, color: C.ink, lineHeight: size * 1.15 }}>otao</Text>
    </View>
  );
}

/**
 * The animated Otao icon: the food drops into the bowl, the bowl wobbles on impact,
 * then the steam keeps rising. Used as the loader and on the intro screen.
 */
export function LogoLoader({ size = 120, label = "Loading" }: { size?: number; label?: string | null }) {
  const k = size / G_SIZE;
  const [drop] = useState(() => new Animated.Value(0));
  const [leaf] = useState(() => new Animated.Value(0));
  const [wobble] = useState(() => new Animated.Value(0));
  const [steam] = useState(() => STEAM.map(() => new Animated.Value(0)));

  useEffect(() => {
    const fall = (v: Animated.Value, delay: number) =>
      Animated.timing(v, { toValue: 1, duration: 500, delay, easing: Easing.bezier(0.55, 0, 0.9, 0.45), useNativeDriver: true });
    const intro = Animated.sequence([
      Animated.parallel([fall(drop, 150), fall(leaf, 270)]),
      Animated.timing(wobble, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);
    const rising = steam.map((v, i) =>
      Animated.sequence([
        Animated.delay(1050 + STEAM_DELAY[i]),
        Animated.loop(Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })),
      ]),
    );
    intro.start();
    rising.forEach((r) => r.start());
    return () => {
      intro.stop();
      rising.forEach((r) => r.stop());
    };
  }, [drop, leaf, wobble, steam]);

  const full = { position: "absolute" as const, left: 0, top: 0, width: size, height: size };
  const falling = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-330 * k, 0] }) }],
  });
  const at = [0, 0.14, 0.34, 0.54, 0.74, 1];
  const layer = (children: React.ReactNode) => (
    <Svg width={size} height={size} viewBox={`0 0 ${G_SIZE} ${G_SIZE}`}>
      {children}
    </Svg>
  );

  return (
    <View
      accessible={label !== null}
      accessibilityRole={label ? "progressbar" : "image"}
      accessibilityLabel={label ?? undefined}
      style={{ width: size, height: size, borderRadius: RADIUS * k, overflow: "hidden" }}
    >
      <View style={full}>{layer(<Tile />)}</View>
      {STEAM.map((d, i) => (
        <Animated.View
          key={d}
          style={[
            full,
            {
              opacity: steam[i].interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [0, 1, 0.85, 0] }),
              transform: [
                { translateX: steam[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 6 * k, -4 * k] }) },
                { translateY: steam[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [18 * k, -12 * k, -40 * k] }) },
              ],
            },
          ]}
        >
          {layer(<SteamLine d={d} />)}
        </Animated.View>
      ))}
      <Animated.View
        style={[
          full,
          {
            transformOrigin: `50% ${(420 / G_SIZE) * 100}%`,
            transform: [
              { rotate: wobble.interpolate({ inputRange: at, outputRange: ["0deg", "-4deg", "3deg", "-2deg", "1deg", "0deg"] }) },
              { translateY: wobble.interpolate({ inputRange: at, outputRange: [0, 7 * k, -3 * k, 1 * k, 0, 0] }) },
              { scaleX: wobble.interpolate({ inputRange: [0, 0.14, 0.34, 1], outputRange: [1, 1.03, 1, 1] }) },
              { scaleY: wobble.interpolate({ inputRange: [0, 0.14, 0.34, 1], outputRange: [1, 0.97, 1, 1] }) },
            ],
          },
        ]}
      >
        <Animated.View style={[full, falling(drop)]}>{layer(<Food />)}</Animated.View>
        <Animated.View style={[full, falling(leaf)]}>{layer(<Leaf />)}</Animated.View>
        <View style={full}>{layer(<Bowl />)}</View>
      </Animated.View>
    </View>
  );
}
