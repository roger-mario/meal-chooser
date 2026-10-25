import "server-only";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db, mealComments, mealFavourites, mealLog, mealViews } from "@/db";
import { addDays } from "./labs";
import { todayISO } from "./dates";
import { labsEnabled } from "./labs-queries";
import { getMeal, listMeals, type MealFilters, type MealWithCategories } from "./queries";

/**
 * Labs: the public/private toggle, favourites and quick picks show inside the app only with the
 * Labs buttons on. Return true here to move them into the main app for everyone.
 */
export const collectionInApp = labsEnabled;

/** Meals their authors made public, for the collection. */
export async function listPublicMeals(filters: MealFilters = {}): Promise<MealWithCategories[]> {
  return (await listMeals(filters)).filter((m) => m.isPublic);
}

export async function getPublicMeal(id: number): Promise<MealWithCategories | null> {
  const meal = await getMeal(id);
  return meal?.isPublic ? meal : null;
}

/** Only the author changes whether a meal is public. Meals without an author can be changed by anyone. */
export function canPublish(meal: { authorId: number | null }, userId: number | undefined) {
  return userId != null && (meal.authorId == null || meal.authorId === userId);
}

/** Counts an opened meal page. Not part of the cached lists, so no dataChanged(). */
export async function recordView(userId: number, mealId: number) {
  await db()
    .insert(mealViews)
    .values({ userId, mealId, count: 1 })
    .onConflictDoUpdate({
      target: [mealViews.userId, mealViews.mealId],
      set: { count: sql`${mealViews.count} + 1`, lastAt: sql`now()` },
    });
}

export async function isFavourite(userId: number, mealId: number) {
  const rows = await db()
    .select({ one: sql`1` })
    .from(mealFavourites)
    .where(and(eq(mealFavourites.userId, userId), eq(mealFavourites.mealId, mealId)));
  return rows.length > 0;
}

export type QuickPick = MealWithCategories & { favourite: boolean };

/**
 * Someone's go-to meals: their favourites first, then what they open, eat and chat about most.
 * Things from the last month count more than older ones.
 */
export async function quickPicks(userId: number, meals: MealWithCategories[], limit = 8): Promise<QuickPick[]> {
  const since = addDays(todayISO(), -90);
  const sinceDate = new Date(`${since}T00:00:00Z`);
  const [favourites, views, eaten, chats] = await Promise.all([
    db()
      .select({ mealId: mealFavourites.mealId })
      .from(mealFavourites)
      .where(eq(mealFavourites.userId, userId))
      .orderBy(desc(mealFavourites.createdAt)),
    db().select().from(mealViews).where(eq(mealViews.userId, userId)),
    db()
      .select({ mealId: mealLog.mealId, n: sql<number>`count(*)::int` })
      .from(mealLog)
      .where(and(eq(mealLog.userId, userId), eq(mealLog.planned, false), isNotNull(mealLog.mealId), gte(mealLog.day, since)))
      .groupBy(mealLog.mealId),
    db()
      .select({ mealId: mealComments.mealId, n: sql<number>`count(*)::int` })
      .from(mealComments)
      .where(and(eq(mealComments.userId, userId), gte(mealComments.createdAt, sinceDate)))
      .groupBy(mealComments.mealId),
  ]);

  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const score = new Map<number, number>();
  const add = (id: number | null, n: number) => id != null && score.set(id, (score.get(id) ?? 0) + n);
  for (const v of views) add(v.mealId, Math.min(v.count, 20) * (v.lastAt.getTime() > monthAgo ? 1 : 0.4));
  for (const e of eaten) add(e.mealId, 3 * e.n);
  for (const c of chats) add(c.mealId, 2 * c.n);

  const byId = new Map(meals.map((m) => [m.id, m]));
  const favIds = favourites.map((f) => f.mealId).filter((id) => byId.has(id));
  const fav = new Set(favIds);
  // Opening a meal once is not a habit yet.
  const often = [...score]
    .filter(([id, s]) => !fav.has(id) && byId.has(id) && s >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return [...favIds, ...often].slice(0, limit).map((id) => ({ ...byId.get(id)!, favourite: fav.has(id) }));
}
