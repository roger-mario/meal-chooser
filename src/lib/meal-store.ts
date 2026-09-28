import "server-only";
import { inArray, sql } from "drizzle-orm";
import { categories, db, mealCategories, meals } from "@/db";
import type { CostEstimate } from "./cost";
import { validEmoji } from "./emoji";
import { sanitizeIngredients, sanitizeLinks, type Diet, type Difficulty } from "./meal-fields";
import type { CategoryInput, MealInput } from "./meal-input";
import type { NutritionEstimate } from "./nutrients";

/** Returns category ids by lower-cased name, creating any that don't exist yet. */
export async function ensureCategories(
  names: string[],
  definitions: CategoryInput[] = [],
): Promise<Map<string, number>> {
  const wanted = new Map<string, CategoryInput>();
  for (const n of names) wanted.set(n.trim().toLowerCase(), { name: n.trim() });
  for (const d of definitions) wanted.set(d.name.trim().toLowerCase(), d);
  if (wanted.size === 0) return new Map();

  const toCreate = [...wanted.values()].map((c) => ({
    name: c.name.trim(),
    emoji: (c.emoji && validEmoji(c.emoji)) || "🍽️",
    color: c.color ?? "#059669",
  }));
  await db().insert(categories).values(toCreate).onConflictDoNothing();

  const rows = await db()
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(inArray(sql`lower(${categories.name})`, [...wanted.keys()]));
  return new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
}

export async function createMealFromInput(input: MealInput, categoryIds?: Map<string, number>) {
  const ids = categoryIds ?? (await ensureCategories(input.categories ?? []));
  const [meal] = await db()
    .insert(meals)
    .values({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      servings: input.servings ?? 2,
      prepMinutes: input.prepMinutes || null,
      cookMinutes: input.cookMinutes || null,
      difficulty: (input.difficulty as Difficulty) ?? null,
      diet: (input.diet as Diet) ?? null,
      babyFriendly: input.babyFriendly ?? false,
      ingredients: sanitizeIngredients(input.ingredients ?? []),
      steps: (input.steps ?? []).map((s) => s.trim()).filter(Boolean),
      links: sanitizeLinks(input.links ?? []),
      nutrition: (input.nutrition as NutritionEstimate | null | undefined) ?? null,
      cost: (input.cost as CostEstimate | null | undefined) ?? null,
    })
    .returning({ id: meals.id });

  const catIds = [...new Set((input.categories ?? []).map((n) => ids.get(n.trim().toLowerCase())).filter((x): x is number => !!x))];
  if (catIds.length) {
    await db()
      .insert(mealCategories)
      .values(catIds.map((categoryId) => ({ mealId: meal.id, categoryId })));
  }
  return meal.id;
}
