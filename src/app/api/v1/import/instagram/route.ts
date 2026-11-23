import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkApiKey } from "@/lib/api-auth";
import { aiErrorMessage } from "@/lib/ai-errors";
import { dataChanged } from "@/lib/cache";
import { fetchInstagramPost, listCreatorReels, parseUsername, type InstagramPost } from "@/lib/instagram";
import { importInstagramPost } from "@/lib/recipe-import";

export const maxDuration = 300;

const bodySchema = z.object({
  /** Links to posts or reels. */
  urls: z.array(z.string().max(500)).max(20).optional(),
  /** A creator: their latest reels (needs the Business Discovery settings, see src/lib/instagram.ts). */
  username: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(25).optional(),
  /** Only read the recipes, don't save them. */
  dryRun: z.boolean().optional(),
  /** Use Instagram's preview picture as the meal photo (default true). */
  photo: z.boolean().optional(),
  categories: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
  minQuality: z.number().int().min(1).max(5).optional(),
});

/** Imports recipes from Instagram posts, one after another (Instagram and the AI both dislike bursts). */
export async function POST(request: Request) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid body.", issues: parsed.error.issues }, { status: 400 });
  const { urls = [], username, limit = 10, ...opts } = parsed.data;

  const posts: (InstagramPost | { link: string; error: string })[] = [];
  if (username) {
    const name = parseUsername(username);
    if (!name) return Response.json({ error: "That isn't an Instagram username." }, { status: 400 });
    try {
      const reels = await listCreatorReels(name, limit);
      if (!reels) {
        return Response.json(
          { error: "Listing a creator's reels needs INSTAGRAM_GRAPH_TOKEN and INSTAGRAM_BUSINESS_ID. Send the reel links in urls instead." },
          { status: 501 },
        );
      }
      posts.push(...reels);
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "Instagram error" }, { status: 502 });
    }
  }
  for (const link of urls) {
    try {
      posts.push(await fetchInstagramPost(link));
    } catch (e) {
      posts.push({ link, error: e instanceof Error ? e.message : "Instagram error" });
    }
  }

  const origin = new URL(request.url).origin;
  const results = [];
  for (const p of posts) {
    if ("error" in p) {
      results.push({ link: p.link, status: "failed", error: p.error });
      continue;
    }
    try {
      const r = await importInstagramPost(p, opts);
      results.push({ link: p.permalink, ...r, ...("id" in r ? { url: `${origin}/meals/${r.id}` } : {}) });
    } catch (e) {
      results.push({ link: p.permalink, status: "failed", error: aiErrorMessage(e) });
    }
  }
  if (results.some((r) => r.status === "created")) {
    dataChanged();
    revalidatePath("/", "layout");
  }
  return Response.json({ results });
}
