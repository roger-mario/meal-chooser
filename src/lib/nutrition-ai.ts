import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { NUTRIENTS, POORLY_TABULATED, type IngredientNutrition, type NutrientKey, type NutritionEstimate } from "./nutrients";
import { estimateBasis } from "./estimate-basis";
import { getFood, searchFoods, type Food } from "./food-table";
import type { Meal } from "@/db/schema";
import { formatIngredient, normalizeIngredients, normalizeSteps, type Ingredient } from "./meal-fields";

// How an estimate is made:
// 1. The AI reads the recipe: grams of each ingredient (dry/raw, as listed) and English search
//    words for the matching food in the USDA food table. A mix ("frozen berries") can be split into parts.
// 2. Otao searches the USDA table and the AI picks the right entry for each part from the matches.
//    Only when nothing fits does it give its own values per 100 g.
// 3. Otao does all the maths: USDA values × grams, cooking losses, per serving.
// So the nutrient values come from measured food data, not from the AI's memory.

const KEYS = NUTRIENTS.map((n) => n.key).filter((k) => !POORLY_TABULATED.has(k)) as [NutrientKey, ...NutrientKey[]];
const UNIT_LIST = NUTRIENTS.filter((n) => KEYS.includes(n.key)).map((n) => `${n.key} (${n.unit})`).join(", ");

const readSchema = z.object({
  ingredients: z.array(
    z.object({
      line: z.number().int().describe("The recipe line number this ingredient comes from"),
      name: z.string().describe("Ingredient name as given in the recipe"),
      grams: z
        .number()
        .min(0)
        .describe("Grams in the WHOLE recipe (all servings), weighed as listed: dry for rice/pasta/oats, raw for meat/fish/veg"),
      state: z.enum(["raw", "dry", "as sold"]).describe("raw (fresh produce, meat, fish, eggs), dry (uncooked grains, pasta, legumes, flakes), as sold (cheese, sauces, canned, drinks, powders)"),
      cooked: z.boolean().describe("Whether the recipe heats this ingredient"),
      plant: z.boolean().describe("A plant food: vegetable, fruit, grain, legume, nut, seed, herb or spice"),
      processing: z
        .enum(["whole", "processed", "ultra"])
        .describe("whole: unprocessed or minimally processed; processed: cheese, bread, canned, cured; ultra: sausages, pepperoni, sweets, protein powder, instant products"),
      parts: z
        .array(
          z.object({
            search: z.string().describe("English words to find the food in the USDA SR Legacy table, in its wording and state, e.g. 'rice white long-grain raw', 'chicken breast skinless boneless raw', 'raspberries frozen unsweetened'"),
            share: z.number().min(0).max(1).describe("Share of this ingredient's grams; 1 unless it's a mix"),
          }),
        )
        .min(1)
        .describe("Usually one part. Split mixes into their usual components, e.g. frozen mixed berries → strawberries, raspberries, blueberries, blackberries"),
    }),
  ),
  confidence: z.enum(["low", "medium", "high"]).describe("How reliable the amounts are given the recipe detail"),
});

const pickSchema = z.object({
  picks: z.array(
    z.object({
      part: z.number().int().describe("The part number"),
      foodId: z.number().int().describe("The id of the best matching food, or 0 when none of them is the same food in the same state"),
      per100g: z
        .array(z.object({ key: z.enum(KEYS), value: z.number().min(0) }))
        .optional()
        .describe("Only when foodId is 0: nutrients per 100 g from food composition tables"),
    }),
  ),
});

