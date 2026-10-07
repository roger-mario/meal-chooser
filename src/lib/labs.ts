// Labs: day totals, nutrient gaps, dinner suggestions, the week plan and merged shopping lists.
// Plain functions over meals that are already loaded, so the pages stay quick.

import { mealHealth } from "./health";
import { formatIngredient, ingredientKey, totalMinutes, type Ingredient } from "./meal-fields";
import { NUTRIENTS, POORLY_TABULATED, type NutrientKey } from "./nutrients";
import type { MealWithCategories } from "./queries";
import { costPerServing } from "./cost";

export const SLOTS = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "🥪" },
  { value: "dinner", label: "Dinner", emoji: "🍽️" },
  { value: "snack", label: "Snacks", emoji: "🍎" },
] as const;
export type Slot = (typeof SLOTS)[number]["value"];
export const isSlot = (v: unknown): v is Slot => SLOTS.some((s) => s.value === v);

export type Totals = Partial<Record<NutrientKey, number>>;

/** Adds up what a day's (or week's) entries deliver, by portions eaten. */
export function addUp(entries: { meal: MealWithCategories | null; portions: number }[]): Totals {
  const totals: Totals = {};
  for (const { meal, portions } of entries) {
    const per = meal?.nutrition?.perServing;
    if (!per) continue;
    for (const [k, v] of Object.entries(per) as [NutrientKey, number][]) totals[k] = (totals[k] ?? 0) + v * portions;
  }
  return totals;
}

const LIMITS = new Set<NutrientKey>(["sodium", "saturatedFat", "addedSugars", "cholesterol", "sugars", "transFat"]);
// Worth more than one vitamin each when filling gaps.
const WEIGHT: Partial<Record<NutrientKey, number>> = { fiber: 2, protein: 1.5, omega3: 1.5 };

/** Nutrients to aim for each day: everything with a daily value except the ones to limit. */
export const TARGETS = NUTRIENTS.filter(
  (n) =>
    "dailyValue" in n &&
    !LIMITS.has(n.key) &&
    !POORLY_TABULATED.has(n.key) &&
    n.key !== "calories" &&
    (n.group !== "fats" || n.key === "omega3"),
) as readonly ((typeof NUTRIENTS)[number] & { dailyValue: number })[];

export const KCAL_TARGET = 2000;

export function pctOf(key: NutrientKey, value: number | undefined) {
  const def = NUTRIENTS.find((n) => n.key === key);
  if (!def || !("dailyValue" in def) || value == null) return 0;
  return (value / def.dailyValue) * 100;
}

/** Nutrients below `under`% of the daily value, lowest first. */
export function gaps(totals: Totals, under = 70) {
  return TARGETS.map((n) => ({ def: n, pct: Math.round(pctOf(n.key, totals[n.key])) }))
    .filter((g) => g.pct < under)
    .sort((a, b) => a.pct - b.pct);
}

export type Suggestion = {
  meal: MealWithCategories;
  /** The nutrients this meal tops up most, in % of the daily value. */
  fills: { label: string; pct: number }[];
  score: number;
};

export type SuggestFilters = { quick?: boolean; baby?: boolean; veggie?: boolean };

/**
 * Ranks meals by how well one portion fills what today still misses, without pushing salt and
 * calories over the day's budget. Meals in `recent` (eaten in the last week) are left out for variety.
 */
