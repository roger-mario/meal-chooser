import "server-only";
import { asc } from "drizzle-orm";
import { categories, db } from "@/db";
import { BACKUP_APP, type Backup } from "./meal-input";
import { listMeals } from "./queries";

/** Everything except photos and chat messages. */
export async function buildBackup(): Promise<Backup> {
  const [cats, meals] = await Promise.all([
    db().select().from(categories).orderBy(asc(categories.name)),
    listMeals(),
  ]);
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: cats.map((c) => ({ name: c.name, emoji: c.emoji, color: c.color })),
    meals: meals
      .sort((a, b) => a.id - b.id)
      .map((m) => ({
        name: m.name,
        description: m.description,
        servings: m.servings,
        prepMinutes: m.prepMinutes,
        cookMinutes: m.cookMinutes,
        difficulty: m.difficulty,
        diet: m.diet,
        babyFriendly: m.babyFriendly,
        ingredients: m.ingredients,
        steps: m.steps,
        links: m.links,
        categories: m.categories.map((c) => c.name),
        nutrition: m.nutrition as Record<string, unknown> | null,
        cost: m.cost as Record<string, unknown> | null,
      })),
  };
}
