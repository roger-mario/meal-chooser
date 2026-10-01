"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE, authToken } from "@/lib/site-auth";

/** Only paths inside this site, so the login can't send people elsewhere. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_prev: { error?: string } | null, formData: FormData): Promise<{ error?: string } | null> {
  const password = process.env.APP_PASSWORD;
  if (password && formData.get("password") !== password) return { error: "That's not the right password." };
  if (password) {
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
