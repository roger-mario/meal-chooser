import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { categories, db, mealCategories, meals, type Category, type Meal } from "@/db";

export type MealWithCategories = Meal & { categories: Category[] };

async function attachCategories(rows: Meal[]): Promise<MealWithCategories[]> {
  if (rows.length === 0) return [];
  const links = await db()
    .select({ mealId: mealCategories.mealId, category: categories })
    .from(mealCategories)
    .innerJoin(categories, eq(categories.id, mealCategories.categoryId))
    .where(inArray(mealCategories.mealId, rows.map((r) => r.id)));
  return rows.map((m) => ({
    ...m,
    categories: links.filter((l) => l.mealId === m.id).map((l) => l.category),
  }));
}

export async function listMeals(categoryId?: number): Promise<MealWithCategories[]> {
  const rows = categoryId
    ? (
        await db()
          .select({ meal: meals })
          .from(meals)
          .innerJoin(mealCategories, eq(mealCategories.mealId, meals.id))
          .where(eq(mealCategories.categoryId, categoryId))
          .orderBy(desc(meals.createdAt))
      ).map((r) => r.meal)
    : await db().select().from(meals).orderBy(desc(meals.createdAt));
  return attachCategories(rows);
}

export async function getMeal(id: number): Promise<MealWithCategories | null> {
  if (!Number.isFinite(id)) return null;
  const [row] = await db().select().from(meals).where(eq(meals.id, id));
  if (!row) return null;
  const [withCats] = await attachCategories([row]);
  return withCats;
}

export async function listCategories(): Promise<Category[]> {
  return db().select().from(categories).orderBy(asc(categories.name));
}
