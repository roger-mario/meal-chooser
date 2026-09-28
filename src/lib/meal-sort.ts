import { costPerServing } from "./cost";
import { totalMinutes } from "./meal-fields";
import type { MealWithCategories } from "./queries";

export const SORTS = [
  { value: "new", label: "Newest" },
  { value: "quick", label: "Quickest" },
  { value: "cheap", label: "Cheapest" },
  { value: "name", label: "A–Z" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

export function parseSort(v: unknown): Sort {
  return SORTS.some((s) => s.value === v) ? (v as Sort) : "new";
}

/** Meals missing the value (no time, no price) go last. */
export function sortMeals(meals: MealWithCategories[], sort: Sort) {
  const last = (n: number | null) => n ?? Number.POSITIVE_INFINITY;
  const list = [...meals];
  if (sort === "quick") list.sort((a, b) => last(totalMinutes(a)) - last(totalMinutes(b)));
  if (sort === "cheap") list.sort((a, b) => last(costPerServing(a.cost, a.servings)) - last(costPerServing(b.cost, b.servings)));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "de-CH"));
  return list;
}
