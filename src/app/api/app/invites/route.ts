import { appRoute, createInvite, requireAppUser } from "@/lib/app-auth";

/** A signed-in person creates a one-time invite code for a friend. */
export const POST = appRoute(async (request: Request) => {
  const user = await requireAppUser(request);
  if (user.name === "App Review") return Response.json({ error: "Invites are turned off for the review account.", code: "forbidden" }, { status: 403 });
  const invite = await createInvite(user.id);
  return Response.json({ code: invite.code, expiresAt: invite.expiresAt.toISOString() });
});
