import "server-only";
import { and, asc, desc, eq, exists, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { categories, db, MEAL_SLOTS, mealCategories, mealComments, meals, planEntries, users, type Category, type Meal, type MealSlot } from "@/db";
import { normalizeIngredients, normalizeSteps, type Ingredient } from "./meal-fields";

export type MealAuthor = { id: number; name: string };

export type MealWithCategories = Omit<Meal, "ingredients"> & {
  ingredients: Ingredient[];
  categories: Category[];
  author: MealAuthor | null;
};

type Row = { meal: Meal; author: MealAuthor | null };

async function attachCategories(rows: Row[]): Promise<MealWithCategories[]> {
  if (rows.length === 0) return [];
  const links = await db()
    .select({ mealId: mealCategories.mealId, category: categories })
    .from(mealCategories)
    .innerJoin(categories, eq(categories.id, mealCategories.categoryId))
    .where(inArray(mealCategories.mealId, rows.map((r) => r.meal.id)));
  return rows.map(({ meal: m, author }) => ({
    ...m,
    ingredients: normalizeIngredients(m.ingredients),
    steps: normalizeSteps(m.steps, m.instructions),
    categories: links.filter((l) => l.mealId === m.id).map((l) => l.category),
    author: author?.id ? author : null,
  }));
}

function selectMeals() {
  return db()
    .select({ meal: meals, author: { id: users.id, name: users.name } })
    .from(meals)
    .leftJoin(users, eq(users.id, meals.authorId));
}

/** Matches the words anywhere in name, description, ingredients, steps, author or category. */
function searchCondition(q: string): SQL | undefined {
  const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!words.length) return undefined;
  return and(
    ...words.map((w) => {
      const pattern = `%${w.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      return or(
        ilike(meals.name, pattern),
        ilike(meals.description, pattern),
        ilike(sql`${meals.ingredients}::text`, pattern),
        ilike(sql`${meals.steps}::text`, pattern),
        ilike(users.name, pattern),
        exists(
          db()
            .select({ one: sql`1` })
            .from(mealCategories)
            .innerJoin(categories, eq(categories.id, mealCategories.categoryId))
            .where(and(eq(mealCategories.mealId, meals.id), ilike(categories.name, pattern))),
        ),
      )!;
    }),
  );
}

export async function listMeals(filters: { categoryId?: number; q?: string } = {}): Promise<MealWithCategories[]> {
  const conditions = [
    filters.categoryId
      ? exists(
          db()
            .select({ one: sql`1` })
            .from(mealCategories)
            .where(and(eq(mealCategories.mealId, meals.id), eq(mealCategories.categoryId, filters.categoryId))),
        )
      : undefined,
    filters.q ? searchCondition(filters.q) : undefined,
  ].filter((c): c is SQL => !!c);

  const rows = await selectMeals()
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(meals.createdAt));
  return attachCategories(rows);
}

export async function getMeal(id: number): Promise<MealWithCategories | null> {
  if (!Number.isFinite(id)) return null;
  const rows = await selectMeals().where(eq(meals.id, id));
  return (await attachCategories(rows))[0] ?? null;
}

export async function listCategories(): Promise<Category[]> {
  return db().select().from(categories).orderBy(asc(categories.name));
}

export async function getSharedMeal(token: string): Promise<MealWithCategories | null> {
  if (!/^[A-Za-z0-9_-]{16}$/.test(token)) return null;
  const rows = await selectMeals().where(eq(meals.shareToken, token));
  return (await attachCategories(rows))[0] ?? null;
}

export type ChatMessage = { id: number; body: string; createdAt: Date; author: MealAuthor | null };

export async function listComments(mealId: number): Promise<ChatMessage[]> {
  const rows = await db()
    .select({
      id: mealComments.id,
      body: mealComments.body,
      createdAt: mealComments.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(mealComments)
    .leftJoin(users, eq(users.id, mealComments.userId))
    .where(eq(mealComments.mealId, mealId))
    .orderBy(asc(mealComments.createdAt), asc(mealComments.id));
  return rows.map((r) => ({ ...r, author: r.author?.id ? r.author : null }));
}

export type TodayEntry = { slot: MealSlot; mealId: number; name: string; imageUrl: string | null };

/** What the plan says for one day, in breakfast → snack order. */
export async function planForDay(date: string): Promise<TodayEntry[]> {
  const rows = await db()
    .select({ slot: planEntries.slot, mealId: meals.id, name: meals.name, imageUrl: meals.imageUrl })
    .from(planEntries)
    .innerJoin(meals, eq(meals.id, planEntries.mealId))
    .where(eq(planEntries.date, date));
  return rows.sort((a, b) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot));
}

/** Number of meals in each category, for the filter chips. */
export async function categoryCounts(): Promise<Map<number, number>> {
  const rows = await db()
    .select({ categoryId: mealCategories.categoryId, n: sql<number>`count(*)::int` })
    .from(mealCategories)
    .groupBy(mealCategories.categoryId);
  return new Map(rows.map((r) => [r.categoryId, r.n]));
}

/** Number of chat messages per meal. */
export async function commentCounts(): Promise<Map<number, number>> {
  const rows = await db()
    .select({ mealId: mealComments.mealId, n: sql<number>`count(*)::int` })
    .from(mealComments)
    .groupBy(mealComments.mealId);
  return new Map(rows.map((r) => [r.mealId, r.n]));
}
