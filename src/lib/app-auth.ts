import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { appInvites, appSessions, collections, db, mealFavourites, mealViews, userIdentities, users, type AuthProvider, type User } from "@/db";
import { dataChanged } from "./cache";

/**
 * Sign-in for the phone app. The app gets an ID token from Apple, Google or Microsoft, we check its
 * signature and audience here, and hand out our own random session token. Configure with:
 *   APPLE_BUNDLE_IDS      comma-separated iOS bundle ids (audience of Apple ID tokens)
 *   GOOGLE_CLIENT_IDS     comma-separated OAuth client ids (iOS, Android, web)
 *   MICROSOFT_CLIENT_ID   the Entra app registration's client id
 *   APP_ALLOWED_EMAILS    "roger@example.com=Roger,gabi@example.com=Gabriela": these accounts join
 *                         the named person without an invite code
 *   APP_REVIEW_CODE       optional; lets App Review sign in as the "App Review" person
 */

const SESSION_DAYS = 180;
/** Personal Microsoft accounts (outlook.com, hotmail.com …); their email addresses are verified by Microsoft. */
const MICROSOFT_CONSUMER_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";

const jwks = {
  apple: createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),
  google: createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")),
  microsoft: createRemoteJWKSet(new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys")),
};

const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
    readonly code = "unauthorized",
  ) {
    super(message);
  }
}

export type VerifiedAccount = {
  provider: Exclude<AuthProvider, "review">;
  subject: string;
  email: string | null;
  /** True when the provider vouches that this person owns the email address. */
  emailVerified: boolean;
  name: string | null;
};

/** Checks an ID token from the given provider and returns who it belongs to. Throws AuthError. */
export async function verifyIdToken(provider: string, idToken: string, nonce?: string): Promise<VerifiedAccount> {
  try {
    if (provider === "apple") {
      const audience = list(process.env.APPLE_BUNDLE_IDS);
      if (!audience.length) throw new AuthError("Apple sign-in is not set up.", 503, "not_configured");
      const { payload } = await jwtVerify(idToken, jwks.apple, { issuer: "https://appleid.apple.com", audience });
      // The app sends Apple the SHA-256 of a random nonce and us the nonce itself, so a token can't be replayed.
      if (!nonce || payload.nonce !== sha256(nonce)) throw new AuthError("The sign-in could not be confirmed. Please try again.");
      return { provider, subject: payload.sub!, email: str(payload.email), emailVerified: truthy(payload.email_verified), name: null };
    }
    if (provider === "google") {
      const audience = list(process.env.GOOGLE_CLIENT_IDS);
      if (!audience.length) throw new AuthError("Google sign-in is not set up.", 503, "not_configured");
      const { payload } = await jwtVerify(idToken, jwks.google, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience });
      if (nonce && payload.nonce !== nonce) throw new AuthError("The sign-in could not be confirmed. Please try again.");
      return { provider, subject: payload.sub!, email: str(payload.email), emailVerified: truthy(payload.email_verified), name: str(payload.given_name) ?? str(payload.name) };
    }
    if (provider === "microsoft") {
      const audience = process.env.MICROSOFT_CLIENT_ID;
      if (!audience) throw new AuthError("Microsoft sign-in is not set up.", 503, "not_configured");
      const { payload } = await jwtVerify(idToken, jwks.microsoft, { audience });
      // Microsoft's keys are shared by every tenant, so the issuer must match the token's own tenant.
      const tid = str(payload.tid);
      if (!tid || payload.iss !== `https://login.microsoftonline.com/${tid}/v2.0`) throw new AuthError("This Microsoft account can't be used.");
      if (nonce && payload.nonce !== nonce) throw new AuthError("The sign-in could not be confirmed. Please try again.");
      const email = str(payload.email) ?? str(payload.preferred_username);
      // Work accounts can set any email without proving it, so only personal accounts count as verified.
      return { provider, subject: `${tid}:${payload.sub}`, email, emailVerified: tid === MICROSOFT_CONSUMER_TENANT, name: str(payload.given_name) ?? str(payload.name) };
    }
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError("The sign-in could not be confirmed. Please try again.");
  }
  throw new AuthError("Unknown sign-in provider.", 400, "bad_request");
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function truthy(v: JWTPayload[string]) {
  return v === true || v === "true";
}

