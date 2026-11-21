import { z } from "zod";
import { AuthError, appRoute, createSession, userForAccount, verifyIdToken } from "@/lib/app-auth";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "@/lib/login-limit";

const body = z.object({
  provider: z.enum(["apple", "google", "microsoft"]),
  idToken: z.string().min(20).max(8000),
  /** Apple: the raw nonce whose SHA-256 the app passed to Apple. Google/Microsoft: the nonce, if one was used. */
  nonce: z.string().max(200).optional(),
  inviteCode: z.string().max(40).optional(),
  /** Apple only shares the name on the very first sign-in, and only to the app. */
  name: z.string().trim().max(40).optional(),
});

/** Exchanges a provider ID token for an Otao session token. */
export const POST = appRoute(async (request: Request) => {
  const input = body.safeParse(await request.json());
  if (!input.success) throw new AuthError("Bad request.", 400, "bad_request");
  const ip = clientIp(request.headers);
  if (input.data.inviteCode && (await isLockedOut(ip))) throw new AuthError("Too many tries. Please wait 15 minutes.", 429, "rate_limited");

  const account = await verifyIdToken(input.data.provider, input.data.idToken, input.data.nonce);
  try {
    const user = await userForAccount(account, input.data.inviteCode, input.data.name);
    if (input.data.inviteCode) await clearFailures(ip);
    const token = await createSession(user.id);
    return Response.json({ token, user: { id: user.id, name: user.name } });
  } catch (e) {
    if (e instanceof AuthError && e.code === "invite_invalid") await recordFailure(ip);
    throw e;
  }
});
