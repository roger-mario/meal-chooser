import { readBringListToken, recipePage } from "@/lib/bring";
import { mergeIngredients } from "@/lib/labs";
import { listMealsLive } from "@/lib/queries";

// Public page that Bring! reads for the Labs shopping list: several meals' ingredients merged into one list.
export async function GET(_req: Request, ctx: RouteContext<"/api/bring/list/[token]">) {
  const ids = readBringListToken((await ctx.params).token);
  if (!ids) return new Response("Not found", { status: 404 });
  const chosen = (await listMealsLive()).filter((m) => ids.includes(m.id));
  if (!chosen.length) return new Response("Not found", { status: 404 });
  const name = chosen.length === 1 ? chosen[0].name : `Otao: ${chosen.length} meals`;
  return recipePage(name, 1, mergeIngredients(chosen).map((l) => l.text));
}
