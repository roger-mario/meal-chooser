"use server";

import { revalidatePath } from "next/cache";
import { dataChanged } from "@/lib/cache";
import { categories, db, meals } from "@/db";
import { deleteMealImage } from "@/lib/blob";
import { backupSchema } from "@/lib/meal-input";
import { createMealFromInput, ensureCategories } from "@/lib/meal-store";
import { requireSite } from "@/lib/require-site";

export type ImportState = { error?: string; message?: string } | null;

export async function importBackup(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireSite();
  const file = formData.get("file");
  const mode = formData.get("mode") === "replace" ? "replace" : "merge";
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a backup file." };
  if (file.size > 10 * 1024 * 1024) return { error: "This file is too large to be a backup." };

  let parsed;
  try {
    parsed = backupSchema.safeParse(JSON.parse(await file.text()));
  } catch {
    return { error: "This file is not an Otao backup (not valid JSON)." };
  }
  if (!parsed.success) return { error: "This file is not an Otao backup, or it is damaged." };
  const backup = parsed.data;

  try {
    if (mode === "replace") {
      const old = await db().select({ imageUrl: meals.imageUrl }).from(meals);
      await db().delete(meals);
      await db().delete(categories);
      await Promise.all(old.map((m) => deleteMealImage(m.imageUrl)));
    }

    const allNames = [...backup.categories.map((c) => c.name), ...backup.meals.flatMap((m) => m.categories ?? [])];
    const categoryIds = await ensureCategories(allNames, backup.categories);

    const existing = new Set(
      (await db().select({ name: meals.name }).from(meals)).map((m) => m.name.trim().toLowerCase()),
    );
    let added = 0;
    let skipped = 0;
    for (const meal of backup.meals) {
      if (existing.has(meal.name.trim().toLowerCase())) {
        skipped++;
        continue;
      }
      await createMealFromInput(meal, categoryIds);
      existing.add(meal.name.trim().toLowerCase());
      added++;
    }
    dataChanged();
    revalidatePath("/", "layout");
    return {
      message:
        `Imported ${added} meal${added === 1 ? "" : "s"} and ${backup.categories.length} categories.` +
        (skipped ? ` Skipped ${skipped} meal${skipped === 1 ? "" : "s"} that already existed.` : ""),
    };
  } catch (e) {
    dataChanged();
    console.error("Import failed", e);
    return { error: "The import failed part-way. Please try again." };
  }
}
