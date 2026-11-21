import { z } from "zod";
import { AuthError, appRoute, createSession, reviewUser } from "@/lib/app-auth";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "@/lib/login-limit";

/** Sign-in for App Review with the code from APP_REVIEW_CODE (given to Apple in App Store Connect). */
export const POST = appRoute(async (request: Request) => {
  const input = z.object({ code: z.string().min(1).max(200) }).safeParse(await request.json());
  if (!input.success) throw new AuthError("Bad request.", 400, "bad_request");
  const ip = clientIp(request.headers);
  if (await isLockedOut(ip)) throw new AuthError("Too many tries. Please wait 15 minutes.", 429, "rate_limited");
  try {
    const user = await reviewUser(input.data.code);
    await clearFailures(ip);
    return Response.json({ token: await createSession(user.id), user: { id: user.id, name: user.name } });
  } catch (e) {
    if (e instanceof AuthError && e.status === 401) await recordFailure(ip);
    throw e;
  }
});
