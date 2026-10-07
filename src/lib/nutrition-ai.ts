import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { NUTRIENTS, POORLY_TABULATED, type NutrientKey, type NutritionEstimate } from "./nutrients";
import { estimateBasis } from "./estimate-basis";
import type { Meal } from "@/db/schema";
import { formatIngredient, normalizeIngredients, normalizeSteps } from "./meal-fields";

// Nutrients that food tables barely cover are left out: guesses there would only add noise.
const KEYS = NUTRIENTS.map((n) => n.key).filter((k) => !POORLY_TABULATED.has(k)) as [NutrientKey, ...NutrientKey[]];
const UNIT_LIST = NUTRIENTS.filter((n) => KEYS.includes(n.key)).map((n) => `${n.key} (${n.unit})`).join(", ");

// The model only looks up reference values per 100 g of each ingredient and the grams the
// recipe uses. All sums, cooking losses and the division into servings happen in code, so the
// result is always per serving and the arithmetic can't go wrong.
const schema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string().describe("Ingredient name as given in the recipe"),
      grams: z
        .number()
        .min(0)
        .describe("Grams of this ingredient in the WHOLE recipe (all servings), weighed as listed: dry for rice/pasta/oats, raw for meat/fish/veg"),
      state: z
        .enum(["raw", "dry", "as sold"])
        .describe("The state the grams AND per100g values describe: raw (fresh produce, meat, fish, eggs), dry (uncooked grains, pasta, legumes, flakes), as sold (cheese, sauces, canned, drinks)"),
      cooked: z.boolean().describe("Whether the recipe heats this ingredient"),
      plant: z.boolean().describe("A plant food: vegetable, fruit, grain, legume, nut, seed, herb or spice"),
      processing: z
        .enum(["whole", "processed", "ultra"])
        .describe("whole: unprocessed or minimally processed; processed: cheese, bread, canned, cured; ultra: sausages, pepperoni, sweets, protein powder, instant products"),
      per100g: z
        .array(z.object({ key: z.enum(KEYS), value: z.number().min(0) }))
        .describe("Nutrients per 100 g of this ingredient in the SAME state as `grams`, in the units listed in the instructions"),
    }),
  ),
  confidence: z.enum(["low", "medium", "high"]).describe("How reliable the estimate is given the recipe detail"),
  summary: z.string().describe("Two sentences on the nutritional profile of one serving"),
  assumptions: z.array(z.string()).describe("Assumed quantities, product types or sizes"),
});

type Output = z.infer<typeof schema>;

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

