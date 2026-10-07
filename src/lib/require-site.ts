import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, authToken } from "./site-auth";

/**
 * Server actions can be called from any page, including the public share page,
 * so each one checks the site password cookie itself instead of relying on proxy.ts.
 */
export async function requireSite() {
  const password = process.env.APP_PASSWORD;
  if (!password) return;
  if ((await cookies()).get(AUTH_COOKIE)?.value !== (await authToken(password))) {
    throw new Error("Authentication required");
  }
}
