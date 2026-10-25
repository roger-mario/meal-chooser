"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, mealFavourites, meals } from "@/db";
import { dataChanged } from "@/lib/cache";
import { canPublish } from "@/lib/collection";
import { requireSite } from "@/lib/require-site";
import { getCurrentUser } from "@/lib/users";

/** Lists the meal in the public collection, or takes it out. Only its author may. */
export async function setMealPublic(mealId: number, isPublic: boolean): Promise<{ error?: string } | null> {
  await requireSite();
  const me = await getCurrentUser();
  if (!me) return { error: "Pick who you are at the top right first." };
  const [meal] = await db().select({ authorId: meals.authorId }).from(meals).where(eq(meals.id, mealId));
  if (!meal) return { error: "That meal doesn't exist any more." };
  if (!canPublish(meal, me.id)) return { error: "Only the person who added this meal can change that." };
  await db().update(meals).set({ isPublic }).where(eq(meals.id, mealId));
  dataChanged();
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/collection", "layout");
  return null;
}

/** Stars or un-stars a meal for the person picked at the top right. */
export async function setFavourite(mealId: number, favourite: boolean): Promise<{ error?: string } | null> {
  await requireSite();
  const me = await getCurrentUser();
  if (!me) return { error: "Pick who you are at the top right first." };
  if (favourite) {
    await db().insert(mealFavourites).values({ userId: me.id, mealId }).onConflictDoNothing();
  } else {
    await db().delete(mealFavourites).where(and(eq(mealFavourites.userId, me.id), eq(mealFavourites.mealId, mealId)));
  }
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/");
  revalidatePath("/cook");
  return null;
}
