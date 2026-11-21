import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, mealLog } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";

type Ctx = RouteContext<"/api/app/plan/[id]">;

async function plannedId(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  const [row] = Number.isInteger(id) ? await db().select({ id: mealLog.id }).from(mealLog).where(and(eq(mealLog.id, id), eq(mealLog.planned, true))) : [];
  if (!row) throw new AuthError("Not in the plan any more.", 404, "not_found");
  return row.id;
}

/** Body: { cookId } — who cooks this one (null = nobody yet). */
export const PATCH = appRoute(async (request: Request, ctx: Ctx) => {
  await requireAppUser(request);
  const input = z.object({ cookId: z.number().int().positive().nullable() }).safeParse(await request.json());
  if (!input.success) throw new AuthError("Bad request.", 400, "bad_request");
  await db().update(mealLog).set({ cookId: input.data.cookId }).where(eq(mealLog.id, await plannedId(ctx)));
  revalidatePath("/labs", "layout");
  return Response.json({ ok: true });
});

export const DELETE = appRoute(async (request: Request, ctx: Ctx) => {
  await requireAppUser(request);
  await db().delete(mealLog).where(eq(mealLog.id, await plannedId(ctx)));
  revalidatePath("/labs", "layout");
  return Response.json({ ok: true });
});
