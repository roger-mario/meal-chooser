import { readPrivateImage } from "@/lib/blob";

export async function GET(_req: Request, ctx: RouteContext<"/api/images/[...path]">) {
  const { path } = await ctx.params;
  const pathname = path.map(decodeURIComponent).join("/");
  if (!pathname.startsWith("meals/")) return new Response("Not found", { status: 404 });

  const result = await readPrivateImage(pathname).catch(() => null);
  if (!result || result.statusCode !== 200) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      // Blob pathnames have a random suffix, so the content never changes and Vercel's CDN can keep it.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
