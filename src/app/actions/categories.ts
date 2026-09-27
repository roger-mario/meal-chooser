"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categories, db } from "@/db";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#16a34a");
  if (!name) return;
  await db().insert(categories).values({ name, color }).onConflictDoNothing();
  revalidatePath("/", "layout");
}

export async function renameCategory(id: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#16a34a");
  if (!name) return;
  await db().update(categories).set({ name, color }).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: number) {
  await db().delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}
