import "server-only";
import table from "@/data/usda-foods.json";
import type { NutrientKey } from "./nutrients";

// USDA FoodData Central, SR Legacy (public domain): measured nutrients per 100 g for about
// 6,900 foods. Built by scripts/make-food-table.py. A missing value means "not measured", not zero.

type Row = [id: number, description: string, values: (number | null)[]];
const KEYS = table.keys as NutrientKey[];
const FOODS = table.foods as Row[];

export type Food = { id: number; description: string; per100g: Partial<Record<NutrientKey, number>> };

function toFood([id, raw, values]: Row): Food {
  const description = raw.replace(/\s*\(includes [^)]*\)/i, "");
  const per100g: Food["per100g"] = {};
  values.forEach((v, i) => {
    if (v != null) per100g[KEYS[i]] = v;
  });
  return { id, description, per100g };
}

const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9%-]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1)
    .map(stem);

let index: { row: Row; words: Set<string>; first: string; size: number }[] | null = null;
function getIndex() {
  index ??= FOODS.map((row) => {
    const w = words(row[1].replace(/\(includes [^)]*\)/i, ""));
    return { row, words: new Set(w), first: w[0] ?? "", size: w.length };
  });
  return index;
}

/**
 * Foods whose description best matches the search words: most words matched (a description
 * that starts with the first search word counts extra, "Oats" before "Oil, oat"), then the shortest.
 */
export function searchFoods(query: string, limit = 12): Food[] {
  const q = [...new Set(words(query))];
  if (!q.length) return [];
  return getIndex()
    .map((f) => ({ f, hits: q.filter((w) => f.words.has(w)).length + (f.first === q[0] ? 1 : 0) }))
    .filter((x) => x.hits >= Math.max(1, Math.ceil(q.length / 2)))
    .sort((a, b) => b.hits - a.hits || a.f.size - b.f.size)
    .slice(0, limit)
    .map((x) => toFood(x.f.row));
}

export function getFood(id: number): Food | null {
  const row = FOODS.find((r) => r[0] === id);
  return row ? toFood(row) : null;
}

export const FOOD_TABLE_SOURCE = table.source;
