import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, mealLog } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";
import { addDays, daysFrom, DEFAULT_RULES, isDay, planWeek } from "@/lib/labs";
import { recentMealIds } from "@/lib/labs-queries";
import { listMealsLive } from "@/lib/queries";

/**
 * "Fill the gaps for me": drafts a dinner for every day in the range that has none yet. Existing
 * entries stay. Returns the new entry ids, so the app can offer "undo".
 */
export const POST = appRoute(async (request: Request) => {
  await requireAppUser(request);
  const input = z.object({ from: z.string().refine(isDay), to: z.string().refine(isDay) }).safeParse(await request.json());
  if (!input.success || input.data.to < input.data.from || input.data.to > addDays(input.data.from, 30)) {
    throw new AuthError("Pick up to a month to fill.", 400, "bad_request");
  }
  const { from, to } = input.data;
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const around = daysFrom(addDays(from, -6), days.length + 12);
  const existing = await db()
    .select()
    .from(mealLog)
    .where(and(eq(mealLog.planned, true), gte(mealLog.day, around[0]), lte(mealLog.day, around[around.length - 1])));
  const keep = new Map(existing.filter((e) => e.slot === "dinner" && e.mealId).map((e) => [e.day, e.mealId!]));
  const hasDinner = new Set(existing.filter((e) => e.slot === "dinner").map((e) => e.day));
  const open = days.filter((d) => !hasDinner.has(d));
  if (!open.length) return Response.json({ added: [] });
  const [all, recent] = await Promise.all([listMealsLive(), recentMealIds(from)]);
  const plan = planWeek(all, open, DEFAULT_RULES, { recent, keep });
  const rows = open.filter((d) => plan.has(d)).map((day) => ({ day, slot: "dinner" as const, mealId: plan.get(day)!, planned: true }));
  const added = rows.length ? await db().insert(mealLog).values(rows).returning({ id: mealLog.id }) : [];
  revalidatePath("/labs", "layout");
  return Response.json({ added: added.map((a) => a.id) });
});
