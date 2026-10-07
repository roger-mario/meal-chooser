import { saveManualCost } from "@/app/actions/meals";
import type { CostEstimate } from "@/lib/cost";
import type { Ingredient } from "@/lib/meal-fields";
import { SubmitButton } from "./SubmitButton";

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