/** The person an allow-listed, verified email belongs to (APP_ALLOWED_EMAILS), by name. */
function allowedName(account: VerifiedAccount): string | null {
  if (!account.email || !account.emailVerified) return null;
  const email = account.email.toLowerCase();
  for (const entry of list(process.env.APP_ALLOWED_EMAILS)) {
    const [mail, name] = entry.split("=").map((s) => s.trim());
    if (mail?.toLowerCase() === email && name) return name;
  }
  return null;
}

async function findOrCreateUser(name: string): Promise<User> {
  const existing = await db().select().from(users).where(eq(users.name, name));
  if (existing[0]) return existing[0];
  const [created] = await db().insert(users).values({ name }).onConflictDoNothing().returning();
  dataChanged();
  return created ?? (await db().select().from(users).where(eq(users.name, name)))[0];
}

/** A free display name, e.g. "Lena" or "Lena 2" when a Lena already exists. */
async function freeName(wanted: string): Promise<string> {
  const base = wanted.slice(0, 40) || "Friend";
  for (let i = 1; i < 100; i++) {
    const name = i === 1 ? base : `${base} ${i}`;
    const taken = await db().select({ id: users.id }).from(users).where(eq(users.name, name));
    if (!taken.length) return name;
  }
  return `${base} ${randomBytes(2).toString("hex")}`;
}

/**
 * Finds the person for a verified account, linking it the first time. New accounts need an
 * allow-listed email or a valid invite code; otherwise this throws an AuthError with code "invite_required".
 */
export async function userForAccount(account: VerifiedAccount, inviteCode?: string, displayName?: string): Promise<User> {
  const linked = await db()
    .select({ user: users })
    .from(userIdentities)
    .innerJoin(users, eq(users.id, userIdentities.userId))
    .where(and(eq(userIdentities.provider, account.provider), eq(userIdentities.subject, account.subject)));
  if (linked[0]) {
    await db().update(userIdentities).set({ lastSignInAt: new Date() }).where(and(eq(userIdentities.provider, account.provider), eq(userIdentities.subject, account.subject)));
    return linked[0].user;
  }

  let user: User | null = null;
  const allowed = allowedName(account);
  if (allowed) user = await findOrCreateUser(allowed);
  else if (inviteCode) user = await redeemInvite(inviteCode, displayName || account.name || account.email?.split("@")[0] || "Friend");
  if (!user) throw new AuthError("Otao is invite-only for now. Ask a friend for an invite code.", 403, "invite_required");

  await db()
    .insert(userIdentities)
    .values({ userId: user.id, provider: account.provider, subject: account.subject, email: account.email })
    .onConflictDoNothing();
  return user;
}

async function redeemInvite(rawCode: string, name: string): Promise<User | null> {
  const code = normalizeInviteCode(rawCode);
  // Claim the code atomically so two devices can't use it at once.
  const [invite] = await db()
    .update(appInvites)
    .set({ usedAt: new Date() })
    .where(and(eq(appInvites.code, code), isNull(appInvites.usedAt), gt(appInvites.expiresAt, new Date())))
    .returning();
  if (!invite) throw new AuthError("That invite code is not valid or was already used.", 403, "invite_invalid");
  try {
    const user = invite.forUserId
      ? ((await db().select().from(users).where(eq(users.id, invite.forUserId)))[0] ?? null)
      : await findOrCreateUser(await freeName(name));
    if (!user) throw new AuthError("That invite code is not valid any more.", 403, "invite_invalid");
    await db().update(appInvites).set({ usedBy: user.id }).where(eq(appInvites.code, code));
    return user;
  } catch (e) {
    // Give the code back, so a failed sign-in doesn't waste the invite.
    await db().update(appInvites).set({ usedAt: null }).where(eq(appInvites.code, code));
    throw e;
  }
}

