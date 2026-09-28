import "server-only";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, users, type User } from "@/db";

/** Remembers in this browser who is using the app (there is no login, only the site password). */
export const USER_COOKIE = "meal_user";

export async function listUsers(): Promise<User[]> {
  return db().select().from(users).orderBy(asc(users.id));
}

/** The person picked at the top right, or null if nobody was picked yet in this browser. */
export async function getCurrentUser(): Promise<User | null> {
  const id = Number((await cookies()).get(USER_COOKIE)?.value);
  if (!Number.isInteger(id) || id <= 0) return null;
  const [u] = await db().select().from(users).where(eq(users.id, id));
  return u ?? null;
}
