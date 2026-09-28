"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categories, db } from "@/db";
import { validEmoji } from "@/lib/emoji";

export type CategoryFormState = { ok?: boolean; error?: string } | null;

function parse(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#059669");
  const emoji = validEmoji(String(formData.get("emoji") ?? ""));
  if (!name) return { error: "Please enter a name." } as const;
  if (!emoji) return { error: "Please pick 1 to 3 emoji." } as const;
  return { name, color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#059669", emoji } as const;
}

export async function createCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const data = parse(formData);
  if ("error" in data) return { error: data.error };
  const inserted = await db().insert(categories).values(data).onConflictDoNothing().returning();
  if (inserted.length === 0) return { error: "A category with this name already exists." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCategory(
  id: number,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const data = parse(formData);
  if ("error" in data) return { error: data.error };
  try {
    await db().update(categories).set(data).where(eq(categories.id, id));
  } catch {
    return { error: "A category with this name already exists." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: number) {
  await db().delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}
