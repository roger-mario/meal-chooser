"use server";

import { revalidatePath } from "next/cache";
import { aiErrorMessage } from "@/lib/ai-errors";
import { dataChanged } from "@/lib/cache";
import { fetchInstagramPost, listCreatorReels, parseInstagramUrl, parseUsername } from "@/lib/instagram";
import { findImported, importInstagramPost, type ImportResult } from "@/lib/recipe-import";
import { requireSite } from "@/lib/require-site";
import { getCurrentUser } from "@/lib/users";

export type LinkImport = ImportResult | { status: "failed"; error: string };

/** Imports one Instagram post or reel as a private meal. The page calls this once per link, one after another. */
export async function importInstagramLink(link: string, photo: boolean): Promise<LinkImport> {
  await requireSite();
  if (!parseInstagramUrl(link)) return { status: "failed", error: "Not a link to an Instagram post or reel." };
  try {
    const post = await fetchInstagramPost(link);
    const me = await getCurrentUser();
    const result = await importInstagramPost(post, { authorId: me?.id ?? null, photo });
    if (result.status === "created") {
      dataChanged();
      revalidatePath("/", "layout");
    }
    return result;
  } catch (e) {
    return { status: "failed", error: e instanceof Error && !/gateway|model/i.test(e.message) ? e.message : aiErrorMessage(e) };
  }
}

/** A creator's latest reel links that aren't in Otao yet (needs the Business Discovery settings). */
export async function creatorReelLinks(username: string): Promise<{ links?: string[]; error?: string }> {
  await requireSite();
  const name = parseUsername(username);
  if (!name) return { error: "That isn't an Instagram username." };
  try {
    const reels = await listCreatorReels(name, 25);
    if (!reels) return { error: "not-configured" };
    const fresh = [];
    for (const r of reels) if (!(await findImported(r.permalink))) fresh.push(r.permalink);
    return { links: fresh };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Instagram error" };
  }
}
