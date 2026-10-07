import { bringListToken } from "@/lib/bring";
import { mergeIngredients } from "@/lib/labs";
import { listMeals } from "@/lib/queries";
import { BringListButton, CopyListButton } from "@/components/labs/ShoppingButtons";

export const dynamic = "force-dynamic";

export default async function ShoppingPage({ searchParams }: PageProps<"/labs/shopping">) {
  const { m } = await searchParams;
  const picked = new Set((Array.isArray(m) ? m : m ? [m] : []).map(Number).filter(Number.isInteger));
  const meals = await listMeals();
  const chosen = meals.filter((meal) => picked.has(meal.id));
  const lines = mergeIngredients(chosen);

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-sm text-stone-600 sm:text-base">
        Tick the meals you&apos;ll cook. Otao adds up the same ingredients and leaves out basics like salt and oil.
      </p>
      <form className="card space-y-3 p-4" method="get">
        <ul className="grid gap-1 sm:grid-cols-2">
          {meals.map((meal) => (
            <li key={meal.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-stone-50">
                <input type="checkbox" name="m" value={meal.id} defaultChecked={picked.has(meal.id)} className="h-5 w-5 accent-violet-700" />
                <span className="flex-1 text-sm">{meal.name}</span>
                <span className="text-xs text-stone-400">{meal.servings} portions</span>
              </label>
            </li>
          ))}
        </ul>
        <button type="submit" className="btn w-full sm:w-auto">
          Make the list
        </button>
      </form>

      {chosen.length > 0 && (
        <section className="card space-y-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              🛒 {lines.length} item{lines.length === 1 ? "" : "s"} for {chosen.length} meal{chosen.length === 1 ? "" : "s"}
            </h2>
            <div className="flex gap-2">
              <CopyListButton text={lines.map((l) => `- ${l.text}`).join("\n")} />
              {lines.length > 0 && <BringListButton token={bringListToken(chosen.map((c) => c.id))} />}
            </div>
          </div>
          <ul className="divide-y divide-stone-100 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex items-baseline justify-between gap-3 py-2">
                <span>{l.text}</span>
                {l.from.length > 1 && <span className="shrink-0 text-xs text-stone-400">{l.from.length} meals</span>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400">Amounts are for each meal&apos;s full recipe ({chosen.map((c) => `${c.name}: ${c.servings}`).join(", ")} portions).</p>
        </section>
      )}
    </div>
  );
}
