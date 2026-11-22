import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { C } from "@/lib/theme";

// The Otao mark: a bowl of vegetables with a leaf and a little sun, drawn on a 170 x 104 grid.
const W = 170;
const H = 104;
const VEG = [
  { cx: 74, cy: 54, r: 9, fill: "#F28C3B" },
  { cx: 92, cy: 50, r: 10, fill: "#4E9A50" },
  { cx: 110, cy: 55, r: 8, fill: "#E8473B" },
  { cx: 100, cy: 60, r: 6, fill: "#F7DC5B" },
  { cx: 82, cy: 61, r: 5, fill: "#A8CC6E" },
];

const Leaf = () => (
  <G>
    <Path d="M8 40 C 22 18, 48 16, 58 28 C 46 44, 24 50, 8 40 Z" fill={C.green} />
    <Path d="M10 40 C 26 34, 40 30, 56 28" stroke="#3E8F63" strokeWidth={2} fill="none" strokeLinecap="round" />
  </G>
);
const Sun = () => (
  <G>
    <Circle cx={150} cy={26} r={17} fill="#F5D34A" />
    <Circle cx={150} cy={26} r={13} fill="#FFF2A8" />
    <Path d="M150 14 V38 M138 26 H162 M141.5 17.5 L158.5 34.5 M158.5 17.5 L141.5 34.5" stroke="#F5D34A" strokeWidth={1.6} />
  </G>
);
const Bowl = () => (
  <G>
    <Path d="M44 58 C 46 86, 66 100, 92 100 C 118 100, 138 86, 140 58 Z" fill={C.coral} />
    <Path d="M52 70 C 60 72, 124 72, 132 70" stroke="#FFB59E" strokeWidth={3} fill="none" strokeLinecap="round" />
  </G>
);

/** The static Otao mark. */
export function Logo({ size = 170 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <Leaf />
      <Ellipse cx={92} cy={58} rx={48} ry={12} fill="#FFFDF5" />
      {VEG.map((v) => (
        <Circle key={v.fill} {...v} />
      ))}
      <Bowl />
      <Sun />
    </Svg>
  );
}

/** "otao" next to the mark, for headers and the intro screen. */
export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.3 }}>
      <Logo size={size * 2.1} />
      <Text style={{ fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: size, letterSpacing: -size * 0.04, color: C.ink, lineHeight: size * 1.15 }}>otao</Text>
    </View>
  );
}

/**
 * The mark as a loader: the vegetables hop into the bowl one after another,
 * the leaf sways and the sun turns slowly.
 */
export function LogoLoader({ size = 150 }: { size?: number }) {
  const k = size / W;
  const [hop] = useState(() => VEG.map(() => new Animated.Value(0)));
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const veg = Animated.loop(
      Animated.sequence([
        Animated.stagger(
          110,
          hop.map((v) =>
            Animated.sequence([
              Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.bounce, useNativeDriver: true }),
            ]),
          ),
        ),
        Animated.delay(380),
      ]),
    );
    const sun = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    veg.start();
    sun.start();
    return () => {
      veg.stop();
      sun.stop();
    };
  }, [hop, spin]);

  const layer = { position: "absolute" as const, left: 0, top: 0 };
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={{ width: size, height: H * k }}>
      <Animated.View style={[layer, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-6deg", "6deg", "-6deg"] }) }] }]}>
        <Svg width={size} height={H * k} viewBox={`0 0 ${W} ${H}`}>
          <Leaf />
        </Svg>
      </Animated.View>
      <Svg width={size} height={H * k} viewBox={`0 0 ${W} ${H}`} style={layer}>
        <Ellipse cx={92} cy={58} rx={48} ry={12} fill="#FFFDF5" />
      </Svg>
      {VEG.map((v, i) => (
        <Animated.View
          key={v.fill}
          style={{
            position: "absolute",
            left: (v.cx - v.r) * k,
            top: (v.cy - v.r) * k,
            width: v.r * 2 * k,
            height: v.r * 2 * k,
            borderRadius: v.r * k,
            backgroundColor: v.fill,
            transform: [{ translateY: hop[i].interpolate({ inputRange: [0, 1], outputRange: [0, -22 * k] }) }],
          }}
        />
      ))}
      <Svg width={size} height={H * k} viewBox={`0 0 ${W} ${H}`} style={layer}>
        <Bowl />
      </Svg>
      <Animated.View
        style={{
          position: "absolute",
          left: 133 * k,
          top: 9 * k,
          width: 34 * k,
          height: 34 * k,
          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
        }}
      >
        <Svg width={34 * k} height={34 * k} viewBox="133 9 34 34">
          <Sun />
        </Svg>
      </Animated.View>
    </View>
  );
}
