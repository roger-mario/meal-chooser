import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, mealCategories, meals } from "@/db";
import { checkApiKey } from "@/lib/api-auth";
import { dataChanged } from "@/lib/cache";
import { ensureCategories } from "@/lib/meal-store";

/** Adds categories to a meal (missing ones are created). Body: { "add": ["Recreated"] } */
export async function POST(request: Request, ctx: RouteContext<"/api/v1/meals/[id]/categories">) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const body = z.object({ add: z.array(z.string().trim().min(1).max(100)).min(1).max(20) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Body must be { add: [names] }." }, { status: 400 });
  const [meal] = await db().select({ id: meals.id }).from(meals).where(eq(meals.id, id));
  if (!meal) return Response.json({ error: "Meal not found." }, { status: 404 });
  const ids = await ensureCategories(body.data.add);
  await db()
    .insert(mealCategories)
    .values([...ids.values()].map((categoryId) => ({ mealId: id, categoryId })))
    .onConflictDoNothing();
  dataChanged();
  revalidatePath("/", "layout");
  return Response.json({ added: body.data.add });
}
