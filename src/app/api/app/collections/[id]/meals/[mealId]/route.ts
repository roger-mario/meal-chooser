import { and, eq } from "drizzle-orm";
import { collectionMeals, collections, db, meals } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";

type Ctx = RouteContext<"/api/app/collections/[id]/meals/[mealId]">;

async function target(request: Request, ctx: Ctx) {
  const me = await requireAppUser(request);
  const p = await ctx.params;
  const id = Number(p.id);
  const mealId = Number(p.mealId);
  const [c] = Number.isInteger(id) ? await db().select().from(collections).where(and(eq(collections.id, id), eq(collections.userId, me.id))) : [];
  const [m] = Number.isInteger(mealId) ? await db().select({ id: meals.id }).from(meals).where(eq(meals.id, mealId)) : [];
  if (!c || !m) throw new AuthError("Not found.", 404, "not_found");
  return { collectionId: c.id, mealId: m.id };
}

export const PUT = appRoute(async (request: Request, ctx: Ctx) => {
  await db().insert(collectionMeals).values(await target(request, ctx)).onConflictDoNothing();
  return Response.json({ ok: true });
});

export const DELETE = appRoute(async (request: Request, ctx: Ctx) => {
  const t = await target(request, ctx);
  await db().delete(collectionMeals).where(and(eq(collectionMeals.collectionId, t.collectionId), eq(collectionMeals.mealId, t.mealId)));
  return Response.json({ ok: true });
});
