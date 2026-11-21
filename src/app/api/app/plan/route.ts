import { and, asc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, mealLog, meals, users } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";
import { todayISO } from "@/lib/dates";
import { addDays, isDay } from "@/lib/labs";

/** The household's shared plan between ?from= and ?to= (at most 62 days; defaults to today + 6 days). */
export const GET = appRoute(async (request: Request) => {
  await requireAppUser(request);
  const params = new URL(request.url).searchParams;
  const today = todayISO();
  const from = isDay(params.get("from")) ? params.get("from")! : today;
  let to = isDay(params.get("to")) ? params.get("to")! : addDays(from, 6);
  if (to < from) to = from;
  if (to > addDays(from, 61)) to = addDays(from, 61);
  const rows = await db()
    .select({ entry: mealLog, cook: users.name })
    .from(mealLog)
    .leftJoin(users, eq(users.id, mealLog.cookId))
    .where(and(eq(mealLog.planned, true), gte(mealLog.day, from), lte(mealLog.day, to)))
    .orderBy(asc(mealLog.day), asc(mealLog.id));
  const people = await db().select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.id));
  return Response.json({
    today,
    from,
    to,
    entries: rows.map(({ entry: e, cook }) => ({ id: e.id, day: e.day, slot: e.slot, mealId: e.mealId, label: e.label, cookId: e.cookId, cook })),
    people: people.filter((p) => p.name !== "App Review"),
  });
});

const entry = z.object({
  day: z.string().refine(isDay),
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  mealId: z.number().int().positive().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  cookId: z.number().int().positive().nullable().optional(),
});

/** Adds a meal (or a label like "Eating out") to the shared plan. */
export const POST = appRoute(async (request: Request) => {
  await requireAppUser(request);
  const input = entry.safeParse(await request.json());
  if (!input.success || (!input.data.mealId && !input.data.label)) throw new AuthError("Pick a day, a meal time and a recipe.", 400, "bad_request");
  if (input.data.mealId) {
    const [m] = await db().select({ id: meals.id }).from(meals).where(eq(meals.id, input.data.mealId));
    if (!m) throw new AuthError("This recipe doesn't exist any more.", 404, "not_found");
  }
  const [row] = await db()
    .insert(mealLog)
    .values({ day: input.data.day, slot: input.data.slot, mealId: input.data.mealId ?? null, label: input.data.mealId ? null : input.data.label, cookId: input.data.cookId ?? null, planned: true })
    .returning();
  revalidatePath("/labs", "layout");
  return Response.json({ id: row.id });
});
