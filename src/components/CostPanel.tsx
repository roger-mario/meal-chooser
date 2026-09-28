import { saveManualCost } from "@/app/actions/meals";
import { costPerServing, costTotal, formatChf, type CostEstimate } from "@/lib/cost";
import type { Ingredient } from "@/lib/meal-fields";
import { SubmitButton } from "./SubmitButton";

export function CostPanel({ cost, servings }: { cost: CostEstimate; servings: number }) {
  const total = costTotal(cost);
  const perServing = costPerServing(cost, servings)!;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-xl font-semibold text-amber-900">{formatChf(perServing)}</div>
          <div className="text-xs text-amber-800">per portion</div>
        </div>
        <div className="rounded-lg bg-stone-100 p-3">
          <div className="text-xl font-semibold text-stone-800">{formatChf(total)}</div>
          <div className="text-xs text-stone-600">
            whole meal · {servings} portion{servings === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {cost.items.map((i, idx) => (
            <tr key={idx} className="border-t border-stone-100">
              <td className="py-1.5">{i.name}</td>
              <td className="py-1.5 text-right tabular-nums">{i.chf.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cost.notes && <p className="text-sm text-stone-600">{cost.notes}</p>}
      <p className="text-xs text-stone-400">
        {cost.source === "manual" ? "Entered manually" : `AI estimate of ${cost.store} prices`}. Prices for the
        amount used, in CHF.
      </p>
    </div>
  );
}

export function CostForm({
  mealId,
  ingredients,
  cost,
}: {
  mealId: number;
  ingredients: Ingredient[];
  cost: CostEstimate | null;
}) {
  const priceFor = (name: string) => cost?.items.find((i) => i.name.toLowerCase() === name.toLowerCase())?.chf;
  return (
    <details className="rounded-lg border border-stone-200">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        {cost ? "Edit prices manually" : "Enter prices manually"}
      </summary>
      <form action={saveManualCost.bind(null, mealId)} className="space-y-3 border-t border-stone-200 p-4">
        {ingredients.length === 0 ? (
          <p className="text-sm text-stone-500">Add ingredients to the meal first.</p>
        ) : (
          <>
            <p className="text-xs text-stone-500">CHF for the amount used in the recipe. Leave empty to skip.</p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {ingredients.map((i, idx) => (
                <label key={idx} className="flex items-center gap-3 text-sm">
                  <input type="hidden" name="itemName" value={i.name} />
                  <span className="flex-1 truncate">{i.name}</span>
                  <input
                    name="itemChf"
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min={0}
                    defaultValue={priceFor(i.name) ?? ""}
                    placeholder="0.00"
                    className="input w-24 py-1 text-right"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs text-stone-600">
              Notes
              <input name="notes" defaultValue={cost?.notes ?? ""} className="input mt-0.5" />
            </label>
            <SubmitButton>Save prices</SubmitButton>
          </>
        )}
      </form>
    </details>
  );
}
