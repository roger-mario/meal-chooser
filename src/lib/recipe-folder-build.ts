import "server-only";
import { backupData, mealToInput } from "./backup";
import { readPrivateImage } from "./blob";
import { BACKUP_APP } from "./meal-input";
import { FOLDER_INDEX, FOLDER_VERSION, RECIPES_DIR, indexMarkdown, json, recipeMarkdown, uniqueSlugs } from "./recipe-folder";

const encoder = new TextEncoder();

function photoExtension(b: Uint8Array) {
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50) return "png";
  if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}

/** Downloads a meal photo from Blob; null when it's gone (the recipe is still exported). */
async function readPhoto(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith("/api/images/")) {
      const result = await readPrivateImage(decodeURIComponent(url.slice("/api/images/".length)));
      if (!result || result.statusCode !== 200) return null;
      return new Uint8Array(await new Response(result.stream).arrayBuffer());
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch (e) {
    console.error("Photo for recipe folder failed", url, e);
    return null;
  }
}

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** All files of the recipe folder (see recipe-folder.ts), by path. */
export async function buildRecipeFolder(): Promise<Map<string, Uint8Array>> {
  const { categories, meals } = await backupData();
  const slugs = uniqueSlugs(meals.map((m) => m.name));
  const photos = await mapLimited(meals, 6, (m) => (m.imageUrl ? readPhoto(m.imageUrl) : Promise.resolve(null)));

  const files = new Map<string, Uint8Array>();
  files.set(FOLDER_INDEX, encoder.encode(json({ app: BACKUP_APP, version: FOLDER_VERSION, categories })));
  const recipes = meals.map((m, i) => {
    const slug = slugs[i];
    const meal = mealToInput(m);
    const dir = `${RECIPES_DIR}/${slug}/`;
    const bytes = photos[i];
    const ext = bytes && photoExtension(bytes);
    const photo = ext ? `photo.${ext}` : undefined;
    if (photo) files.set(dir + photo, bytes!);
    files.set(dir + "recipe.json", encoder.encode(json(meal)));
    files.set(dir + "README.md", encoder.encode(recipeMarkdown(meal, photo)));
    return { slug, meal };
  });
  files.set("README.md", encoder.encode(indexMarkdown(recipes)));
  return files;
}
