import "server-only";
import { generateText, Output } from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, meals } from "@/db";
import { UNITS } from "./meal-fields";
import type { MealInput } from "./meal-input";
import { createMealFromInput } from "./meal-store";
import { RECREATED } from "./creators";
import type { InstagramPost } from "./instagram";

// Turns a creator's caption into an Otao recipe. The AI only reads and tidies what the creator wrote;
// gaps it fills (missing steps, servings) are listed in `filledIn` and shown on the meal.
// Every imported meal links back to the original post and names the creator.

const UNIT_VALUES = UNITS.map((u) => u.value).filter(Boolean) as [string, ...string[]];

const recipeSchema = z.object({
  isRecipe: z.boolean().describe("true only if the caption contains a real recipe: at least the main ingredients with rough amounts"),
  notRecipeReason: z.string().optional().describe("When isRecipe is false: why, in one short sentence"),
  name: z.string().describe("Short appetising recipe name in English, Title Case, no emojis or hashtags"),
  description: z
    .string()
    .describe("One or two friendly sentences in your own words: what it is and why it's good (e.g. protein, time). No hashtags, no 'link in bio'"),
  servings: z.number().int().min(1).max(50).describe("Servings/meal-prep portions the amounts make; guess 1 for snacks, 4 for family dishes when not given"),
  prepMinutes: z.number().int().min(0).max(600).nullable(),
  cookMinutes: z.number().int().min(0).max(1440).nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  diet: z.enum(["none", "vegetarian", "vegan"]),
  ingredients: z.array(
    z.object({
      name: z.string().describe("Plain ingredient name, lower case, e.g. 'ground beef', 'cottage cheese'"),
      variant: z.string().nullable().describe("Kind/cut/fat level/brand note, e.g. '96/4 lean', 'breast', 'fat free'"),
      quantity: z.number().min(0).nullable(),
      quantityMax: z.number().min(0).nullable().describe("Upper end of a range only"),
      unit: z.enum(UNIT_VALUES).nullable().describe("Unit; convert oz to g and lb to g, fl oz to ml; 'pcs' for countable things"),
      staple: z.boolean().describe("Salt, pepper, oil, water, basic spices"),
    }),
  ),
  steps: z.array(z.string()).describe("Clear numbered-style cooking steps, one action each, in English, imperative mood. Keep the creator's method; if none is given, write the obvious short method"),
  filledIn: z.array(z.string()).describe("Anything you had to assume because the caption didn't say (e.g. 'Steps written from the video description', 'Servings guessed'). Empty if nothing"),
  categories: z.array(z.string()).max(3).describe("Up to 3 from: Meal prep, Breakfast, Lunch, Dinner, Snack, Dessert, High protein"),
  quality: z.number().int().min(1).max(5).describe("How complete and cookable the recipe is from the caption alone: 5 = full amounts and steps"),
});
export type ParsedRecipe = z.infer<typeof recipeSchema>;

export async function captionToRecipe(caption: string, creator: string | null): Promise<ParsedRecipe> {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI isn't set up (AI_MODEL is missing).");
  const { output } = await generateText({
    model,
    output: Output.object({ schema: recipeSchema }),
    system: "You turn social media recipe captions into clean, cookable recipes for a home meal-prep app. You never invent macros.",
    prompt: [
      `Instagram caption${creator ? ` by @${creator}` : ""}:`,
      '"""',
      caption.slice(0, 6000),
      '"""',
      "",
      "Read the ingredients with their amounts exactly as written (convert US units: 1 oz = 28 g, 1 lb = 454 g, 1 fl oz = 30 ml).",
      "Ignore calorie/macro claims, hashtags, 'cookbook in bio', follow requests and sponsor codes.",
      "If amounts are for one portion and it says to make several (meal prep), use the batch amounts and that number of servings.",
      "When an ingredient has no amount, estimate a realistic one (e.g. 30 g shredded lettuce, 1 tbsp sauce) and say so in filledIn.",
      "Leave quantity empty only for salt, pepper and spices 'to taste' (unit 'to taste').",
    ].join("\n"),
    temperature: 0,
  });
  return output;
}

/** A meal that already links to this post, if any. */
export async function findImported(permalink: string): Promise<number | null> {
  const [row] = await db()
    .select({ id: meals.id })
    .from(meals)
    .where(sql`${meals.links} @> ${JSON.stringify([{ url: permalink }])}::jsonb`)
    .limit(1);
  return row?.id ?? null;
}

export function recipeToMealInput(post: InstagramPost, r: ParsedRecipe, opts: { photo?: boolean; categories?: string[] } = {}): MealInput {
  const by = post.creator ? `@${post.creator}` : "the creator";
  const credit = `Recipe by ${by} on Instagram.`;
  const notes = r.filledIn.length ? `\n\nFilled in by Otao: ${r.filledIn.map((x) => x.trim().replace(/\.+$/, "")).join("; ")}.` : "";
  return {
    name: r.name.trim().slice(0, 200),
    description: `${r.description.trim()}\n\n${credit}${notes}`.slice(0, 5000),
    servings: r.servings,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    difficulty: r.difficulty,
    diet: r.diet === "none" ? null : r.diet,
    isPublic: false,
    ingredients: r.ingredients.map((i) => ({
      name: i.name,
      variant: i.variant ?? undefined,
      quantity: i.quantity ?? undefined,
      quantityMax: i.quantityMax && i.quantity && i.quantityMax > i.quantity ? i.quantityMax : undefined,
      unit: i.unit ?? undefined,
      staple: i.staple,
    })),
    steps: r.steps,
    links: [
      { url: post.permalink, label: `${post.isVideo ? "Reel" : "Post"} by ${by}` },
      ...(post.creatorUrl ? [{ url: post.creatorUrl, label: `${by} on Instagram` }] : []),
    ],
    categories: [...new Set([RECREATED, ...(opts.categories ?? []), ...r.categories])],
    // Covers usually show the creator rather than the food, so they are only used when asked for.
    imageUrl: opts.photo ? post.thumbnailUrl : null,
  };
}

export type ImportResult =
  | { status: "created"; id: number; name: string; quality: number; filledIn: string[] }
  | { status: "exists"; id: number }
  | { status: "skipped"; reason: string }
  | { status: "preview"; recipe: ParsedRecipe };

/** Reads one post and saves it as a private meal (unless it's already there or isn't a recipe). */
export async function importInstagramPost(
  post: InstagramPost,
  opts: { authorId?: number | null; dryRun?: boolean; photo?: boolean; categories?: string[]; minQuality?: number } = {},
): Promise<ImportResult> {
  const existing = await findImported(post.permalink);
  if (existing) return { status: "exists", id: existing };
  const recipe = await captionToRecipe(post.caption, post.creator);
  if (!recipe.isRecipe || recipe.ingredients.length < 2) {
    return { status: "skipped", reason: recipe.notRecipeReason || "No recipe in the caption." };
  }
  if (recipe.quality < (opts.minQuality ?? 2)) {
    return { status: "skipped", reason: `Too little detail to cook from (quality ${recipe.quality}/5).` };
  }
  if (opts.dryRun) return { status: "preview", recipe };
  const id = await createMealFromInput(recipeToMealInput(post, recipe, opts));
  if (opts.authorId) await db().update(meals).set({ authorId: opts.authorId }).where(eq(meals.id, id));
  return { status: "created", id, name: recipe.name, quality: recipe.quality, filledIn: recipe.filledIn };
}
