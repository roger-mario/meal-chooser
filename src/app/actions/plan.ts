"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, mealFavourites, mealLog, meals } from "@/db";
import { todayISO } from "@/lib/dates";
import { mealHealth } from "@/lib/health";
import { addDays, isDay, isSlot } from "@/lib/labs";
import { listMealsLive } from "@/lib/queries";
import { requireSite } from "@/lib/require-site";
import { getCurrentUser } from "@/lib/users";

export type PlanState = { error?: string; ok?: boolean } | null;

function refresh() {
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/feed");
  revalidatePath("/labs", "layout");
}

/** Adds a recipe to the household's shared plan. */
export async function addToPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  await requireSite();
  const mealId = Number(formData.get("mealId"));
  const day = formData.get("day");
  const slot = formData.get("slot") || "dinner";
  if (!Number.isInteger(mealId) || mealId <= 0 || !isDay(day) || !isSlot(slot)) return { error: "Pick a day and a meal time." };
  const [m] = await db().select({ id: meals.id }).from(meals).where(eq(meals.id, mealId));
  if (!m) return { error: "This recipe doesn't exist any more." };
  await db().insert(mealLog).values({ day, slot, mealId, planned: true });
  refresh();
  return { ok: true };
}

/** The plan page's own picker: adds, then goes back to the plan. */
export async function addToPlanAndReturn(formData: FormData) {
  const res = await addToPlan(null, formData);
  if (res?.error) throw new Error(res.error);
  redirect("/plan");
}

/** Takes one entry off the shared plan. */
export async function removeFromPlan(id: number) {
  await requireSite();
  await db().delete(mealLog).where(and(eq(mealLog.id, id), eq(mealLog.planned, true)));
  refresh();
}

/** "Fill for me": adds the best dinner that isn't planned this week, favourites and healthy recipes first. */
export async function fillDay(day: string) {
  await requireSite();
  if (!isDay(day)) return;
  const today = todayISO();
  const [all, planned, me] = await Promise.all([
    listMealsLive(),
    db().select({ mealId: mealLog.mealId }).from(mealLog).where(and(eq(mealLog.planned, true), gte(mealLog.day, addDays(today, -6)), lte(mealLog.day, addDays(today, 13)))),
    getCurrentUser(),
  ]);
  const liked = me ? new Set((await db().select({ id: mealFavourites.mealId }).from(mealFavourites).where(eq(mealFavourites.userId, me.id))).map((r) => r.id)) : new Set<number>();
  const taken = new Set(planned.map((p) => p.mealId));
  const rank = (m: (typeof all)[number]) => (liked.has(m.id) ? 15 : 0) + (mealHealth(m.nutrition)?.score ?? 50);
  const best = all.filter((m) => !taken.has(m.id) && m.ingredients.length > 0).sort((a, b) => rank(b) - rank(a))[0];
  if (!best) return;
  await db().insert(mealLog).values({ day, slot: "dinner", mealId: best.id, planned: true });
  refresh();
}
