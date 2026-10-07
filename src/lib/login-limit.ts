import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, loginFailures } from "@/db";

// After this many wrong passwords from one address, sign-in pauses until the window has passed.
const MAX_FAILURES = 10;
const WINDOW = sql`now() - interval '15 minutes'`;

/** The visitor's address as Vercel reports it. */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") || headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** True while this address has used up its attempts. Fails open, so a database hiccup never locks people out. */
export async function isLockedOut(ip: string): Promise<boolean> {
  try {
    const [row] = await db()
      .select({ count: loginFailures.count })
      .from(loginFailures)
      .where(and(eq(loginFailures.ip, ip), gt(loginFailures.windowStart, WINDOW)));
    return (row?.count ?? 0) >= MAX_FAILURES;
  } catch (e) {
    console.error("Login limit check failed", e);
    return false;
  }
}

export async function recordFailure(ip: string) {
  try {
    await db()
      .insert(loginFailures)
      .values({ ip, count: 1 })
      .onConflictDoUpdate({
        target: loginFailures.ip,
        set: {
          count: sql`case when ${loginFailures.windowStart} > ${WINDOW} then ${loginFailures.count} + 1 else 1 end`,
          windowStart: sql`case when ${loginFailures.windowStart} > ${WINDOW} then ${loginFailures.windowStart} else now() end`,
        },
      });
  } catch (e) {
    console.error("Login limit update failed", e);
  }
}

export async function clearFailures(ip: string) {
  await db().delete(loginFailures).where(eq(loginFailures.ip, ip)).catch(() => {});
}
