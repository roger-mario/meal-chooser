import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { collections, db } from "@/db";
import { appRoute, AuthError, requireAppUser } from "@/lib/app-auth";

type Ctx = RouteContext<"/api/app/collections/[id]">;

/** Only your own collections can be changed. */
async function own(request: Request, ctx: Ctx) {
  const me = await requireAppUser(request);
  const id = Number((await ctx.params).id);
  const [c] = Number.isInteger(id) ? await db().select().from(collections).where(and(eq(collections.id, id), eq(collections.userId, me.id))) : [];
  if (!c) throw new AuthError("Collection not found.", 404, "not_found");
  return c;
}

export const PATCH = appRoute(async (request: Request, ctx: Ctx) => {
  const c = await own(request, ctx);
  const input = z.object({ name: z.string().trim().min(1).max(60) }).safeParse(await request.json());
  if (!input.success) throw new AuthError("Give the collection a name.", 400, "bad_request");
  await db().update(collections).set({ name: input.data.name }).where(eq(collections.id, c.id));
  return Response.json({ ok: true });
});

export const DELETE = appRoute(async (request: Request, ctx: Ctx) => {
  const c = await own(request, ctx);
  await db().delete(collections).where(eq(collections.id, c.id));
  return Response.json({ ok: true });
});
