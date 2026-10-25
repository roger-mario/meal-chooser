"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db, meals } from "@/db";
import { dataChanged } from "@/lib/cache";
import { backupToGitHub, GitHubBackupError, githubBackupConfig } from "@/lib/github-backup";
import { categoryInputSchema, mealInputSchema } from "@/lib/meal-input";
import { createMealFromInput, ensureCategories } from "@/lib/meal-store";
import { requireSite } from "@/lib/require-site";

/** Step 1 of an import: the categories with their emoji and colour. */
export async function importFolderCategories(raw: string): Promise<{ error?: string }> {
  await requireSite();
  let parsed;
  try {
    parsed = categoryInputSchema.array().max(500).safeParse(JSON.parse(raw));
  } catch {
    return { error: "The categories in this file are damaged." };
  }
  if (!parsed.success) return { error: "The categories in this file are damaged." };
  await ensureCategories(parsed.data.map((c) => c.name), parsed.data);
  dataChanged();
  return {};
}

export type FolderMealResult = { status: "added" } | { status: "skipped" } | { status: "error"; error: string };

/** Step 2, once per recipe (one at a time keeps each request small enough for photos). */
export async function importFolderMeal(formData: FormData): Promise<FolderMealResult> {
  await requireSite();
  let input;
  try {
    const parsed = mealInputSchema.safeParse(JSON.parse(String(formData.get("meal"))));
    if (!parsed.success) return { status: "error", error: "damaged recipe" };
    input = parsed.data;
  } catch {
    return { status: "error", error: "damaged recipe" };
  }
  const photo = formData.get("photo");

  const [same] = await db()
    .select({ id: meals.id })
    .from(meals)
    .where(sql`lower(trim(${meals.name})) = ${input.name.trim().toLowerCase()}`)
    .limit(1);
  if (same) return { status: "skipped" };

  try {
    await createMealFromInput(input, undefined, photo instanceof File && photo.size > 0 ? photo : undefined);
  } catch (e) {
    console.error("Recipe folder import failed", input.name, e);
    return { status: "error", error: "could not be saved" };
  } finally {
    dataChanged();
  }
  revalidatePath("/", "layout");
  return { status: "added" };
}

export type GitHubBackupState = { error?: string; message?: string; url?: string } | null;

export async function backupToGitHubNow(): Promise<GitHubBackupState> {
  await requireSite();
  if (!githubBackupConfig()) return { error: "GitHub backup isn't set up yet." };
  try {
    const r = await backupToGitHub();
    if (!r.commitUrl) return { message: "Already up to date: nothing changed since the last backup." };
    const parts = [
      r.added && `${r.added} new`,
      r.changed && `${r.changed} changed`,
      r.removed && `${r.removed} removed`,
    ].filter(Boolean);
    return { message: `Backed up${parts.length ? ` (${parts.join(", ")})` : ""}.`, url: r.commitUrl };
  } catch (e) {
    if (e instanceof GitHubBackupError) return { error: e.message };
    console.error("GitHub backup failed", e);
    return { error: "The backup failed. Please try again." };
  }
}
