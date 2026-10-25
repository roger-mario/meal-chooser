import { z } from "zod";
import { DIETS, DIFFICULTIES, formatIngredient, formatMinutes, linkLabel, normalizeIngredients, sanitizeLinks } from "./meal-fields";
import { BACKUP_APP, backupSchema, categoryInputSchema, mealInputSchema, type CategoryInput, type MealInput } from "./meal-input";

/**
 * The recipe folder: one folder per meal, made to live in a Git repository.
 *
 *   otao.json                     categories (and marks the folder as an Otao export)
 *   README.md                     list of all recipes
 *   recipes/<slug>/recipe.json    the meal, read back on import
 *   recipes/<slug>/README.md      the same meal, readable on GitHub
 *   recipes/<slug>/photo.jpg      optional
 *
 * Nothing in it changes unless a meal changes (no export dates), so Git history only shows real edits.
 */
export const FOLDER_VERSION = 2;
export const FOLDER_INDEX = "otao.json";
export const RECIPES_DIR = "recipes";

export const folderIndexSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(FOLDER_VERSION),
  categories: z.array(categoryInputSchema),
});

/** A meal as stored in recipe.json: the API format without a photo link (the photo sits next to it). */
export type FolderMeal = Omit<MealInput, "imageUrl">;
export type FolderRecipe = { meal: FolderMeal; photo?: { name: string; bytes: Uint8Array } };
export type ParsedFolder = { categories: CategoryInput[]; recipes: FolderRecipe[] };

export function slugify(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || "recipe";
}

/** Gives every meal its own folder name; meals with the same name get -2, -3 … in the given order. */
export function uniqueSlugs(names: string[]) {
  const used = new Set<string>();
  return names.map((name) => {
    const base = slugify(name);
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return slug;
  });
}

export const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

const md = (s: string) => s.replace(/\r\n/g, "\n").trim();

/** The meal as a Markdown page. Only for reading: import uses recipe.json. */
export function recipeMarkdown(meal: FolderMeal, photo?: string) {
  const out: string[] = [`# ${meal.name.trim()}`, ""];
  if (photo) out.push(`![${meal.name.trim()}](${photo})`, "");
  if (meal.description?.trim()) out.push(md(meal.description), "");

  const facts: string[] = [];
  if (meal.servings) facts.push(`**Servings:** ${meal.servings}`);
  if (meal.prepMinutes) facts.push(`**Prep:** ${formatMinutes(meal.prepMinutes)}`);
  if (meal.cookMinutes) facts.push(`**Cook:** ${formatMinutes(meal.cookMinutes)}`);
  const difficulty = DIFFICULTIES.find((d) => d.value === meal.difficulty);
  if (difficulty) facts.push(`**Difficulty:** ${difficulty.label}`);
  const diet = DIETS.find((d) => d.value === meal.diet);
  if (diet) facts.push(`**Diet:** ${diet.emoji} ${diet.label}`);
  if (meal.babyFriendly) facts.push("**Baby-friendly** 👶");
  facts.push(meal.isPublic ? "**Public** (in the Otao collection)" : "**Private**");
  if (meal.categories?.length) facts.push(`**Categories:** ${meal.categories.join(", ")}`);
  if (facts.length) out.push(facts.map((f) => `- ${f}`).join("\n"), "");

  const ingredients = normalizeIngredients((meal.ingredients ?? []) as Parameters<typeof normalizeIngredients>[0]);
  if (ingredients.length) {
    out.push("## Ingredients", "", ...ingredients.map((i) => `- ${formatIngredient(i)}`), "");
  }
  const steps = (meal.steps ?? []).map((s) => s.trim()).filter(Boolean);
  if (steps.length) out.push("## Steps", "", ...steps.map((s, i) => `${i + 1}. ${s.replace(/\s*\n\s*/g, " ")}`), "");

  const per = (meal.nutrition as { perServing?: Record<string, number> } | null | undefined)?.perServing;
  if (per && per.calories != null) {
    const round = (n: number | undefined) => (n == null ? "–" : String(Math.round(n)));
    out.push(
      "## Nutrition per serving",
      "",
      "| Calories | Protein | Carbs | Fat | Fiber |",
      "| --- | --- | --- | --- | --- |",
      `| ${round(per.calories)} kcal | ${round(per.protein)} g | ${round(per.carbohydrates)} g | ${round(per.fat)} g | ${round(per.fiber)} g |`,
      "",
      "_Estimate. The full list of vitamins and minerals is in recipe.json._",
      "",
    );
  }

  const links = sanitizeLinks(meal.links ?? []);
  if (links.length) out.push("## Links", "", ...links.map((l) => `- [${linkLabel(l)}](${l.url})`), "");
  return out.join("\n");
}

