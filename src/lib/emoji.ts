export const FOOD_EMOJIS = [
  "🍲", "🍝", "🍕", "🍔", "🌮", "🥗", "🍜", "🍛", "🍣", "🥘",
  "🍳", "🥞", "🥪", "🌯", "🍗", "🥩", "🐟", "🥦", "🥕", "🌱",
  "🍰", "🍪", "🍎", "🥣", "🍼", "👶", "📅", "⚡", "❤️", "🎉",
];

export const CATEGORY_COLORS = ["#059669", "#0284c7", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", "#57534e"];

/** Returns the emoji string if it is 1 to 3 emoji, otherwise null. */
export function validEmoji(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].map((s) => s.segment);
  if (graphemes.length < 1 || graphemes.length > 3) return null;
  return graphemes.every((g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g)) ? value : null;
}
