import Svg, { Circle, Path, Rect } from "react-native-svg";
import { C } from "@/lib/theme";

type P = { size?: number; color?: string; fill?: string; width?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24" });

export const Icon = {
  home: ({ size = 24, color = C.ink, width = 1.9 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  feed: ({ size = 24, color = C.ink, width = 1.9 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="3" width="14" height="18" rx="3" />
      <Path d="M10.5 9.5v5l4-2.5z" />
    </Svg>
  ),
  plan: ({ size = 24, color = C.ink, width = 1.9 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="5" width="16" height="15" rx="2.5" />
      <Path d="M8 3v4M16 3v4M4 10h16" />
    </Svg>
  ),
  you: ({ size = 24, color = C.ink, width = 1.9 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </Svg>
  ),
  plus: ({ size = 24, color = C.ink, width = 2.4 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  back: ({ size = 22, color = C.ink, width = 2.2 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  ),
  chevron: ({ size = 18, color = C.off, width = 2 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  ),
  heart: ({ size = 24, color = C.ink, fill = "none", width = 1.9 }: P) => (
    <Svg {...base(size)} fill={fill} stroke={color} strokeWidth={width} strokeLinejoin="round">
      <Path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.3 4 6.4C19 15.6 12 20 12 20z" />
    </Svg>
  ),
  bookmark: ({ size = 22, color = C.ink, fill = "none", width = 1.9 }: P) => (
    <Svg {...base(size)} fill={fill} stroke={color} strokeWidth={width} strokeLinejoin="round">
      <Path d="M6 4h12v17l-6-4-6 4z" />
    </Svg>
  ),
  close: ({ size = 16, color = C.ink, width = 2.4 }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
      <Path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  sparkle: ({ size = 16, color = C.coral }: P) => (
    <Svg {...base(size)} fill={color}>
      <Path d="M12 2l1.8 5.6L19.5 9l-5.7 1.6L12 16l-1.8-5.4L4.5 9l5.7-1.4z" />
    </Svg>
  ),
  sun: ({ size = 20, color = C.butterInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  ),
  fridge: ({ size = 22, color = C.mintInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="2.5" width="14" height="19" rx="2" />
      <Path d="M5 10h14M8.5 6v1.5M8.5 13v2.5" />
    </Svg>
  ),
  cart: ({ size = 20, color = C.ink }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" />
      <Circle cx="9.5" cy="19" r="1.4" />
      <Circle cx="17" cy="19" r="1.4" />
    </Svg>
  ),
  play: ({ size = 16, color = C.ink }: P) => (
    <Svg {...base(size)} fill={color}>
      <Path d="M7 4l13 8-13 8z" />
    </Svg>
  ),
  inbox: ({ size = 20, color = C.coralInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <Path d="M4 13h4.5l1 2h5l1-2H20" />
    </Svg>
  ),
  leaf: ({ size = 20, color = C.butterInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" />
      <Path d="M5 19l7-7" />
    </Svg>
  ),
  stack: ({ size = 20, color = C.coralInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="8" width="16" height="12" rx="2.5" />
      <Path d="M7 5h10M9 2.5h6" />
    </Svg>
  ),
  invite: ({ size = 20, color = C.skyInk }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="10" cy="8" r="3.5" />
      <Path d="M3.5 19c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M18 7v6M15 10h6" />
    </Svg>
  ),
  share: ({ size = 22, color = C.ink }: P) => (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />
    </Svg>
  ),
};
