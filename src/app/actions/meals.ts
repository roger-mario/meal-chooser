"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { dataChanged } from "@/lib/cache";
import { redirect } from "next/navigation";
import { db, mealCategories, meals } from "@/db";
import { NUTRIENTS, type NutritionEstimate } from "@/lib/nutrients";
import { COST_STORE, type CostEstimate, type CostItem } from "@/lib/cost";
import { startCostJob, startNutritionJob } from "@/lib/estimate-jobs";
import { deleteMealImage, ImageUploadError, uploadMealImage } from "@/lib/blob";
import { DIETS, DIFFICULTIES, sanitizeIngredients, sanitizeLinks, type Ingredient, type MealLink } from "@/lib/meal-fields";
import { getCurrentUser } from "@/lib/users";
import { requireSite } from "@/lib/require-site";

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

  const ingredients = sanitizeIngredients(json<Ingredient[]>("ingredients", []));
  const links = sanitizeLinks(json<MealLink[]>("links", []));
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
    babyFriendly: formData.get("babyFriendly") === "on",
    ingredients,
    steps,
    links,
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
  await requireSite();
  const user = await getCurrentUser();
  let id: number;
  try {
    const { categoryIds, ...data } = parseMealForm(formData);
    const imageUrl = await uploadImage(formData);
    const [meal] = await db()
      .insert(meals)
      .values({ ...data, imageUrl, authorId: user?.id ?? null })
      .returning({ id: meals.id });
    await setCategories(meal.id, categoryIds);
    id = meal.id;
  } catch (e) {
    return errorState(e);
  }
  dataChanged();
  revalidatePath("/");
  redirect(`/meals/${id}`);
}

export async function updateMeal(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSite();
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
  dataChanged();
  revalidatePath("/", "layout");
  redirect(`/meals/${id}`);
}

export async function deleteMeal(id: number) {
  await requireSite();
  const [existing] = await db().delete(meals).where(eq(meals.id, id)).returning();
  await deleteMealImage(existing?.imageUrl);
  dataChanged();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Starts the AI nutrition estimate in the background and returns at once. */
export async function estimateMealNutrition(
  id: number,
  _prev: { error?: string } | null,
): Promise<{ error?: string } | null> {
  await requireSite();
  const error = await startNutritionJob(id);
  revalidatePath(`/meals/${id}`);
  return error ? { error } : null;
}

export async function saveManualNutrition(id: number, formData: FormData) {
  await requireSite();
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
  dataChanged();
  revalidatePath("/", "layout");
}

/** Starts the AI price estimate in the background; see estimateMealNutrition. */
export async function estimateMealCost(id: number, _prev: FormState): Promise<FormState> {
  await requireSite();
  const error = await startCostJob(id);
  revalidatePath(`/meals/${id}`);
  return error ? { error } : null;
}

export async function saveManualCost(id: number, formData: FormData) {
  await requireSite();
  const items: CostItem[] = [];
  for (const name of formData.getAll("itemName")) {
    const idx = items.length;
    const raw = String(formData.getAll("itemChf")[idx] ?? "").trim().replace(",", ".");
    const chf = Number(raw);
    items.push({ name: String(name), chf: raw !== "" && Number.isFinite(chf) && chf >= 0 ? chf : NaN });
  }
  const priced = items.filter((i) => Number.isFinite(i.chf));
  const notes = String(formData.get("notes") ?? "").trim();
  const cost: CostEstimate | null = priced.length
    ? { store: COST_STORE, items: priced, source: "manual", notes: notes || undefined }
    : null;
  await db()
    .update(meals)
    .set({ cost, costEstimatedAt: cost ? new Date() : null })
    .where(eq(meals.id, id));
  dataChanged();
  revalidatePath("/", "layout");
}

export async function startSharing(id: number) {
  await requireSite();
  const token = randomBytes(12).toString("base64url");
  await db().update(meals).set({ shareToken: token }).where(eq(meals.id, id));
  dataChanged();
  revalidatePath(`/meals/${id}`);
}

export async function stopSharing(id: number) {
  await requireSite();
  await db().update(meals).set({ shareToken: null }).where(eq(meals.id, id));
  dataChanged();
  revalidatePath(`/meals/${id}`);
}
