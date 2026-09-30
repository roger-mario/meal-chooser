import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { NUTRIENTS, type NutrientKey, type NutritionEstimate } from "./nutrients";
import type { Meal } from "@/db/schema";
import { formatIngredient, normalizeIngredients, normalizeSteps } from "./meal-fields";

const KEYS = NUTRIENTS.map((n) => n.key) as [NutrientKey, ...NutrientKey[]];
const UNIT_LIST = NUTRIENTS.map((n) => `${n.key} (${n.unit})`).join(", ");

// The model only looks up reference values per 100 g of each ingredient and the grams the
// recipe uses. All sums and the division into servings happen in code, so the result is
// always per serving and the arithmetic can't go wrong.
const schema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string().describe("Ingredient name as given in the recipe"),
      grams: z
        .number()
        .min(0)
        .describe("Edible grams of this ingredient in the WHOLE recipe (all servings), as eaten; 0 if negligible"),
      per100g: z
        .array(z.object({ key: z.enum(KEYS), value: z.number().min(0) }))
        .describe("Nutrients per 100 g of this ingredient, in the units listed in the instructions"),
    }),
  ),
  confidence: z.enum(["low", "medium", "high"]).describe("How reliable the estimate is given the recipe detail"),
  summary: z.string().describe("Two sentences on the nutritional profile of one serving"),
  assumptions: z.array(z.string()).describe("Assumed quantities, product types or cooking losses"),
});

// Highest plausible amount per 100 g of any ordinary food, as a multiple of the daily value.
// Anything above is almost certainly a unit mix-up (e.g. IU instead of µg) and is dropped.
const MAX_DV_PER_100G = 40;

function plausible(key: NutrientKey, value: number) {
  const def = NUTRIENTS.find((n) => n.key === key)!;
  if (!Number.isFinite(value) || value < 0) return false;
  if (def.group === "macros" || def.group === "fats") return value <= 100; // grams per 100 g
  if (key === "calories") return value <= 900;
  return !("dailyValue" in def) || value <= def.dailyValue * MAX_DV_PER_100G;
}

function round(v: number) {
  return v >= 100 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

export async function estimateNutrition(meal: Meal): Promise<NutritionEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const servings = Math.max(1, meal.servings);
  const ingredients = normalizeIngredients(meal.ingredients);
  if (ingredients.length === 0) throw new Error("Add ingredients to the meal first.");
  const steps = normalizeSteps(meal.steps, meal.instructions);

  const prompt = [
    `Recipe: ${meal.name} (the whole recipe makes ${servings} serving${servings === 1 ? "" : "s"})`,
    meal.description ? `Description: ${meal.description}` : "",
    `Ingredients for the WHOLE recipe:\n${ingredients.map((i) => `- ${formatIngredient(i)}`).join("\n")}`,
    steps.length ? `Steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    "",
    "An amount like 600–700 g is a range: use its midpoint. Text in brackets after a name is the kind, cut or variety",
    "(e.g. chicken (breast), rice (jasmine)); use values for exactly that kind.",
    "",
    "For every ingredient:",
    "1. grams: the edible amount in the whole recipe, in grams. Convert pieces, cups, spoons, cans etc. to grams",
    "   (e.g. 1 egg ≈ 50 g, 1 tbsp oil ≈ 13 g, 1 medium onion ≈ 110 g). For water or salt 'to taste' use a small realistic amount.",
    "   For frying oil, count only what is absorbed/eaten.",
    "2. per100g: nutrient content per 100 g of that ingredient, from standard food composition tables",
    "   (USDA FoodData Central, Swiss Food Composition Database). Use cooked values where the ingredient is cooked,",
    "   so cooking losses of heat-sensitive vitamins are reflected.",
    "   List every nutrient present in a meaningful amount; leave out ones that are zero or trace.",
    "",
    `Units per 100 g (use exactly these): ${UNIT_LIST}.`,
    "Vitamin A is µg RAE, NOT IU (raw carrot ≈ 835 µg RAE/100 g). Vitamin D is µg, NOT IU. Folate is µg DFE.",
    "Do not multiply by servings and do not divide by servings: the app does that.",
  ]
    .filter(Boolean)
    .join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({ schema }),
    system:
      "You are a registered dietitian. You know food composition tables well and give realistic, conservative values.",
    prompt,
    temperature: 0,
  });

  return computeNutrition(output, servings, model);
}

/** Adds up the ingredients and divides by the servings. Exported for testing. */
export function computeNutrition(output: z.infer<typeof schema>, servings: number, model?: string): NutritionEstimate {
  const totals: Partial<Record<NutrientKey, number>> = {};
  const dropped = new Set<string>();
  for (const ing of output.ingredients) {
    const grams = Math.max(0, ing.grams);
    for (const { key, value } of ing.per100g) {
      if (!plausible(key, value)) {
        dropped.add(`${NUTRIENTS.find((n) => n.key === key)!.label} in ${ing.name}`);
        continue;
      }
      totals[key] = (totals[key] ?? 0) + (value * grams) / 100;
    }
  }

  const perServing: NutritionEstimate["perServing"] = {};
  for (const [key, total] of Object.entries(totals) as [NutrientKey, number][]) {
    perServing[key] = round(total / servings);
  }

  // Calories should match the macros (4/4/9 kcal per g); if the model's energy values drift, trust the macros.
  const fromMacros = 4 * (perServing.protein ?? 0) + 4 * (perServing.carbohydrates ?? 0) + 9 * (perServing.fat ?? 0);
  const assumptions = [...output.assumptions];
  if (fromMacros > 0 && (perServing.calories == null || Math.abs(perServing.calories - fromMacros) / fromMacros > 0.2)) {
    perServing.calories = Math.round(fromMacros);
    assumptions.push("Calories calculated from protein, carbohydrates and fat.");
  }
  if (dropped.size) assumptions.push(`Left out implausible values: ${[...dropped].join(", ")}.`);

  return {
    perServing,
    servings,
    source: "ai",
    confidence: output.confidence,
    summary: output.summary,
    assumptions,
    model,
    ingredients: output.ingredients.map((i) => ({ name: i.name, grams: Math.round(i.grams) })),
  };
}
