"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db, mealLog, meals } from "@/db";
import { todayISO } from "@/lib/dates";
import { addDays, daysFrom, isDay, isSlot, planWeek, type WeekRules } from "@/lib/labs";
import { LABS_COOKIE, recentMealIds, RULES_COOKIE, weekRules } from "@/lib/labs-queries";
import { listMealsLive } from "@/lib/queries";
import { requireSite } from "@/lib/require-site";
import { getCurrentUser } from "@/lib/users";

export type LabsState = { error?: string } | null;

const COOKIE = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true } as const;

/** Logs what the person picked at the top right ate: a saved meal or a free-text label. */
export async function logMeal(_prev: LabsState, formData: FormData): Promise<LabsState> {
  await requireSite();
  const me = await getCurrentUser();
  if (!me) return { error: "Pick who you are at the top right first." };
  const day = formData.get("day");
  const slot = formData.get("slot");
  if (!isDay(day) || !isSlot(slot)) return { error: "Pick a day and a meal time." };
  const mealId = Number(formData.get("mealId")) || null;
  const label = String(formData.get("label") ?? "").trim().slice(0, 120) || null;
  const portions = Math.min(10, Math.max(0.25, Number(formData.get("portions")) || 1));
  if (!mealId && !label) return { error: "Pick a meal or type what you ate." };
  if (mealId) {
    const [m] = await db().select({ id: meals.id }).from(meals).where(eq(meals.id, mealId));
    if (!m) return { error: "That meal doesn't exist any more." };
  }
  await db().insert(mealLog).values({ day, slot, userId: me.id, mealId, label: mealId ? null : label, portions });
  revalidatePath("/labs", "layout");
  return null;
}

/** "We're having this" on a dinner suggestion. */
export async function logDinner(formData: FormData) {
  formData.set("slot", "dinner");
  await logMeal(null, formData);
}

export async function removeLogEntry(id: number) {
  await requireSite();
  await db().delete(mealLog).where(eq(mealLog.id, id));
  revalidatePath("/labs", "layout");
}

/** Marks a planned dinner as eaten by the current person. */
export async function atePlanned(id: number) {
  await requireSite();
  const me = await getCurrentUser();
  if (!me) return;
  const [row] = await db().select().from(mealLog).where(eq(mealLog.id, id));
  if (!row?.planned) return;
  await db().insert(mealLog).values({ day: row.day, slot: row.slot, userId: me.id, mealId: row.mealId, label: row.label });
  revalidatePath("/labs", "layout");
}

function readRules(formData: FormData): WeekRules {
  const n = (k: string, max: number) => Math.min(max, Math.max(0, Math.round(Number(formData.get(k)) || 0)));
  return {
    weekdayMinutes: n("weekdayMinutes", 240),
    babyDinners: n("babyDinners", 7),
    fishDinners: n("fishDinners", 7),
    maxChf: Math.min(100, Math.max(0, Number(formData.get("maxChf")) || 0)),
  };
}

/** Drafts dinners for the 7 days from tomorrow, replacing the earlier draft for those days. */
export async function planNextWeek(formData: FormData) {
  await requireSite();
  const rules = readRules(formData);
  (await cookies()).set(RULES_COOKIE, JSON.stringify(rules), COOKIE);
  const start = addDays(todayISO(), 1);
  const days = daysFrom(start, 7);
  const [all, recent] = await Promise.all([listMealsLive(), recentMealIds(start)]);
  const plan = planWeek(all, days, rules, { recent });
  await db()
    .delete(mealLog)
    .where(and(eq(mealLog.planned, true), gte(mealLog.day, days[0]), lte(mealLog.day, days[6])));
  if (plan.size) {
    await db()
      .insert(mealLog)
      .values([...plan].map(([day, mealId]) => ({ day, slot: "dinner" as const, mealId, planned: true })));
  }
  revalidatePath("/labs", "layout");
}

/** Picks another dinner for one planned day, keeping the rest of the week. */
export async function swapPlanned(id: number) {
  await requireSite();
  const [row] = await db().select().from(mealLog).where(eq(mealLog.id, id));
  if (!row?.planned) return;
  const days = daysFrom(addDays(row.day, -6), 13);
  const others = await db()
    .select()
    .from(mealLog)
    .where(and(eq(mealLog.planned, true), gte(mealLog.day, days[0]), lte(mealLog.day, days[12])));
  const rules = await weekRules();
  const keep = new Map(others.filter((o) => o.id !== row.id && o.mealId).map((o) => [o.day, o.mealId!]));
  const all = await listMealsLive();
  // The current choice counts as recent so a different meal comes up.
  const recent = new Set(row.mealId ? [row.mealId] : []);
  const pool = all.filter((m) => m.id !== row.mealId);
  const plan = planWeek(pool.length ? pool : all, [row.day], rules, { recent, keep });
  const mealId = plan.get(row.day);
  if (mealId) await db().update(mealLog).set({ mealId, label: null }).where(eq(mealLog.id, id));
  revalidatePath("/labs", "layout");
}

export async function setLabsInApp(on: boolean) {
  await requireSite();
  (await cookies()).set(LABS_COOKIE, on ? "on" : "off", COOKIE);
  revalidatePath("/", "layout");
}
