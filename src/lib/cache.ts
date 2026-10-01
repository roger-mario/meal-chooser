import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Lists (meals, categories, people, counts) are kept in Vercel's data cache, so opening the app
 * doesn't have to wait for the database to wake up. Every write calls `dataChanged()`.
 */
const DATA_TAG = "otao-data";

// A new deployment may change the shape of the data, so it starts with an empty cache.
const VERSION = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

/** Cached data comes back as JSON, so dates (fields ending in "At") are turned back into Dates. */
function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        k.endsWith("At") && typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v) : reviveDates(v),
      ]),
    ) as T;
  }
  return value;
}

export function cached<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  // The hour is only a safety net for changes made outside the app; writes here clear it at once.
  const run = unstable_cache(fn, [name, VERSION], { tags: [DATA_TAG], revalidate: 3600 });
  return async (...args) => reviveDates(await run(...args));
}

/** Call after any write to meals, categories, people or chat messages. */
export function dataChanged() {
  revalidateTag(DATA_TAG, { expire: 0 });
}
