"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db, users } from "@/db";
import { USER_COOKIE } from "@/lib/users";
import { requireSite } from "@/lib/require-site";

export async function switchUser(id: number) {
  await requireSite();
  const [u] = await db().select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!u) return;
  (await cookies()).set(USER_COOKIE, String(u.id), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
