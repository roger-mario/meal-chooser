import "server-only";
import { asc } from "drizzle-orm";
import { categories, db } from "@/db";
import { BACKUP_APP, type Backup, type MealInput } from "./meal-input";
import { listMealsLive, type MealWithCategories } from "./queries";

/** A saved meal in the format of backups and the API (without its photo). */
export function mealToInput(m: MealWithCategories): Omit<MealInput, "imageUrl"> {
  return {
    name: m.name,
    description: m.description,
    servings: m.servings,
    prepMinutes: m.prepMinutes,
    cookMinutes: m.cookMinutes,
    difficulty: m.difficulty,
    diet: m.diet,
    babyFriendly: m.babyFriendly,
    isPublic: m.isPublic,
    ingredients: m.ingredients,
    steps: m.steps,
    links: m.links,
    categories: m.categories.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    nutrition: m.nutrition as Record<string, unknown> | null,
    cost: m.cost as Record<string, unknown> | null,
  };
}

export async function backupData() {
  const [cats, meals] = await Promise.all([
    db().select().from(categories).orderBy(asc(categories.name)),
    listMealsLive(),
  ]);
  return {
    categories: cats.map((c) => ({ name: c.name, emoji: c.emoji, color: c.color })),
    meals: meals.sort((a, b) => a.id - b.id),
  };
}

/** Everything except photos and chat messages. */
export async function buildBackup(): Promise<Backup> {
  const { categories, meals } = await backupData();
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    meals: meals.map(mealToInput),
  };
}
