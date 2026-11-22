import { and, eq, gte, lte } from "drizzle-orm";
import { db, mealLog } from "@/db";
import { appRoute, requireAppUser } from "@/lib/app-auth";
import { bringListUrl, originOf } from "@/lib/app-api";
import { todayISO } from "@/lib/dates";
import { addDays, isDay, mergeIngredients } from "@/lib/labs";
import { listMeals } from "@/lib/queries";

/** One shopping list for the planned meals between ?from= and ?to=, plus a Bring! link for it. */
export const GET = appRoute(async (request: Request) => {
  await requireAppUser(request);
  const params = new URL(request.url).searchParams;
  const from = isDay(params.get("from")) ? params.get("from")! : todayISO();
  let to = isDay(params.get("to")) ? params.get("to")! : addDays(from, 6);
  if (to < from || to > addDays(from, 30)) to = addDays(from, 6);
  const rows = await db()
    .select({ mealId: mealLog.mealId })
    .from(mealLog)
    .where(and(eq(mealLog.planned, true), gte(mealLog.day, from), lte(mealLog.day, to)));
  const ids = [...new Set(rows.map((r) => r.mealId).filter((id): id is number => id != null))].slice(0, 30);
  const meals = ids.length ? (await listMeals()).filter((m) => ids.includes(m.id)) : [];
  const lines = mergeIngredients(meals);
  return Response.json({
    from,
    to,
    lines: lines.map((l) => ({ text: l.text, from: l.from })),
    bringUrl: meals.length ? bringListUrl(originOf(request), meals.map((m) => m.id)) : null,
  });
});
