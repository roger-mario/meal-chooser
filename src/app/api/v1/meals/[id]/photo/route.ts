import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, meals } from "@/db";
import { checkApiKey } from "@/lib/api-auth";
import { deleteMealImage, importMealImage } from "@/lib/blob";
import { dataChanged } from "@/lib/cache";

/** Replaces a meal's photo. Body: { "imageUrl": "https://…" }, or { "imageUrl": null } for the illustration. */
export async function POST(request: Request, ctx: RouteContext<"/api/v1/meals/[id]/photo">) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const body = z.object({ imageUrl: z.url({ protocol: /^https$/ }).max(2000).nullable() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Body must be { imageUrl: https URL or null }." }, { status: 400 });
  const [meal] = await db().select({ imageUrl: meals.imageUrl }).from(meals).where(eq(meals.id, id));
  if (!meal) return Response.json({ error: "Meal not found." }, { status: 404 });
  let imageUrl: string | null = null;
  if (body.data.imageUrl) {
    try {
      imageUrl = await importMealImage(body.data.imageUrl);
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "Photo download failed." }, { status: 400 });
    }
  }
  await db().update(meals).set({ imageUrl, updatedAt: new Date() }).where(eq(meals.id, id));
  await deleteMealImage(meal.imageUrl);
  dataChanged();
  revalidatePath("/", "layout");
  return Response.json({ imageUrl });
}
