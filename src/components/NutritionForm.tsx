import { saveManualNutrition } from "@/app/actions/meals";
import { NUTRIENT_GROUPS, NUTRIENTS, type NutritionEstimate } from "@/lib/nutrients";
import { SubmitButton } from "./SubmitButton";

export function NutritionForm({
  mealId,
  nutrition,
  open,
}: {
  mealId: number;
  nutrition: NutritionEstimate | null;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded-lg border border-stone-200">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        {nutrition ? "Edit values manually" : "Enter values manually"}
      </summary>
      <form action={saveManualNutrition.bind(null, mealId)} className="space-y-4 border-t border-stone-200 p-4">
        <p className="text-xs text-stone-500">Per serving. Leave anything you don&apos;t know empty.</p>
        {NUTRIENT_GROUPS.map((g) => (
          <fieldset key={g.group}>
            <legend className="mb-2 text-sm font-semibold text-stone-700">{g.label}</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {NUTRIENTS.filter((n) => n.group === g.group).map((n) => (
                <label key={n.key} className="text-xs text-stone-600">
                  {n.label} ({n.unit})
                  <input
                    name={n.key}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    defaultValue={nutrition?.perServing[n.key] ?? ""}
                    className="input mt-0.5 py-1"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="block text-xs text-stone-600">
          Notes
          <input name="notes" defaultValue={nutrition?.summary ?? ""} className="input mt-0.5" />
        </label>
        <SubmitButton>Save nutrition</SubmitButton>
      </form>
    </details>
  );
}
