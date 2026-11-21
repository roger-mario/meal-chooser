import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";
import { mealDetail, originOf } from "@/lib/app-api";
import { getMeal, listComments } from "@/lib/queries";

export const GET = appRoute(async (request: Request, ctx: RouteContext<"/api/app/meals/[id]">) => {
  const me = await requireAppUser(request);
  const id = Number((await ctx.params).id);
  const meal = Number.isInteger(id) ? await getMeal(id) : null;
  if (!meal) throw new AuthError("This recipe doesn't exist any more.", 404, "not_found");
  const comments = await listComments(meal.id);
  return Response.json({
    ...mealDetail(meal, originOf(request), me.id),
    comments: comments.map((c) => ({ id: c.id, body: c.body, at: c.createdAt.toISOString(), author: c.author?.name ?? null })),
  });
});
