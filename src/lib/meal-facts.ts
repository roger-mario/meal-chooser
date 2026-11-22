import { costPerServing } from "./cost";
import { mealHealth } from "./health";
import { formatMinutes, totalMinutes } from "./meal-fields";
import type { MealWithCategories } from "./queries";

/** The few numbers v7 shows on every recipe card: score, time, cost per portion and calories. */
export function mealFacts(m: MealWithCategories) {
  const minutes = totalMinutes(m);
  const perPortion = costPerServing(m.cost, m.servings);
  const kcal = m.nutrition?.perServing.calories;
  return {
    score: mealHealth(m.nutrition)?.score ?? null,
    minutes,
    time: minutes ? formatMinutes(minutes) : null,
    chf: perPortion,
    kcal: kcal == null ? null : Math.round(kcal),
  };
}
