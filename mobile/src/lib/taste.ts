import type { MealSummary } from "./api";

// Words that tell us a recipe fits one of the onboarding food preferences.
const WORDS: Record<string, string[]> = {
  Vegetarian: ["vegetarian", "veggie", "vegan"],
  Fish: ["fish", "salmon", "tuna", "cod", "prawn", "shrimp", "trout"],
  Chicken: ["chicken"],
  Pasta: ["pasta", "penne", "spaghetti", "lasagne", "noodle", "gnocchi"],
  Asian: ["asian", "teriyaki", "korean", "thai", "curry", "ramen", "stir", "soy", "sushi"],
  Bowls: ["bowl"],
  Soups: ["soup", "stew", "broth"],
  "Meal prep": ["meal prep", "prep", "batch"],
  Baking: ["bake", "cake", "bread", "muffin", "cookie"],
};

function fits(m: MealSummary, pref: string) {
  if (pref === "Quick meals") return m.minutes != null && m.minutes <= 25;
  const words = WORDS[pref] ?? [pref.toLowerCase()];
  const text = [m.name, m.diet ?? "", ...m.categories, ...m.ingredients].join(" ").toLowerCase();
  return words.some((w) => text.includes(w));
}

/** Recipes from others that suit what the person likes, best first. Their own recipes fill in when there are few. */
export function suggestFor(meals: MealSummary[], likes: string[], avoid: string[], likedIds: number[]) {
  const liked = new Set(likedIds);
  const rank = (m: MealSummary) => likes.filter((l) => fits(m, l)).length * 30 + (liked.has(m.id) ? 12 : 0) + (m.score ?? 50);
  const ok = meals.filter((m) => !avoid.some((a) => fits(m, a)));
  const others = ok.filter((m) => !m.mine).sort((a, b) => rank(b) - rank(a));
  const own = ok.filter((m) => m.mine).sort((a, b) => rank(b) - rank(a));
  return [...others, ...own].slice(0, 8);
}
