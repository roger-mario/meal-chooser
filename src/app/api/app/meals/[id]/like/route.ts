import { and, eq } from "drizzle-orm";
import { db, mealFavourites, meals } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";

async function mealId(ctx: RouteContext<"/api/app/meals/[id]/like">) {
  const id = Number((await ctx.params).id);
  const [m] = Number.isInteger(id) ? await db().select({ id: meals.id }).from(meals).where(eq(meals.id, id)) : [];
  if (!m) throw new AuthError("This recipe doesn't exist any more.", 404, "not_found");
  return m.id;
}

export const PUT = appRoute(async (request: Request, ctx: RouteContext<"/api/app/meals/[id]/like">) => {
  const me = await requireAppUser(request);
  await db().insert(mealFavourites).values({ userId: me.id, mealId: await mealId(ctx) }).onConflictDoNothing();
  return Response.json({ liked: true });
});

export const DELETE = appRoute(async (request: Request, ctx: RouteContext<"/api/app/meals/[id]/like">) => {
  const me = await requireAppUser(request);
  await db().delete(mealFavourites).where(and(eq(mealFavourites.userId, me.id), eq(mealFavourites.mealId, await mealId(ctx))));
  return Response.json({ liked: false });
});
