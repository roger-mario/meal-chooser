"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, mealCategories, meals } from "@/db";
import { aiAvailable, NUTRIENTS, type NutritionEstimate } from "@/lib/nutrients";
import { deleteMealImage, ImageUploadError, uploadMealImage } from "@/lib/blob";
import { DIETS, DIFFICULTIES, UNITS, type Ingredient } from "@/lib/meal-fields";
import { estimateNutrition } from "@/lib/nutrition-ai";

export type FormState = { error?: string } | null;

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
  const oneOf = <T extends string>(k: string, values: readonly { value: T }[]) => {
    const v = str(k);
    return values.find((x) => x.value === v)?.value ?? null;
  };
  const json = <T>(k: string, fallback: T): T => {
    try {
      return JSON.parse(str(k) ?? "") as T;
    } catch {
      return fallback;
    }
  };

  const name = str("name");
  if (!name) throw new FormError("Please give the meal a name.");

  const ingredients: Ingredient[] = json<Ingredient[]>("ingredients", [])
    .filter((i) => i && typeof i.name === "string" && i.name.trim())
    .map((i) => {
      const quantity = Number(i.quantity);
      return {
        name: i.name.trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
        unit: UNITS.some((u) => u.value === i.unit) && i.unit ? i.unit : undefined,
        staple: Boolean(i.staple),
      };
    });
  const steps = json<string[]>("steps", [])
    .map((s) => String(s).trim())
    .filter(Boolean);

  return {
    name,
    description: str("description"),
    servings: num("servings") ?? 1,
    prepMinutes: num("prepMinutes"),
    cookMinutes: num("cookMinutes"),
    difficulty: oneOf("difficulty", DIFFICULTIES),
    diet: oneOf("diet", DIETS),
    ingredients,
    steps,
    instructions: null,
    categoryIds: formData
      .getAll("categoryIds")
      .map((v) => Number(v))
      .filter(Number.isFinite),
  };
}

class FormError extends Error {}

function errorState(e: unknown): FormState {
  if (e instanceof FormError || e instanceof ImageUploadError) return { error: e.message };
  console.error(e);
  return { error: "Something went wrong while saving. Please try again." };
}

async function uploadImage(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadMealImage(file);
}

async function setCategories(mealId: number, categoryIds: number[]) {
  await db().delete(mealCategories).where(eq(mealCategories.mealId, mealId));
  if (categoryIds.length > 0) {
    await db()
      .insert(mealCategories)
      .values(categoryIds.map((categoryId) => ({ mealId, categoryId })));
  }
}

export async function createMeal(_prev: FormState, formData: FormData): Promise<FormState> {
  let id: number;
  try {
    const { categoryIds, ...data } = parseMealForm(formData);
    const imageUrl = await uploadImage(formData);
    const [meal] = await db()
      .insert(meals)
      .values({ ...data, imageUrl })
      .returning({ id: meals.id });
    await setCategories(meal.id, categoryIds);
    id = meal.id;
  } catch (e) {
    return errorState(e);
  }
  revalidatePath("/");
  redirect(`/meals/${id}`);
}

export async function updateMeal(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const { categoryIds, ...data } = parseMealForm(formData);
    const [existing] = await db().select().from(meals).where(eq(meals.id, id));
    if (!existing) return { error: "This meal no longer exists." };

    let imageUrl = existing.imageUrl;
    const newImage = await uploadImage(formData);
    const removeImage = formData.get("removeImage") === "on";
    if (newImage || removeImage) {
      await deleteMealImage(existing.imageUrl);
      imageUrl = newImage;
    }

    await db()
      .update(meals)
      .set({ ...data, imageUrl, updatedAt: new Date() })
      .where(eq(meals.id, id));
    await setCategories(id, categoryIds);
  } catch (e) {
    return errorState(e);
  }
  revalidatePath("/", "layout");
  redirect(`/meals/${id}`);
}

export async function deleteMeal(id: number) {
  const [existing] = await db().delete(meals).where(eq(meals.id, id)).returning();
  await deleteMealImage(existing?.imageUrl);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function estimateMealNutrition(
  id: number,
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
