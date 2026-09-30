import { z } from "zod";
import { DIETS, DIFFICULTIES } from "./meal-fields";

const optionalMinutes = z.number().int().min(0).max(100_000).nullish();

/** Meal format accepted by the API and found in backups. */
export const mealInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullish(),
  servings: z.number().int().min(1).max(1000).nullish(),
  prepMinutes: optionalMinutes,
  cookMinutes: optionalMinutes,
  difficulty: z.enum(DIFFICULTIES.map((d) => d.value) as [string, ...string[]]).nullish(),
  diet: z.enum(DIETS.map((d) => d.value) as [string, ...string[]]).nullish(),
  babyFriendly: z.boolean().nullish(),
  /** [{ name, variant?, quantity?, quantityMax?, unit?, staple? }] or plain strings like "200 g rice" or "600-700 g chicken" */
  ingredients: z.array(z.unknown()).max(200).optional(),
  steps: z.array(z.string()).max(200).optional(),
  /** [{ url, label? }] or plain URLs */
  links: z.array(z.unknown()).max(50).optional(),
  /** Category names; missing categories are created. */
  categories: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  nutrition: z.record(z.string(), z.unknown()).nullish(),
  cost: z.record(z.string(), z.unknown()).nullish(),
});
export type MealInput = z.infer<typeof mealInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().max(40).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

// Kept as "meal-chooser" (the app's old name) so older backups still import.
export const BACKUP_APP = "meal-chooser";

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  categories: z.array(categoryInputSchema),
  meals: z.array(mealInputSchema),
});
export type Backup = z.infer<typeof backupSchema>;
