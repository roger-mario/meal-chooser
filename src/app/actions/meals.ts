"use server";

import { put, del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, mealCategories, meals } from "@/db";
import { aiAvailable, NUTRIENTS, type NutritionEstimate } from "@/lib/nutrients";
import { estimateNutrition } from "@/lib/nutrition-ai";

function parseMealForm(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const num = (k: string) => {
    const v = str(k);
    const n = v ? Number.parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const name = str("name");
  if (!name) throw new Error("Name is required");
  return {
    name,
    description: str("description"),
    servings: num("servings") ?? 1,
    prepMinutes: num("prepMinutes"),
    ingredients: (str("ingredients") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    instructions: str("instructions"),
    categoryIds: formData
      .getAll("categoryIds")
      .map((v) => Number(v))
      .filter(Number.isFinite),
  };
}

async function uploadImage(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Only images can be uploaded");
  const blob = await put(`meals/${file.name || "photo.jpg"}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

async function setCategories(mealId: number, categoryIds: number[]) {
  await db().delete(mealCategories).where(eq(mealCategories.mealId, mealId));
  if (categoryIds.length > 0) {
    await db()
      .insert(mealCategories)
      .values(categoryIds.map((categoryId) => ({ mealId, categoryId })));
  }
}

export async function createMeal(formData: FormData) {
  const { categoryIds, ...data } = parseMealForm(formData);
  const imageUrl = await uploadImage(formData);
  const [meal] = await db()
    .insert(meals)
    .values({ ...data, imageUrl })
    .returning({ id: meals.id });
  await setCategories(meal.id, categoryIds);
  revalidatePath("/");
  redirect(`/meals/${meal.id}`);
}

export async function updateMeal(id: number, formData: FormData) {
  const { categoryIds, ...data } = parseMealForm(formData);
  const [existing] = await db().select().from(meals).where(eq(meals.id, id));
  if (!existing) throw new Error("Meal not found");

  let imageUrl = existing.imageUrl;
  const newImage = await uploadImage(formData);
  const removeImage = formData.get("removeImage") === "on";
  if ((newImage || removeImage) && existing.imageUrl) {
    await del(existing.imageUrl).catch(() => {});
  }
  if (newImage) imageUrl = newImage;
  else if (removeImage) imageUrl = null;

  await db()
    .update(meals)
    .set({ ...data, imageUrl, updatedAt: new Date() })
    .where(eq(meals.id, id));
  await setCategories(id, categoryIds);
  revalidatePath("/", "layout");
  redirect(`/meals/${id}`);
}

export async function deleteMeal(id: number) {
  const [existing] = await db().delete(meals).where(eq(meals.id, id)).returning();
  if (existing?.imageUrl) await del(existing.imageUrl).catch(() => {});
  revalidatePath("/", "layout");
  redirect("/");
}

export async function estimateMealNutrition(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: { error?: string } | null,
): Promise<{ error?: string } | null> {
  const [meal] = await db().select().from(meals).where(eq(meals.id, id));
  if (!meal) return { error: "Meal not found" };
  if (!aiAvailable()) return { error: "AI estimates are not set up. Enter the values manually below." };
  try {
    const nutrition = await estimateNutrition(meal);
    await db()
      .update(meals)
      .set({ nutrition, nutritionEstimatedAt: new Date() })
      .where(eq(meals.id, id));
  } catch (e) {
    console.error("Nutrition estimate failed", e);
    return { error: "The nutrition estimate failed. Please try again." };
  }
  revalidatePath(`/meals/${id}`);
  return null;
}

export async function saveManualNutrition(id: number, formData: FormData) {
  const [meal] = await db().select().from(meals).where(eq(meals.id, id));
  if (!meal) throw new Error("Meal not found");

  const perServing: NutritionEstimate["perServing"] = {};
  for (const n of NUTRIENTS) {
    const raw = String(formData.get(n.key) ?? "").trim().replace(",", ".");
    const value = Number(raw);
    if (raw !== "" && Number.isFinite(value) && value >= 0) perServing[n.key] = value;
  }
  const notes = String(formData.get("notes") ?? "").trim();

  const nutrition: NutritionEstimate | null =
    Object.keys(perServing).length > 0
      ? { perServing, servings: meal.servings, source: "manual", summary: notes || undefined }
      : null;
  await db()
    .update(meals)
    .set({ nutrition, nutritionEstimatedAt: nutrition ? new Date() : null })
    .where(eq(meals.id, id));
  revalidatePath("/", "layout");
}
