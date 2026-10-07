import "server-only";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, mealLog, type MealLogEntry } from "@/db";
import { addDays, DEFAULT_RULES, type Slot, type WeekRules } from "./labs";

/** Rows between two days (inclusive). Eaten rows of one person, or the household's planned dinners. */
export async function listLog(from: string, to: string, who: { userId: number } | { planned: true }): Promise<MealLogEntry[]> {
  return db()
    .select()
    .from(mealLog)
    .where(
      and(
        gte(mealLog.day, from),
        lte(mealLog.day, to),
        "planned" in who ? eq(mealLog.planned, true) : and(eq(mealLog.planned, false), eq(mealLog.userId, who.userId)),
      ),
    )
    .orderBy(mealLog.day, mealLog.createdAt);
}

/** Saved meals anyone ate in the 7 days before `day`, for variety. */
export async function recentMealIds(day: string): Promise<Set<number>> {
  const rows = await db()
    .selectDistinct({ mealId: mealLog.mealId })
    .from(mealLog)
    .where(and(eq(mealLog.planned, false), isNotNull(mealLog.mealId), gte(mealLog.day, addDays(day, -7)), lte(mealLog.day, addDays(day, -1))));
  return new Set(rows.map((r) => r.mealId!));
}

/** The saved meals someone logs most often for a slot, for one-tap adding. */
export async function usualMealIds(userId: number, slot: Slot, limit = 4): Promise<number[]> {
  const rows = await db()
    .select({ mealId: mealLog.mealId, n: sql<number>`count(*)` })
    .from(mealLog)
    .where(and(eq(mealLog.userId, userId), eq(mealLog.slot, slot), eq(mealLog.planned, false), isNotNull(mealLog.mealId)))
    .groupBy(mealLog.mealId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows.map((r) => r.mealId!);
}

export const LABS_COOKIE = "otao_labs";
export const RULES_COOKIE = "otao_week_rules";

/** Whether this browser shows Labs buttons inside the main app (e.g. "Ate this today" on meals). */
export async function labsEnabled() {
  return (await cookies()).get(LABS_COOKIE)?.value === "on";
}

export async function weekRules(): Promise<WeekRules> {
  try {
    const saved = JSON.parse((await cookies()).get(RULES_COOKIE)?.value ?? "{}");
    return { ...DEFAULT_RULES, ...saved };
  } catch {
    return DEFAULT_RULES;
  }
}