function round(v: number) {
  return v >= 100 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

// Usual weights, so every estimate converts kitchen units the same way.
const CONVERSIONS = [
  "1 cup dry rice ≈ 185 g, 1 cup dry pasta ≈ 100 g, 1 cup oats ≈ 80 g, 1 cup flour ≈ 125 g, 1 cup frozen peas ≈ 135 g,",
  "1 cup berries ≈ 145 g, 1 cup milk/kefir ≈ 245 g; 1 tbsp oil ≈ 13 g, 1 tbsp chia ≈ 12 g, 1 tsp salt ≈ 6 g, 1 tsp spice ≈ 2.5 g;",
  "1 egg ≈ 50 g, 1 medium onion ≈ 110 g, 1 carrot ≈ 60 g, 1 bell pepper ≈ 120 g, 1 banana ≈ 118 g, 1 spring onion ≈ 15 g,",
  "1 mushroom ≈ 18 g, 1 walnut (kernel) ≈ 5 g, 1 garlic clove ≈ 4 g; 1 can tomatoes/sauce ≈ 400 g, 1 can corn or beans ≈ 285 g",
  "drained (a half can ≈ 140 g); a pack/bunch of cherry tomatoes ≈ 250 g, a bunch of herbs ≈ 30 g; a slice of butter ≈ 10 g.",
].join("\n");

export async function estimateNutrition(meal: Meal): Promise<NutritionEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const servings = Math.max(1, meal.servings);
  const ingredients = normalizeIngredients(meal.ingredients);
  if (ingredients.length === 0) throw new Error("Add ingredients to the meal first.");
  const steps = normalizeSteps(meal.steps, meal.instructions);

  const prompt = [
    `Recipe: ${meal.name} (the whole recipe makes ${servings} serving${servings === 1 ? "" : "s"})`,
    `Ingredients for the WHOLE recipe (use exactly these amounts, even if the steps or a source say otherwise):`,
    ingredients.map((i) => `- ${formatIngredient(i)}`).join("\n"),
    steps.length ? `Steps (only for how things are cooked):\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    "",
    "An amount like 600–700 g is a range: use its midpoint. Text in brackets after a name is the kind, cut or variety",
    "(e.g. chicken (breast), rice (jasmine)); use values for exactly that kind. Swiss shops sell these products.",
    "",
    "For every ingredient:",
    "1. grams: the amount in the whole recipe, in grams, weighed the way it is listed: rice, pasta, oats and pulses DRY,",
    "   meat, fish, eggs and vegetables RAW. Convert kitchen units with these weights:",
    CONVERSIONS,
    "   For water use 0 g. For frying oil, count only what is absorbed/eaten. 'To taste' means a small realistic amount.",
    "2. per100g: nutrient content per 100 g in the SAME state as grams (dry rice ≈ 360 kcal and 80 g carbs per 100 g,",
    "   NOT cooked rice; raw chicken breast ≈ 120 kcal and 22.5 g protein, NOT cooked). Do not reduce vitamins for",
    "   cooking: the app applies cooking losses itself. Use USDA FoodData Central or the Swiss Food Composition Database.",
    "   Always give calories, protein, carbohydrates, fat, fiber, sugars and saturatedFat. Give each other nutrient when",
    "   the ingredient contains a meaningful amount of it; leave it out when it's zero, trace or unknown (never write 0",
    "   for an unknown value).",
    "",
    `Units per 100 g (use exactly these): ${UNIT_LIST}.`,
    "Vitamin A is µg RAE, NOT IU (raw carrot ≈ 835 µg RAE/100 g). Vitamin D is µg, NOT IU. Folate is µg DFE.",
    "omega3 is the sum of ALA, EPA and DHA in grams. addedSugars only counts sugar added by a manufacturer or the cook.",
    "Do not multiply or divide by servings: the app does that.",
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

  return { ...computeNutrition(output, servings, model), basis: estimateBasis(meal) };
}

/** Adds up the ingredients and divides by the servings. Exported for testing. */
export function computeNutrition(output: Output, servings: number, model?: string): NutritionEstimate {
  const totals: Partial<Record<NutrientKey, number>> = {};
  const dropped = new Set<string>();
  const assumptions = [...output.assumptions];
  for (const ing of output.ingredients) {
    const grams = Math.max(0, ing.grams);
    const values = new Map(ing.per100g.filter((v) => KEYS.includes(v.key)).map((v) => [v.key, v.value]));
    // Energy per 100 g should match the macros (4/4/9 kcal per g, 2 for fibre); if the model's value drifts, trust the macros.
    const macroKcal =
      4 * (values.get("protein") ?? 0) +
      4 * Math.max(0, (values.get("carbohydrates") ?? 0) - (values.get("fiber") ?? 0)) +
      2 * (values.get("fiber") ?? 0) +
      9 * (values.get("fat") ?? 0);
    const kcal = values.get("calories");
    if (macroKcal > 0 && (kcal == null || Math.abs(kcal - macroKcal) / macroKcal > 0.25)) values.set("calories", macroKcal);
    // Cooked values next to a dry weight: scale them back up to dry.
    const energy = values.get("calories") ?? 0;
    if (DRY_STAPLE.test(ing.name) && ing.state === "dry" && energy > 0 && energy < 220) {
      const factor = 355 / energy;
      for (const [k, v] of values) values.set(k, v * factor);
      assumptions.push(`${ing.name}: converted cooked values to dry weight.`);
    }
    for (const [key, value] of values) {
      if (!plausible(key, value)) {
        dropped.add(`${NUTRIENTS.find((n) => n.key === key)!.label} in ${ing.name}`);
        continue;
      }
      const kept = ing.cooked ? (RETENTION[key] ?? 1) : 1;
      totals[key] = (totals[key] ?? 0) + (value * grams * kept) / 100;
    }
  }

  const perServing: NutritionEstimate["perServing"] = {};
  for (const [key, total] of Object.entries(totals) as [NutrientKey, number][]) {
    perServing[key] = round(total / servings);
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
    ingredients: output.ingredients.map((i) => ({
      name: i.name,
      grams: Math.round(i.grams),
      plant: i.plant,
      processing: i.processing,
    })),
  };
}