export function normalizeInviteCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Creates a one-time invite code that is valid for 14 days. */
export async function createInvite(createdBy: number, forUserId?: number): Promise<{ code: string; expiresAt: Date }> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
  const bytes = randomBytes(8);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const expiresAt = new Date(Date.now() + 14 * 86400_000);
  await db().insert(appInvites).values({ code, createdBy, forUserId: forUserId ?? null, expiresAt });
  return { code, expiresAt };
}

/** Lets App Review sign in with a shared code (APP_REVIEW_CODE), as a separate "App Review" person. */
export async function reviewUser(code: string): Promise<User> {
  const expected = process.env.APP_REVIEW_CODE;
  if (!expected || expected.length < 8) throw new AuthError("Review sign-in is turned off.", 403, "forbidden");
  const a = createHash("sha256").update(code).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) throw new AuthError("Wrong review code.");
  return findOrCreateUser("App Review");
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db()
    .insert(appSessions)
    .values({ tokenHash: sha256(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000) });
  return token;
}

function bearer(request: Request) {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

/** The signed-in app user for this request. Throws AuthError when the token is missing, wrong or expired. */
export async function requireAppUser(request: Request): Promise<User> {
  const token = bearer(request);
  if (!token) throw new AuthError("Please sign in.");
  const rows = await db()
    .select({ session: appSessions, user: users })
    .from(appSessions)
    .innerJoin(users, eq(users.id, appSessions.userId))
    .where(and(eq(appSessions.tokenHash, sha256(token)), gt(appSessions.expiresAt, new Date())));
  const row = rows[0];
  if (!row) throw new AuthError("Your sign-in has expired. Please sign in again.");
  // Sliding expiry, written at most once a day.
  if (Date.now() - row.session.lastUsedAt.getTime() > 86400_000) {
    await db()
      .update(appSessions)
      .set({ lastUsedAt: new Date(), expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000) })
      .where(eq(appSessions.id, row.session.id));
  }
  return row.user;
}

export async function endSession(request: Request) {
  const token = bearer(request);
  if (token) await db().delete(appSessions).where(eq(appSessions.tokenHash, sha256(token)));
}

/**
 * "Delete my account" (required by the App Store). Household members on APP_ALLOWED_EMAILS keep their
 * person, because the web app and shared recipes use it; only their sign-ins, sessions and private
 * lists go. Anyone else is removed completely (their recipes stay for the household, without an author).
 */
export async function deleteAccount(user: User) {
  const household = list(process.env.APP_ALLOWED_EMAILS).some((e) => e.split("=")[1]?.trim() === user.name);
  await db().delete(appSessions).where(eq(appSessions.userId, user.id));
  await db().delete(userIdentities).where(eq(userIdentities.userId, user.id));
  await db().delete(collections).where(eq(collections.userId, user.id));
  await db().delete(mealFavourites).where(eq(mealFavourites.userId, user.id));
  await db().delete(mealViews).where(eq(mealViews.userId, user.id));
  if (!household) await db().delete(users).where(eq(users.id, user.id));
  dataChanged();
}

/** Wraps an app route: turns AuthError and bad JSON into clean JSON errors. */
export function appRoute<C>(handler: (request: Request, ctx: C) => Promise<Response>) {
  return async (request: Request, ctx: C) => {
    try {
      return await handler(request, ctx);
    } catch (e) {
      if (e instanceof AuthError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
      if (e instanceof SyntaxError) return Response.json({ error: "Bad request.", code: "bad_request" }, { status: 400 });
      console.error(e);
      return Response.json({ error: "Something went wrong.", code: "server_error" }, { status: 500 });
    }
  };
}
