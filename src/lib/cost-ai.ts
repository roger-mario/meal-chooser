import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Meal } from "@/db/schema";
import { COST_STORE, type CostEstimate } from "./cost";
import { formatIngredient, normalizeIngredients } from "./meal-fields";

const costSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Ingredient name, as given"),
      chf: z.number().min(0).describe("Cost in CHF of the amount used in this recipe"),
    }),
  ),
  notes: z.string().describe("One or two sentences on assumptions, e.g. product line or pack sizes"),
});

export async function estimateCost(meal: Meal): Promise<CostEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const ingredients = normalizeIngredients(meal.ingredients);
  if (ingredients.length === 0) throw new Error("The meal has no ingredients");

  const prompt = [
    `Estimate what the ingredients of this recipe cost at ${COST_STORE} in Switzerland today, in CHF.`,
    `Meal: ${meal.name} (makes ${meal.servings} serving(s))`,
    `Ingredients:\n${ingredients.map((i) => `- ${formatIngredient(i)}`).join("\n")}`,
    "",
    `Use typical current ${COST_STORE} shelf prices for standard (not premium or organic) products.`,
    "Price only the amount the recipe uses, pro-rated from the pack price.",
    "For basics like salt, pepper or oil, price the small amount used.",
    "Where no quantity is given, assume a typical amount for this recipe.",
    "Return one item per ingredient, in the same order.",
  ].join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({ schema: costSchema }),
    system: "You know Swiss supermarket prices well and give realistic, conservative estimates.",
    prompt,
  });

  return { store: COST_STORE, items: output.items, notes: output.notes, source: "ai", model };
}
