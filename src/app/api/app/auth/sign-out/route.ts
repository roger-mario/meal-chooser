import { appRoute, endSession } from "@/lib/app-auth";

export const POST = appRoute(async (request: Request) => {
  await endSession(request);
  return Response.json({ ok: true });
});
