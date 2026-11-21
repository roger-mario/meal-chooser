import "server-only";
import { bringListToken, bringToken } from "./bring";
import { COST_STORE, costPerServing, costTotal } from "./cost";
import { mealHealth } from "./health";
import { formatIngredient, ingredientName, totalMinutes } from "./meal-fields";
import { NUTRIENTS, POORLY_TABULATED } from "./nutrients";
import type { MealWithCategories } from "./queries";

/** JSON shapes the phone app reads. Keep them backwards compatible: older app versions stay installed for a while. */

export function absoluteUrl(origin: string, url: string | null) {
  if (!url) return null;
  return url.startsWith("/") ? origin + url : url;
}

export function mealSummary(m: MealWithCategories, origin: string, meId: number) {
  const health = mealHealth(m.nutrition);
  return {
    id: m.id,
    name: m.name,
    imageUrl: absoluteUrl(origin, m.imageUrl),
    minutes: totalMinutes(m),
    servings: m.servings,
    score: health?.score ?? null,
    scoreLabel: health?.label ?? null,
    kcal: m.nutrition?.perServing.calories != null ? Math.round(m.nutrition.perServing.calories) : null,
    author: m.author?.name ?? null,
    mine: m.author?.id === meId,
    babyFriendly: m.babyFriendly,
    diet: m.diet,
    categories: m.categories.map((c) => c.name),
    /** Ingredient names without basics like salt and oil, for "what's at home" matching. */
    ingredients: m.ingredients.filter((i) => !i.staple && i.name.trim()).map((i) => ingredientName(i)),
    /** Rough cost of one serving in CHF, from the saved price estimate. */
    costPerServing: money(costPerServing(m.cost, m.servings)),
  };
}

const money = (v: number | null) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 20) / 20);

const round = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

export function mealDetail(m: MealWithCategories, origin: string, meId: number) {
  const health = mealHealth(m.nutrition);
  const per = m.nutrition?.perServing;
  const micros = per
    ? NUTRIENTS.filter((n) => (n.group === "vitamins" || n.group === "minerals") && !POORLY_TABULATED.has(n.key) && per[n.key] != null)
        .map((n) => ({
          key: n.key,
          label: n.label.replace(/ \(.*\)$/, ""),
          amount: round(per[n.key]!),
          unit: n.unit,
          pct: "dailyValue" in n ? Math.round((per[n.key]! / n.dailyValue) * 100) : null,
          limit: n.key === "sodium",
        }))
        .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
    : [];
  const bring = new URLSearchParams({ url: `${origin}/api/bring/${bringToken(m.id)}`, source: "web", baseQuantity: String(m.servings), requestedQuantity: String(m.servings) });
  return {
    ...mealSummary(m, origin, meId),
    description: m.description,
    ingredientLines: m.ingredients.filter((i) => i.name.trim()).map((i) => ({ text: formatIngredient(i), name: ingredientName(i), staple: !!i.staple })),
    steps: m.steps,
    links: m.links.map((l) => ({ url: l.url, label: l.label ?? null, video: /youtu|vimeo|instagram|tiktok/i.test(l.url) })),
    nutrition: per
      ? {
          kcal: per.calories != null ? Math.round(per.calories) : null,
          protein: per.protein != null ? round(per.protein) : null,
          carbs: per.carbohydrates != null ? round(per.carbohydrates) : null,
          fat: per.fat != null ? round(per.fat) : null,
          fiber: per.fiber != null ? round(per.fiber) : null,
          micros,
          estimated: m.nutrition?.source !== "manual",
        }
      : null,
    health: health ? { score: health.score, label: health.label, parts: health.parts, badges: health.badges.map((b) => ({ label: b.label, tone: b.tone, detail: b.detail })) } : null,
    bringUrl: `https://api.getbring.com/rest/bringrecipes/deeplink?${bring}`,
    cost: m.cost?.items.length
      ? {
          currency: "CHF",
          total: money(costTotal(m.cost)),
          perServing: money(costPerServing(m.cost, m.servings)),
          store: m.cost.store || COST_STORE,
          estimated: m.cost.source !== "manual",
          items: m.cost.items.map((i) => ({ name: i.name, chf: money(i.chf) })),
        }
      : null,
  };
}

export function bringListUrl(origin: string, mealIds: number[]) {
  const params = new URLSearchParams({ url: `${origin}/api/bring/list/${bringListToken(mealIds)}`, source: "web", baseQuantity: "1", requestedQuantity: "1" });
  return `https://api.getbring.com/rest/bringrecipes/deeplink?${params}`;
}

export const originOf = (request: Request) => new URL(request.url).origin;
