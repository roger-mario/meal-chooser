/** Otao's bright, calm palette (from the v3 design). */
export const C = {
  bg: "#FFFCF8",
  card: "#FFFFFF",
  line: "#F0E9E0",
  lineStrong: "#E5DDD2",
  ink: "#2A2622",
  ink2: "#4F4842",
  muted: "#6F6860",
  off: "#9A9188",
  sand: "#F6F1EA",
  coral: "#FF7F5C",
  coralInk: "#A6402A",
  peach: "#FFE3D3",
  like: "#F0475C",
  mint: "#E2F3E6",
  mintInk: "#1E6B45",
  green: "#57B884",
  butter: "#FFF2CC",
  butterLine: "#F5DC8E",
  butterInk: "#7A5A00",
  sky: "#E4F0FB",
  skyInk: "#1F5A8A",
  blush: "#FFE6DE",
  warn: "#F2C46B",
} as const;

export const F = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

/** Soft background tints for recipes without a photo, picked by id. */
export const TILES = ["#FFE3D3", "#E2F3E6", "#E6EEFB", "#FFF0C7", "#FBE4EC", "#F3E8DA"] as const;
export const tileFor = (id: number) => TILES[Math.abs(id) % TILES.length];

const AVATARS: [string, string][] = [
  [C.sky, C.skyInk],
  [C.mint, C.mintInk],
  ["#FFF0C7", C.butterInk],
  [C.peach, C.coralInk],
];
export const avatarColors = (id: number) => AVATARS[Math.abs(id) % AVATARS.length];
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)).toUpperCase();
};

/** "≈ CHF 4.50", or null when there is no estimate. */
export const chf = (v: number | null | undefined) => (v == null ? null : `≈ CHF ${v.toFixed(2)}`);
