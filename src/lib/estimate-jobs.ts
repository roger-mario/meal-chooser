import "server-only";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db, meals } from "@/db";
import { aiErrorMessage, isRunning } from "./ai-errors";
import { dataChanged } from "./cache";
import { estimateCost } from "./cost-ai";
import { COST_STORE } from "./cost";
import { aiAvailable } from "./nutrients";
import { estimateNutrition } from "./nutrition-ai";

/**
 * Starts the AI nutrition estimate in the background and returns at once (an error message, or null).
 * The page shows a status while `nutritionJobStartedAt` is set and refreshes until it's done.
 * Callers check access first (requireSite() or the API key).
 */
export async function startNutritionJob(id: number): Promise<string | null> {
  const [meal] = await db().select().from(meals).where(eq(meals.id, id));
  if (!meal) return "Meal not found";
  if (!aiAvailable()) return "AI estimates are not set up. Enter the values manually below.";
  if (meal.ingredients.length === 0) return "Add ingredients to the meal first.";
  if (isRunning(meal.nutritionJobStartedAt)) return null;
  await db().update(meals).set({ nutritionJobStartedAt: new Date(), nutritionJobError: null }).where(eq(meals.id, id));
  after(async () => {
    try {
      const nutrition = await estimateNutrition(meal);
      await db()
        .update(meals)
        .set({ nutrition, nutritionEstimatedAt: new Date(), nutritionJobStartedAt: null })
        .where(eq(meals.id, id));
      // The home page shows calories and the health score.
      dataChanged();
    } catch (e) {
      console.error("Nutrition estimate failed", e);
      await db()
        .update(meals)
        .set({ nutritionJobStartedAt: null, nutritionJobError: aiErrorMessage(e) })
        .where(eq(meals.id, id));
    }
  });
  dataChanged();
  return null;
}

/** Starts the AI price estimate in the background; see startNutritionJob. */
export async function startCostJob(id: number): Promise<string | null> {
  const [meal] = await db().select().from(meals).where(eq(meals.id, id));
  if (!meal) return "Meal not found";
  if (!aiAvailable()) return `AI estimates are not set up. Enter the ${COST_STORE} prices manually below.`;
  if (meal.ingredients.length === 0) return "Add ingredients to the meal first.";
  if (isRunning(meal.costJobStartedAt)) return null;
  await db().update(meals).set({ costJobStartedAt: new Date(), costJobError: null }).where(eq(meals.id, id));
  after(async () => {
    try {
      const cost = await estimateCost(meal);
      await db().update(meals).set({ cost, costEstimatedAt: new Date(), costJobStartedAt: null }).where(eq(meals.id, id));
      // The home page shows prices.
      dataChanged();
    } catch (e) {
      console.error("Cost estimate failed", e);
      await db()
        .update(meals)
        .set({ costJobStartedAt: null, costJobError: aiErrorMessage(e) })
        .where(eq(meals.id, id));
    }
  });
  dataChanged();
  return null;
}
