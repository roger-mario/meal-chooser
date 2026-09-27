"use server";

import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, MEAL_SLOTS, mealCategories, meals, planEntries, type MealSlot } from "@/db";
import { dateRange, rangeDates, type PlanRange } from "@/lib/dates";
import { suggestPlan } from "@/lib/planner";

export async function generatePlan(formData: FormData) {
  const range = (formData.get("range") as PlanRange) || "week";
  const month = (formData.get("month") as string) || undefined;
  const categoryId = Number(formData.get("categoryId")) || null;
  const replace = formData.get("replace") === "on";
  const slots = formData
    .getAll("slots")
    .filter((s): s is MealSlot => MEAL_SLOTS.includes(s as MealSlot));
  if (slots.length === 0) return;

  const { start, end } = rangeDates(range, month);
  const days = dateRange(start, end);

  const candidates = categoryId
    ? await db()
        .select({ id: mealCategories.mealId })
        .from(mealCategories)
        .where(eq(mealCategories.categoryId, categoryId))
    : await db().select({ id: meals.id }).from(meals);
  const mealIds = candidates.map((c) => c.id);
  if (mealIds.length === 0) return;

  if (replace) {
    await db()
      .delete(planEntries)
      .where(
        and(
          gte(planEntries.date, start),
          lte(planEntries.date, end),
          inArray(planEntries.slot, slots),
        ),
      );
  }

  const existing = await db()
    .select({ date: planEntries.date, slot: planEntries.slot })
    .from(planEntries)
    .where(and(gte(planEntries.date, start), lte(planEntries.date, end)));

  const lastUsedRows = await db()
    .select({ mealId: planEntries.mealId, last: sql<string>`max(${planEntries.date})` })
    .from(planEntries)
    .where(inArray(planEntries.mealId, mealIds))
    .groupBy(planEntries.mealId);

  const suggestions = suggestPlan({
    days,
    slots,
    mealIds,
    lastUsed: new Map(lastUsedRows.map((r) => [r.mealId, r.last])),
    taken: new Set(existing.map((e) => `${e.date}|${e.slot}`)),
  });

  if (suggestions.length > 0) {
    await db().insert(planEntries).values(suggestions).onConflictDoNothing();
  }
  revalidatePath("/plan");
}

export async function setPlanEntry(formData: FormData) {
  const date = String(formData.get("date"));
  const slot = String(formData.get("slot")) as MealSlot;
  const mealId = Number(formData.get("mealId"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !MEAL_SLOTS.includes(slot) || !mealId) return;
  await db()
    .insert(planEntries)
    .values({ date, slot, mealId })
    .onConflictDoUpdate({
      target: [planEntries.date, planEntries.slot],
      set: { mealId },
    });
  revalidatePath("/plan");
}

export async function removePlanEntry(id: number) {
  await db().delete(planEntries).where(eq(planEntries.id, id));
  revalidatePath("/plan");
}
