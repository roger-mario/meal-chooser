import { z } from "zod";
import { collectionMeals, collections, db } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";

/** Body: { name, mealId? } — creates a collection, optionally with a first recipe in it. */
export const POST = appRoute(async (request: Request) => {
  const me = await requireAppUser(request);
  const input = z.object({ name: z.string().trim().min(1).max(60), mealId: z.number().int().positive().optional() }).safeParse(await request.json());
  if (!input.success) throw new AuthError("Give the collection a name.", 400, "bad_request");
  const [c] = await db().insert(collections).values({ userId: me.id, name: input.data.name }).returning();
  if (input.data.mealId) await db().insert(collectionMeals).values({ collectionId: c.id, mealId: input.data.mealId }).onConflictDoNothing();
  return Response.json({ id: c.id, name: c.name, mealIds: input.data.mealId ? [input.data.mealId] : [] });
});