// Usual weights, so every estimate converts kitchen units the same way.
const CONVERSIONS = [
  "1 cup dry rice ≈ 185 g, 1 cup dry pasta ≈ 100 g, 1 cup oats ≈ 80 g, 1 cup flour ≈ 125 g, 1 cup frozen peas ≈ 135 g,",
  "1 cup berries ≈ 145 g, 1 cup milk/kefir ≈ 245 g; 1 tbsp oil ≈ 13 g, 1 tbsp chia ≈ 12 g, 1 tsp salt ≈ 6 g, 1 tsp spice ≈ 2.5 g;",
  "1 egg ≈ 50 g, 1 medium onion ≈ 110 g, 1 carrot ≈ 60 g, 1 bell pepper ≈ 120 g, 1 banana ≈ 118 g, 1 spring onion ≈ 15 g,",
  "1 mushroom ≈ 18 g, 1 walnut (kernel) ≈ 5 g, 1 garlic clove ≈ 4 g; 1 can tomatoes/sauce ≈ 400 g, 1 can corn or beans ≈ 285 g",
  "drained (a half can ≈ 140 g); a pack/bunch of cherry tomatoes ≈ 250 g, a bunch of herbs ≈ 30 g; a slice of butter ≈ 10 g.",
].join("\n");

// Share of heat-sensitive vitamins left after ordinary cooking (USDA retention factors, rounded).
const RETENTION: Partial<Record<NutrientKey, number>> = {
  vitaminC: 0.7,
  folate: 0.7,
  thiamin: 0.75,
  vitaminB6: 0.8,
  riboflavin: 0.9,
  pantothenicAcid: 0.85,
};

// Grains, pasta and pulses are weighed dry. Dry they have about 330–380 kcal per 100 g, cooked
// only 110–160; values that low next to a dry weight mean cooked values were used by mistake.
const DRY_STAPLE = /\b(rice|reis|pasta|spaghetti|penne|rotini|fusilli|noodle|nudel|oat|hafer|quinoa|couscous|bulgur|lentil|linsen|polenta|barley|gerste|millet|hirse|flour|mehl)/i;

// Highest plausible amount per 100 g of any ordinary food, as a multiple of the daily value.
// Only used for the AI's own values; anything above is almost certainly a unit mix-up.
const MAX_DV_PER_100G = 40;

function plausible(key: NutrientKey, value: number) {
  const def = NUTRIENTS.find((n) => n.key === key)!;
  if (!Number.isFinite(value) || value < 0) return false;
  if (def.group === "macros" || def.group === "fats") return value <= 100;
  if (key === "calories") return value <= 900;
  return !("dailyValue" in def) || value <= def.dailyValue * MAX_DV_PER_100G;
}

// Grams per ml for the liquids where it matters; everything else ≈ water.
const DENSITY: [RegExp, number][] = [
  [/\b(oil|öl|olivenöl)\b/i, 0.92],
  [/\b(honey|honig|syrup|sirup)\b/i, 1.4],
  [/\b(milk|milch|kefir|yog|joghurt|cream|rahm|sahne)/i, 1.03],
];

// Usual weight of one piece, for the pieces where the AI's guesses drift.
const PIECE: [RegExp, number][] = [
  [/\b(eggs?|eier?)\b/i, 50],
  [/\b(bananas?|bananen?)\b/i, 118],
  [/\b(walnuts?|baumnüsse?)\b/i, 5],
  [/\b(bell peppers?|peperoni|paprika)\b/i, 120],
];

/** Grams for an amount in g, kg, ml, l or a common piece (midpoint of a range), or null when the AI should weigh it. */
export function knownGrams(i: Ingredient | undefined): number | null {
  if (!i?.quantity) return null;
  const q = i.quantityMax ? (i.quantity + i.quantityMax) / 2 : i.quantity;
  const density = DENSITY.find(([re]) => re.test(i.name))?.[1] ?? 1;
  switch (i.unit) {
    case "g": return q;
    case "kg": return q * 1000;
    case "ml": return q * density;
    case "l": return q * 1000 * density;
    case "pcs": {
      const piece = PIECE.find(([re]) => re.test(i.name))?.[1];
      return piece ? q * piece : null;
    }
    default: return null;
  }
}

