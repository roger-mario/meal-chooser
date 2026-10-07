import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { findDatabaseUrl } from "../../scripts/database-url.mjs";
import { formatIngredient, type Ingredient } from "@/lib/meal-fields";

// Bring!'s own import: their servers open a public page of ours and read the
// ingredients from its recipe markup, then the app asks which list to add them to.
// Links are signed so only meals opened from inside the app can be read.

function secret() {
  const key = process.env.BRING_SECRET || findDatabaseUrl();
  if (!key) throw new Error("DATABASE_URL is not set");
  return key;
}

function sign(mealId: number) {
  return createHmac("sha256", secret()).update(`bring:${mealId}`).digest("base64url").slice(0, 22);
}

export function bringToken(mealId: number) {
  return `${mealId}-${sign(mealId)}`;
}

/** Returns the meal id, or null when the token was not made by bringToken(). */
export function readBringToken(token: string): number | null {
  const m = token.match(/^(\d{1,9})-([A-Za-z0-9_-]{22})$/);
  if (!m) return null;
  const id = Number(m[1]);
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(m[2]);
  return timingSafeEqual(expected, given) ? id : null;
}

/** Basics like salt or oil are usually at home, so they stay off the shopping list. */
export function bringLines(ingredients: Ingredient[]) {
  return ingredients.filter((i) => !i.staple && i.name.trim()).map((i) => formatIngredient(i));
}

// Several meals at once (the Labs shopping list): the meal ids, signed the same way.
function signList(ids: number[]) {
  return createHmac("sha256", secret()).update(`bring-list:${ids.join(".")}`).digest("base64url").slice(0, 22);
}

export function bringListToken(ids: number[]) {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  return `${sorted.join(".")}-${signList(sorted)}`;
}

/** Returns the meal ids, or null when the token was not made by bringListToken(). */
export function readBringListToken(token: string): number[] | null {
  const m = token.match(/^(\d{1,9}(?:\.\d{1,9}){0,29})-([A-Za-z0-9_-]{22})$/);
  if (!m) return null;
  const ids = m[1].split(".").map(Number);
  const expected = Buffer.from(signList(ids));
  const given = Buffer.from(m[2]);
  return timingSafeEqual(expected, given) ? ids : null;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The page Bring! reads: a name and ingredient lines as a schema.org Recipe (JSON-LD and microdata, since importers differ). */
export function recipePage(name: string, servings: number, lines: string[]) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name,
    recipeYield: String(servings),
    recipeIngredient: lines,
  }).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${escape(name)}</title>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<div itemscope itemtype="https://schema.org/Recipe">
<h1 itemprop="name">${escape(name)}</h1>
<p>Servings: <span itemprop="recipeYield">${servings}</span></p>
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
