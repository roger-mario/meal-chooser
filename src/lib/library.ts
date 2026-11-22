import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { collectionMeals, collections, db, mealFavourites } from "@/db";

/** Recipe ids someone liked, newest first. */
export async function likedIds(userId: number): Promise<number[]> {
  const rows = await db()
    .select({ id: mealFavourites.mealId })
    .from(mealFavourites)
    .where(eq(mealFavourites.userId, userId))
    .orderBy(desc(mealFavourites.createdAt));
  return rows.map((r) => r.id);
}

export type CollectionSummary = { id: number; name: string; mealIds: number[] };

/** Someone's own collections, each with its recipe ids (newest first). */
export async function listCollections(userId: number): Promise<CollectionSummary[]> {
  const cs = await db().select().from(collections).where(eq(collections.userId, userId)).orderBy(desc(collections.createdAt));
  if (!cs.length) return [];
  const links = await db()
    .select({ collectionId: collectionMeals.collectionId, mealId: collectionMeals.mealId })
    .from(collectionMeals)
    .where(inArray(collectionMeals.collectionId, cs.map((c) => c.id)))
    .orderBy(desc(collectionMeals.createdAt));
  return cs.map((c) => ({ id: c.id, name: c.name, mealIds: links.filter((l) => l.collectionId === c.id).map((l) => l.mealId) }));
}

/** How many people liked each recipe. */
export async function likeCounts(): Promise<Map<number, number>> {
  const rows = await db()
    .select({ id: mealFavourites.mealId, n: sql<number>`count(*)::int` })
    .from(mealFavourites)
    .groupBy(mealFavourites.mealId);
  return new Map(rows.map((r) => [r.id, Number(r.n)]));
}
