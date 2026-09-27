import { daysBetween } from "./dates";
import type { MealSlot } from "@/db/schema";

export type PlannerInput = {
  days: string[];
  slots: MealSlot[];
  mealIds: number[];
  /** Most recent date each meal was planned (from existing plan entries). */
  lastUsed: Map<number, string>;
  /** "date|slot" keys that are already filled and should be kept. */
  taken: Set<string>;
  /** Try not to repeat a meal within this many days. */
  minGapDays?: number;
};

export type Suggestion = { date: string; slot: MealSlot; mealId: number };

/**
 * Fills empty slots by rotating through the candidate meals: meals that have
 * not been planned for the longest time come first, and a meal is not reused
 * within `minGapDays` unless there are too few meals to avoid it.
 */
export function suggestPlan(input: PlannerInput): Suggestion[] {
  const { days, slots, mealIds, taken } = input;
  if (mealIds.length === 0) return [];
  const minGap = input.minGapDays ?? Math.min(3, Math.floor(mealIds.length / Math.max(slots.length, 1)));
  const lastUsed = new Map(input.lastUsed);
  const suggestions: Suggestion[] = [];

  for (const date of days) {
    const usedToday = new Set<number>();
    for (const slot of slots) {
      if (taken.has(`${date}|${slot}`)) continue;

      const scored = mealIds.map((id) => {
        const last = lastUsed.get(id);
        const gap = last ? Math.abs(daysBetween(last, date)) : Infinity;
        let score = gap === Infinity ? 1000 : gap;
        if (gap < minGap) score -= 500;
        if (usedToday.has(id)) score -= 1000;
        return { id, score: score + Math.random() };
      });
      scored.sort((a, b) => b.score - a.score);
      const pick = scored[0].id;

      suggestions.push({ date, slot, mealId: pick });
      usedToday.add(pick);
      lastUsed.set(pick, date);
    }
  }
  return suggestions;
}
