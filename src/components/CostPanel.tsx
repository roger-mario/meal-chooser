// Display only: the share page uses this, so it must not import server actions (see CostForm).
import { costPerServing, costTotal, formatChf, type CostEstimate } from "@/lib/cost";

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
