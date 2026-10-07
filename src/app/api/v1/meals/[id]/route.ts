import { checkApiKey } from "@/lib/api-auth";
import { getMeal } from "@/lib/queries";

/** One meal with everything on it: ingredients, steps, nutrition and price estimates. */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/meals/[id]">) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const meal = await getMeal(Number((await ctx.params).id));
  if (!meal) return Response.json({ error: "Meal not found." }, { status: 404 });
  // The share token would open the public link, so it stays out.
  return Response.json({
    ...meal,
    shareToken: undefined,
    categories: meal.categories.map((c) => c.name),
    url: `${new URL(request.url).origin}/meals/${meal.id}`,
  });
}
