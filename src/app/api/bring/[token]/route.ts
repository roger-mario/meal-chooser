import { bringLines, readBringToken, recipePage } from "@/lib/bring";
import { getMeal } from "@/lib/queries";

// Public page that Bring! reads when importing a meal: only the name and the ingredients,
// as a schema.org Recipe (JSON-LD and microdata, since importers differ in what they read).
export async function GET(_req: Request, ctx: RouteContext<"/api/bring/[token]">) {
  const id = readBringToken((await ctx.params).token);
  const meal = id == null ? null : await getMeal(id);
  if (!meal) return new Response("Not found", { status: 404 });

  return recipePage(meal.name, meal.servings, bringLines(meal.ingredients));
}
