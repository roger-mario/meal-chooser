import { zipSync, type Zippable } from "fflate";
import { todayISO } from "@/lib/dates";
import { buildRecipeFolder } from "@/lib/recipe-folder-build";

export const maxDuration = 120;

// Protected by the site password like every other page (see proxy.ts).
export async function GET() {
  const files = await buildRecipeFolder();
  const folder = `otao-recipes-${todayISO()}`;
  const zippable: Zippable = {};
  // Photos are already compressed; only the text files are worth deflating.
  for (const [path, bytes] of files) zippable[`${folder}/${path}`] = [bytes, { level: /\.(jpg|png|webp)$/.test(path) ? 0 : 6 }];
  const zip = zipSync(zippable);
  return new Response(new Blob([zip as Uint8Array<ArrayBuffer>]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folder}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