export function indexMarkdown(recipes: { slug: string; meal: FolderMeal }[]) {
  const rows = [...recipes]
    .sort((a, b) => a.meal.name.localeCompare(b.meal.name))
    .map(({ slug, meal }) => `| [${meal.name.trim().replace(/\|/g, "\\|")}](${RECIPES_DIR}/${slug}/README.md) | ${(meal.categories ?? []).join(", ")} |`);
  return [
    "# Otao recipes",
    "",
    `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}, backed up from Otao. Each folder in \`${RECIPES_DIR}/\` holds one recipe: \`recipe.json\` (what Otao imports), a readable \`README.md\` and the photo.`,
    "",
    "To restore or move to another Otao: download this repository as a ZIP and import it in Otao under Labs → Backup.",
    "",
    "| Recipe | Categories |",
    "| --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

const decoder = new TextDecoder();
const PHOTO = /^photo\.(jpe?g|png|webp)$/i;

function parseJson(bytes: Uint8Array): unknown {
  return JSON.parse(decoder.decode(bytes));
}

/**
 * Reads a recipe folder from a list of files (e.g. an unzipped export, or GitHub's "Download ZIP",
 * which puts everything into one extra top folder). Throws a readable message when it isn't one.
 */
export function parseFolder(files: Map<string, Uint8Array>): ParsedFolder {
  const paths = [...files.keys()].filter((p) => !p.endsWith("/"));
  const indexPath = paths
    .filter((p) => p === FOLDER_INDEX || p.endsWith(`/${FOLDER_INDEX}`))
    .sort((a, b) => a.length - b.length)[0];
  if (!indexPath) throw new Error("This zip has no otao.json, so it isn't an Otao recipe folder.");
  const root = indexPath.slice(0, -FOLDER_INDEX.length);

  let index;
  try {
    index = folderIndexSchema.parse(parseJson(files.get(indexPath)!));
  } catch {
    throw new Error("The otao.json in this zip is damaged or from a newer Otao.");
  }

  const recipes: FolderRecipe[] = [];
  for (const path of paths) {
    if (!path.startsWith(`${root}${RECIPES_DIR}/`) || !path.endsWith("/recipe.json")) continue;
    const dir = path.slice(0, -"recipe.json".length);
    let meal: FolderMeal;
    try {
      meal = mealInputSchema.omit({ imageUrl: true }).parse(parseJson(files.get(path)!));
    } catch {
      throw new Error(`${path.slice(root.length)} is damaged: fix or delete it and try again.`);
    }
    const photoPath = paths.find((p) => p.startsWith(dir) && PHOTO.test(p.slice(dir.length)));
    recipes.push({ meal, photo: photoPath ? { name: photoPath.slice(dir.length), bytes: files.get(photoPath)! } : undefined });
  }
  recipes.sort((a, b) => a.meal.name.localeCompare(b.meal.name));
  return { categories: index.categories, recipes };
}

/** The older single-file backup (Help page), read into the same shape. Photos aren't part of it. */
export function parseBackupFile(bytes: Uint8Array): ParsedFolder {
  let parsed;
  try {
    parsed = backupSchema.safeParse(parseJson(bytes));
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!parsed.success) throw new Error("This file is not an Otao backup, or it is damaged.");
  return { categories: parsed.data.categories, recipes: parsed.data.meals.map((meal) => ({ meal })) };
}
