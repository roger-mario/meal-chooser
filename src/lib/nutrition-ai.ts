import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { NUTRIENTS, type NutrientKey, type NutritionEstimate } from "./nutrients";
import type { Meal } from "@/db/schema";

const perServingShape = Object.fromEntries(
  NUTRIENTS.map((n) => [
    n.key,
    z.number().min(0).describe(`${n.label} in ${n.unit} per serving`),
  ]),
) as Record<NutrientKey, z.ZodNumber>;

const estimateSchema = z.object({
  perServing: z.object(perServingShape),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("How reliable the estimate is given the ingredient detail provided"),
  summary: z
    .string()
    .describe("Two or three sentences on the nutritional profile of one serving"),
  assumptions: z
    .array(z.string())
    .describe("Assumptions made, e.g. assumed quantities, cooking losses, brands"),
});

export async function estimateNutrition(meal: Meal): Promise<NutritionEstimate> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");

  const prompt = [
    `Estimate the nutrition of ONE serving of this meal. The recipe makes ${meal.servings} serving(s).`,
    `Meal: ${meal.name}`,
    meal.description ? `Description: ${meal.description}` : "",
    `Ingredients:\n${meal.ingredients.map((i) => `- ${i}`).join("\n") || "(none listed)"}`,
    meal.instructions ? `Instructions:\n${meal.instructions}` : "",
    "",
    "Use standard food composition data (e.g. USDA FoodData Central).",
    "Account for cooking method (fat absorption, water loss, vitamin losses from heat).",
    "Where quantities are missing, assume typical home-cooking amounts and list the assumption.",
    "Give every nutrient a numeric value; use 0 only if the meal truly contains none.",
  ]
    .filter(Boolean)
    .join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({ schema: estimateSchema }),
    system:
      "You are a registered dietitian and food scientist. You produce careful, realistic nutrient estimates.",
    prompt,
  });

  return { ...output, servings: meal.servings, model };
}
