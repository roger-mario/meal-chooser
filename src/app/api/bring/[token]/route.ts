import { bringLines, readBringToken } from "@/lib/bring";
import { getMeal } from "@/lib/queries";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Public page that Bring! reads when importing a meal: only the name and the ingredients,
// as a schema.org Recipe (JSON-LD and microdata, since importers differ in what they read).
export async function GET(_req: Request, ctx: RouteContext<"/api/bring/[token]">) {
  const id = readBringToken((await ctx.params).token);
  const meal = id == null ? null : await getMeal(id);
  if (!meal) return new Response("Not found", { status: 404 });

  const lines = bringLines(meal.ingredients);
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: meal.name,
    recipeYield: String(meal.servings),
    recipeIngredient: lines,
  }).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${escape(meal.name)}</title>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<div itemscope itemtype="https://schema.org/Recipe">
<h1 itemprop="name">${escape(meal.name)}</h1>
<p>Servings: <span itemprop="recipeYield">${meal.servings}</span></p>
<ul>
${lines.map((l) => `<li itemprop="recipeIngredient">${escape(l)}</li>`).join("\n")}
</ul>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
