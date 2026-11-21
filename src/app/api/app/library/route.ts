import { asc, eq, inArray } from "drizzle-orm";
import { collectionMeals, collections, db, mealFavourites } from "@/db";
import { appRoute, requireAppUser } from "@/lib/app-auth";
import { mealSummary, originOf } from "@/lib/app-api";
import { listMeals } from "@/lib/queries";

/** Everything the app needs to start: all recipes, what you liked and your collections. */
export const GET = appRoute(async (request: Request) => {
  const me = await requireAppUser(request);
  const origin = originOf(request);
  const [meals, liked, colls] = await Promise.all([
    listMeals(),
    db().select({ mealId: mealFavourites.mealId }).from(mealFavourites).where(eq(mealFavourites.userId, me.id)),
    db().select().from(collections).where(eq(collections.userId, me.id)).orderBy(asc(collections.id)),
  ]);
  const items = colls.length
    ? await db().select().from(collectionMeals).where(inArray(collectionMeals.collectionId, colls.map((c) => c.id))).orderBy(asc(collectionMeals.createdAt))
    : [];
  return Response.json({
    me: { id: me.id, name: me.name },
    meals: meals.map((m) => mealSummary(m, origin, me.id)),
    likedIds: liked.map((l) => l.mealId),
    collections: colls.map((c) => ({ id: c.id, name: c.name, mealIds: items.filter((i) => i.collectionId === c.id).map((i) => i.mealId) })),
  });
});