function round(v: number) {
  return v >= 100 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

type Read = z.infer<typeof readSchema> & { assumptions?: string[] };
type Part = { ingredient: number; search: string; share: number; candidates: Food[] };
/** What each ingredient part was matched to: a USDA food, or the AI's own values. */
export type Resolved = { food: Food | null; per100g: Partial<Record<NutrientKey, number>> };

export async function estimateNutrition(meal: Meal): Promise<NutritionEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const servings = Math.max(1, meal.servings);
  const ingredients = normalizeIngredients(meal.ingredients);
  if (ingredients.length === 0) throw new Error("Add ingredients to the meal first.");
  const steps = normalizeSteps(meal.steps, meal.instructions);

  // 1. Amounts and what to look up.
  const { output: read } = await generateText({
    model,
    output: Output.object({ schema: readSchema }),
    system: "You are a registered dietitian who knows the USDA FoodData Central tables well.",
    prompt: [
      `Recipe: ${meal.name} (the whole recipe makes ${servings} serving${servings === 1 ? "" : "s"})`,
      "Ingredients for the WHOLE recipe (use exactly these amounts, even if the steps or a source say otherwise):",
      ingredients.map((i, n) => `${n + 1}. ${formatIngredient(i)}`).join("\n"),
      steps.length ? `Steps (only for how things are cooked):\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
      "",
      "An amount like 600–700 g is a range: use its midpoint. Text in brackets after a name is the kind, cut or variety",
      "(chicken (breast), rice (jasmine)). Products are bought in Switzerland.",
      "grams: weigh rice, pasta, oats and pulses DRY and meat, fish, eggs and vegetables RAW. Convert kitchen units with:",
      CONVERSIONS,
      "Amounts in g, kg, ml and l are weighed by Otao; For water use 0 g. For frying oil, count only what is absorbed/eaten. 'To taste' means a small realistic amount.",
      "parts.search: words for the USDA SR Legacy entry in the same state as the grams (raw/dry/as sold, never cooked",
      "for a dry or raw weight). Use the closest standard food when a variety isn't in the table (jasmine rice → rice white",
      "long-grain raw). Split a mixed ingredient into its usual components with shares that add up to 1.",
    ]
      .filter(Boolean)
      .join("\n"),
    temperature: 0,
  });

  // Amounts in g, kg, ml or l and common pieces are weighed here, not by the AI, which sometimes mixes up the units.
  // The AI's own assumptions tend to ramble or describe conversions that were overridden here, so
  // the list shown is written in code: the amounts the AI weighed and how mixes were split.
  const assumed: string[] = [];
  for (const ing of read.ingredients) {
    const line = ingredients[ing.line - 1];
    const grams = knownGrams(line);
    if (grams !== null) ing.grams = grams;
    else if (line) assumed.push(`${formatIngredient(line)} ≈ ${Math.round(ing.grams)} g`);
    if (ing.parts.length > 1) {
      const total = ing.parts.reduce((s, p) => s + p.share, 0) || 1;
      const split = ing.parts.map((p) => `${p.search} ${Math.round((p.share / total) * 100)}%`).join(", ");
      assumed.push(`${ing.name} split into ${split}`);
    }
  }

  // 2. Find the foods and let the AI pick.
  const parts: Part[] = read.ingredients.flatMap((ing, i) => {
    const total = ing.parts.reduce((s, p) => s + p.share, 0) || 1;
    return ing.parts.map((p) => ({ ingredient: i, search: p.search, share: p.share / total, candidates: searchFoods(p.search) }));
  });
  const { output: picked } = await generateText({
    model,
    output: Output.object({ schema: pickSchema }),
    system: "You are a registered dietitian who knows the USDA FoodData Central tables well.",
    prompt: [
      "Pick the USDA food that matches each part below: the same food, in the same state (raw, dry or as sold).",
      "Prefer plain, unsweetened, unsalted, unbranded entries unless the part says otherwise.",
      "If no candidate fits, use foodId 0 and give per100g from food composition tables instead.",
      `Units per 100 g: ${UNIT_LIST}. Vitamin A µg RAE, vitamin D µg, folate µg DFE, omega3 = ALA+EPA+DHA in g.`,
      "",
      parts
        .map((p, n) => {
          const ing = read.ingredients[p.ingredient];
          const list = p.candidates.map((c) => `   ${c.id}: ${c.description}`).join("\n") || "   (no matches)";
          return `Part ${n + 1}: ${ing.name}, ${ing.state} ("${p.search}")\n${list}`;
        })
        .join("\n"),
    ].join("\n"),
    temperature: 0,
  });

  const resolved: Resolved[] = parts.map((p, n) => {
    const pick = picked.picks.find((x) => x.part === n + 1);
    const food = pick?.foodId ? (p.candidates.find((c) => c.id === pick.foodId) ?? getFood(pick.foodId)) : null;
    if (food) return { food, per100g: food.per100g };
    const own: Resolved["per100g"] = {};
    for (const { key, value } of pick?.per100g ?? []) if (plausible(key, value)) own[key] = value;
    return { food: null, per100g: own };
  });

  return { ...computeNutrition({ ...read, assumptions: assumed }, parts, resolved, servings, model), basis: estimateBasis(meal) };
}

/** Adds up the ingredients and divides by the servings. Exported for testing. */
export function computeNutrition(
  read: Read,
  parts: { ingredient: number; share: number }[],
  resolved: Resolved[],
  servings: number,
  model?: string,
): NutritionEstimate {
  const totals: Partial<Record<NutrientKey, number>> = {};
  const assumptions = [...(read.assumptions ?? [])];
  const perIngredient: IngredientNutrition[] = read.ingredients.map((ing) => ({
    name: ing.name,
    grams: Math.round(ing.grams),
    plant: ing.plant,
    processing: ing.processing,
    perServing: {},
  }));
  const sources: string[][] = read.ingredients.map(() => []);

  parts.forEach((part, n) => {
    const ing = read.ingredients[part.ingredient];
    const { food, per100g } = resolved[n];
    const values = new Map(Object.entries(per100g) as [NutrientKey, number][]);
    if (!food) {
      // The AI's own values: energy should match the macros (4/4/9 kcal per g, 2 for fibre).
      const macroKcal =
        4 * (values.get("protein") ?? 0) +
        4 * Math.max(0, (values.get("carbohydrates") ?? 0) - (values.get("fiber") ?? 0)) +
        2 * (values.get("fiber") ?? 0) +
        9 * (values.get("fat") ?? 0);
      const kcal = values.get("calories");
      if (macroKcal > 0 && (kcal == null || Math.abs(kcal - macroKcal) / macroKcal > 0.25)) values.set("calories", macroKcal);
    }
    // Cooked values next to a dry weight: scale them back up to dry.
    const energy = values.get("calories") ?? 0;
    if (DRY_STAPLE.test(ing.name) && ing.state === "dry" && energy > 0 && energy < 220) {
      const factor = 355 / energy;
      for (const [k, v] of values) values.set(k, v * factor);
      assumptions.push(`${ing.name}: converted cooked values to dry weight.`);
    }
    const grams = Math.max(0, ing.grams) * part.share;
    const target = perIngredient[part.ingredient].perServing!;
    for (const [key, value] of values) {
      if (!KEYS.includes(key)) continue;
      const kept = ing.cooked ? (RETENTION[key] ?? 1) : 1;
      const amount = (value * grams * kept) / 100;
      totals[key] = (totals[key] ?? 0) + amount;
      target[key] = (target[key] ?? 0) + amount / servings;
    }
    sources[part.ingredient].push(food ? `USDA: ${food.description}` : "AI estimate");
  });

  const perServing: NutritionEstimate["perServing"] = {};
  for (const [key, total] of Object.entries(totals) as [NutrientKey, number][]) perServing[key] = round(total / servings);
  for (const [i, ing] of perIngredient.entries()) {
    ing.source = [...new Set(sources[i])].join(" + ");
    for (const [k, v] of Object.entries(ing.perServing!) as [NutrientKey, number][]) ing.perServing![k] = round(v);
  }

  return {
    perServing,
    servings,
    source: "ai",
    confidence: read.confidence,
    assumptions,
    model,
    ingredients: perIngredient,
  };
}
