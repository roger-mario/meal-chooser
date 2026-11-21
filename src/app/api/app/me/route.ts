import { eq } from "drizzle-orm";
import { db, userIdentities } from "@/db";
import { appRoute, deleteAccount, requireAppUser } from "@/lib/app-auth";

export const GET = appRoute(async (request: Request) => {
  const user = await requireAppUser(request);
  const accounts = await db().select({ provider: userIdentities.provider, email: userIdentities.email }).from(userIdentities).where(eq(userIdentities.userId, user.id));
  return Response.json({ user: { id: user.id, name: user.name }, accounts });
});

/** "Delete my account" from the You tab. */
export const DELETE = appRoute(async (request: Request) => {
  const user = await requireAppUser(request);
  await deleteAccount(user);
  return Response.json({ ok: true });
});
