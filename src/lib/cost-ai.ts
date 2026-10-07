import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Meal } from "@/db/schema";
import { COST_STORE, type CostEstimate, type CostItem } from "./cost";
import { estimateBasis } from "./estimate-basis";
import { formatIngredient, normalizeIngredients } from "./meal-fields";

// The model names the product and its shelf price per kg, litre or piece, plus the amount the
// recipe uses; the price of each line is worked out in code, so the arithmetic can't go wrong.
const costSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Ingredient name, as given (without the kind in brackets)"),
      product: z.string().describe(`The ${COST_STORE} product assumed, e.g. "M-Classic chicken breast, Swiss"`),
      unit: z.enum(["kg", "l", "piece"]).describe("What the shelf price is per"),
      unitPrice: z.number().min(0).describe("Regular shelf price in CHF per kg, per litre or per piece"),
      amount: z.number().min(0).describe("How much of that unit the WHOLE recipe uses, e.g. 0.6 (kg) or 4 (pieces)"),
    }),
  ),
  notes: z.string().describe("One or two sentences on assumptions, e.g. product line or origin"),
});

// Regular (not promotional) Migros shelf prices for the standard line, as anchors so estimates
// don't drift. Approximate, autumn 2026; update when they change noticeably.
const REFERENCE_PRICES = [
  "Meat and fish (Swiss unless noted): chicken breast 32/kg, chicken thighs 20/kg, whole chicken 12/kg, minced beef 21/kg,",
  "minced beef light 24/kg, minced turkey 22/kg, beef steak 55/kg, pork escalope 30/kg, cooked ham 30/kg,",
  "salmon fillet (farmed, Norway) 38/kg, smoked salmon 60/kg, tuna can (drained) 20/kg, turkey pepperoni 35/kg.",
  "Dairy and eggs: Swiss free-range eggs 0.60/piece, milk 1.80/l, kefir 3.80/l, natural yoghurt 3.50/kg, Greek yoghurt 7/kg,",
  "butter 15/kg, mozzarella 13/kg, grated mozzarella/pizza cheese 15/kg, parmesan 30/kg, cream 9/l, cottage cheese 9/kg.",
  "Dry goods: long-grain rice 2.60/kg, jasmine/basmati rice 3.80/kg, pasta 2.40/kg, oats 2.20/kg, flour 1.60/kg,",
  "red lentils 5/kg, canned chickpeas/beans (drained) 4/kg, passata/tomato sauce 2.60/kg, pesto/arrabbiata sauce 10/kg,",
  "canned corn (drained) 6/kg, olive oil 12/l, sunflower oil 4.50/l, whey protein 40/kg, chia seeds 16/kg, flax seeds 6/kg,",
  "walnuts 28/kg, almonds 20/kg, dark chocolate 15/kg, honey 15/kg, spices about 40/kg.",
  "Produce: carrots 2.60/kg, onions 2.40/kg, potatoes 2.20/kg, bell peppers 7/kg (about 1/piece), tomatoes 4.50/kg,",
  "cherry tomatoes 9/kg, mushrooms 11/kg, broccoli 6/kg, broccolini 18/kg, zucchini 5/kg, spinach 12/kg,",
  "spring onions 1.60/bunch, bananas 2.90/kg, apples 4/kg, fresh blueberries 22/kg, frozen berries 9/kg,",
  "frozen peas 4/kg, frozen mixed vegetables 4.50/kg, avocado 1.50/piece, lemons 0.60/piece.",
].join("\n");

export async function estimateCost(meal: Meal): Promise<CostEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const ingredients = normalizeIngredients(meal.ingredients);
  if (ingredients.length === 0) throw new Error("The meal has no ingredients");

  const prompt = [
    `Estimate what the ingredients of this recipe cost at ${COST_STORE} in Switzerland today, in CHF.`,
    `Meal: ${meal.name} (makes ${meal.servings} serving(s))`,
    `Ingredients for the WHOLE recipe:\n${ingredients.map((i) => `- ${formatIngredient(i)}`).join("\n")}`,
    "",
    `Assume the standard ${COST_STORE} line (M-Classic, Swiss meat), regular shelf prices, not promotions,`,
    "not M-Budget and not organic, unless the ingredient says so. Reference prices in CHF:",
    REFERENCE_PRICES,
    "Use these where they fit; for anything else give the typical regular price of a comparable product.",
    "",
    "For every ingredient give the shelf price per kg, litre or piece and the amount the recipe uses in that unit,",
    "pro-rated (only what the recipe uses, not the whole pack). Convert kitchen units first: 1 cup dry rice ≈ 0.185 kg,",
    "1 cup oats ≈ 0.08 kg, 1 tbsp oil ≈ 0.013 l, 1 tsp spice ≈ 0.0025 kg, 1 can ≈ 0.4 kg.",
    "Where no quantity is given, assume a typical amount for this recipe. For a range like 600–700 g, use the midpoint.",
    "For basics like salt, pepper or oil, price the small amount used.",
    "Return one item per ingredient, in the same order.",
  ].join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({ schema: costSchema }),
    system: "You know Swiss supermarket prices well and give realistic estimates of regular shelf prices.",
    prompt,
    temperature: 0,
  });

  const items: CostItem[] = output.items.map((i) => ({
    name: i.name,
    product: i.product,
    unit: i.unit,
    unitPrice: i.unitPrice,
    amount: i.amount,
    chf: Math.round(i.unitPrice * i.amount * 100) / 100,
  }));
  return { store: COST_STORE, items, notes: output.notes, source: "ai", model, basis: estimateBasis(meal) };
}
