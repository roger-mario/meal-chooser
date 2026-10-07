"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "@/lib/login-limit";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE, authToken, passwordMatches } from "@/lib/site-auth";

/** Only paths inside this site, so the login can't send people elsewhere. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  // Browsers read "\" like "/", so "/\evil.com" would leave the site too.
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

export async function signIn(_prev: { error?: string } | null, formData: FormData): Promise<{ error?: string } | null> {
  const password = process.env.APP_PASSWORD;
  if (password) {
    const ip = clientIp(await headers());
    if (await isLockedOut(ip)) return { error: "Too many wrong tries. Please wait 15 minutes and try again." };
    if (!(await passwordMatches(String(formData.get("password") ?? ""), password))) {
      await recordFailure(ip);
      return { error: "That's not the right password." };
    }
    await clearFailures(ip);
    (await cookies()).set(AUTH_COOKIE, await authToken(password), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  redirect(safeNext(formData.get("next")));
}