export function suggestMeals(
  meals: MealWithCategories[],
  totals: Totals,
  { recent = new Set<number>(), filters = {}, limit = 3 }: { recent?: Set<number>; filters?: SuggestFilters; limit?: number } = {},
): Suggestion[] {
  const kcalLeft = KCAL_TARGET - (totals.calories ?? 0);
  return meals
    .filter((m) => m.nutrition?.perServing.calories != null)
    .filter((m) => !recent.has(m.id) && dinnerish(m))
    .filter((m) => !filters.quick || (totalMinutes(m) ?? 999) <= 30)
    .filter((m) => !filters.baby || m.babyFriendly)
    .filter((m) => !filters.veggie || m.diet === "vegetarian" || m.diet === "vegan")
    .map((meal) => {
      const per = meal.nutrition!.perServing;
      const fills: Suggestion["fills"] = [];
      let gain = 0;
      for (const n of TARGETS) {
        const missing = Math.max(0, 100 - pctOf(n.key, totals[n.key]));
        const adds = Math.min(pctOf(n.key, per[n.key]), missing);
        gain += (adds / 100) * (WEIGHT[n.key] ?? 1);
        if (adds >= 10) fills.push({ label: n.label.replace(/ \(.*\)$/, ""), pct: Math.round(adds) });
      }
      const saltOver = Math.max(0, pctOf("sodium", (totals.sodium ?? 0) + (per.sodium ?? 0)) - 100) / 100;
      const kcalOver = Math.max(0, (per.calories ?? 0) - Math.max(kcalLeft, 400)) / 500;
      const health = (mealHealth(meal.nutrition)?.score ?? 50) / 100;
      const score = gain - 2 * saltOver - kcalOver + 0.5 * health;
      return { meal, fills: fills.sort((a, b) => b.pct - a.pct).slice(0, 4), score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type WeekRules = {
  /** Longest total time on weekdays, in minutes; 0 = no limit. */
  weekdayMinutes: number;
  /** How many dinners should be baby-friendly. */
  babyDinners: number;
  /** How many dinners should have fish (or another rich omega-3 source). */
  fishDinners: number;
  /** Highest price per portion in CHF; 0 = no limit. */
  maxChf: number;
};

export const DEFAULT_RULES: WeekRules = { weekdayMinutes: 45, babyDinners: 3, fishDinners: 2, maxChf: 0 };

const FISH = /salmon|lachs|tuna|thon|fish|fisch|cod|kabeljau|trout|forelle|sardine|mackerel|makrele|shrimp|crevette/i;
export const isFishy = (m: MealWithCategories) => FISH.test(m.name) || (m.nutrition?.perServing.omega3 ?? 0) >= 1.5;

/** Breakfasts, snacks and desserts don't belong in the dinner plan or dinner suggestions. */
export function dinnerish(m: MealWithCategories) {
  return !m.categories.some((c) => /breakfast|frühstück|snack|dessert/i.test(c.name));
}

/**
 * Drafts dinners for the given days from the saved meals. Each day takes the best-scoring meal:
 * health score, the rules (time on weekdays, budget, fish and baby-friendly counts), no repeats
 * within the week or from the last week, and a little chance so a new draft looks different.
 */
export function planWeek(
  meals: MealWithCategories[],
  days: string[],
  rules: WeekRules,
  { recent = new Set<number>(), keep = new Map<string, number>(), random = Math.random } = {},
): Map<string, number> {
  const pool = meals.filter(dinnerish);
  const plan = new Map<string, number>(keep);
  if (pool.length === 0) return plan;
  const used = () => [...plan.values()];
  for (const day of days) {
    if (plan.has(day)) continue;
    const weekday = ![0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay());
    const chosen = used().map((id) => pool.find((m) => m.id === id)).filter(Boolean) as MealWithCategories[];
    const fishSoFar = chosen.filter(isFishy).length;
    const babySoFar = chosen.filter((m) => m.babyFriendly).length;
    const best = pool
      .map((m) => {
        let s = (mealHealth(m.nutrition)?.score ?? 50) / 10 + random() * 3;
        const repeats = used().filter((id) => id === m.id).length;
        s -= repeats * 12;
        if (recent.has(m.id)) s -= 4;
        // Not the same dinner two days in a row.
        if ([addDays(day, -1), addDays(day, 1)].some((d) => plan.get(d) === m.id)) s -= 6;
        const minutes = totalMinutes(m);
        if (weekday && rules.weekdayMinutes && minutes && minutes > rules.weekdayMinutes) s -= 8;
        const chf = costPerServing(m.cost, m.servings);
        if (rules.maxChf && chf != null && chf > rules.maxChf) s -= 8;
        if (fishSoFar < rules.fishDinners && isFishy(m)) s += 6;
        if (babySoFar < rules.babyDinners && m.babyFriendly) s += 5;
        return { m, s };
      })
      .sort((a, b) => b.s - a.s)[0];
    plan.set(day, best.m.id);
  }
  return plan;
}

export type ShoppingLine = { key: string; text: string; from: string[] };

/**
 * One list for several meals: the same ingredient in the same unit is added up
 * ("2 × 300 g chicken" → "600 g chicken"); basics like salt and oil are left out.
 */
export function mergeIngredients(meals: { name: string; ingredients: Ingredient[] }[]): ShoppingLine[] {
  const lines = new Map<string, { item: Ingredient; from: Set<string>; summable: boolean }>();
  for (const meal of meals) {
    for (const i of meal.ingredients) {
      if (i.staple || !i.name.trim()) continue;
      const key = [ingredientKey(i.name), (i.variant ?? "").trim().toLowerCase(), i.unit ?? ""].join("|");
      const line = lines.get(key);
      if (!line) {
        lines.set(key, { item: { ...i }, from: new Set([meal.name]), summable: i.quantity != null });
        continue;
      }
      line.from.add(meal.name);
      if (line.summable && i.quantity != null && line.item.quantity != null) {
        const lowA = line.item.quantity;
        const highA = line.item.quantityMax ?? lowA;
        line.item.quantity = lowA + i.quantity;
        const high = highA + (i.quantityMax ?? i.quantity);
        line.item.quantityMax = high > line.item.quantity ? high : undefined;
      } else {
        line.summable = false;
        line.item.quantity = undefined;
        line.item.quantityMax = undefined;
      }
    }
  }
  return [...lines.entries()]
    .map(([key, l]) => ({ key, text: formatIngredient(l.item), from: [...l.from] }))
    // By ingredient name, so "3 carrots" and "300 g carrots" sit together.
    .sort((a, b) => a.key.localeCompare(b.key, "de-CH"));
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO dates from `start`, `count` days long. */
export function daysFrom(start: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
