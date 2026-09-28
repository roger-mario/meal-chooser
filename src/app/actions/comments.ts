"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, mealComments } from "@/db";
import { getCurrentUser } from "@/lib/users";

export type ChatState = { error?: string; sent?: number } | null;

const MAX_LENGTH = 2000;

export async function sendComment(mealId: number, _prev: ChatState, formData: FormData): Promise<ChatState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Pick who you are at the top right first." };
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return null;
  if (body.length > MAX_LENGTH) return { error: `Please keep it under ${MAX_LENGTH} characters.` };
  await db().insert(mealComments).values({ mealId, userId: user.id, body });
  revalidatePath(`/meals/${mealId}`);
  return { sent: Date.now() };
}

/** People can only delete their own messages. */
export async function deleteComment(id: number) {
  const user = await getCurrentUser();
  if (!user) return;
  const [row] = await db()
    .delete(mealComments)
    .where(and(eq(mealComments.id, id), eq(mealComments.userId, user.id)))
    .returning({ mealId: mealComments.mealId });
  if (row) revalidatePath(`/meals/${row.mealId}`);
}
