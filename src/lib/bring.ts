import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { findDatabaseUrl } from "../../scripts/database-url.mjs";
import { formatIngredient, type Ingredient } from "@/lib/meal-fields";

// Bring!'s own import: their servers open a public page of ours and read the
// ingredients from its recipe markup, then the app asks which list to add them to.
// Links are signed so only meals opened from inside the app can be read.

function secret() {
  const key = process.env.BRING_SECRET || findDatabaseUrl();
  if (!key) throw new Error("DATABASE_URL is not set");
  return key;
}

function sign(mealId: number) {
  return createHmac("sha256", secret()).update(`bring:${mealId}`).digest("base64url").slice(0, 22);
}

export function bringToken(mealId: number) {
  return `${mealId}-${sign(mealId)}`;
}

/** Returns the meal id, or null when the token was not made by bringToken(). */
export function readBringToken(token: string): number | null {
  const m = token.match(/^(\d{1,9})-([A-Za-z0-9_-]{22})$/);
  if (!m) return null;
  const id = Number(m[1]);
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(m[2]);
  return timingSafeEqual(expected, given) ? id : null;
}

/** Basics like salt or oil are usually at home, so they stay off the shopping list. */
export function bringLines(ingredients: Ingredient[]) {
  return ingredients.filter((i) => !i.staple && i.name.trim()).map((i) => formatIngredient(i));
}
