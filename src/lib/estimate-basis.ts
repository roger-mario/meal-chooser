import { createHash } from "node:crypto";
import { normalizeIngredients, type Ingredient } from "./meal-fields";

/**
 * A short fingerprint of what an estimate depends on. When the ingredients or servings change
 * afterwards, the stored fingerprint no longer matches and the page asks for a new estimate.
 */
export function estimateBasis(meal: { servings: number; ingredients: (Ingredient | string)[] }) {
  const items = normalizeIngredients(meal.ingredients).map((i) => [
    i.name.trim().toLowerCase(),
    i.variant?.trim().toLowerCase() ?? "",
    i.quantity ?? null,
    i.quantityMax ?? null,
    i.unit ?? "",
  ]);
  return createHash("sha256").update(JSON.stringify([meal.servings, items])).digest("base64url").slice(0, 16);
}

/**
 * True when an AI estimate was made for different ingredients or servings, or before estimates
 * carried a fingerprint (those used an older, less accurate method). Manual values never expire.
 */
export function isOutdated(
  estimate: { basis?: string; source?: string } | null | undefined,
  meal: Parameters<typeof estimateBasis>[0],
) {
  if (!estimate || estimate.source === "manual") return false;
  return estimate.basis !== estimateBasis(meal);
}
