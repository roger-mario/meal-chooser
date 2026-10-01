import "server-only";
import { asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, users, type User } from "@/db";
import { cached } from "./cache";

/** Remembers in this browser who is using the app (there is no login, only the site password). */
export const USER_COOKIE = "meal_user";

export const listUsers = cached("users", async (): Promise<User[]> => db().select().from(users).orderBy(asc(users.id)));

/** The person picked at the top right, or null if nobody was picked yet in this browser. */
export async function getCurrentUser(): Promise<User | null> {
  const id = Number((await cookies()).get(USER_COOKIE)?.value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return (await listUsers()).find((u) => u.id === id) ?? null;
}
