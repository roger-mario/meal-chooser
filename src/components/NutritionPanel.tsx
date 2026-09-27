import { NUTRIENT_GROUPS, NUTRIENTS, type NutritionEstimate } from "@/lib/nutrients";

function fmt(value: number, unit: string) {
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : value >= 1 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

export function NutritionPanel({ nutrition }: { nutrition: NutritionEstimate }) {
  const { perServing } = nutrition;
  const headline = [
    { label: "Calories", value: `${Math.round(perServing.calories)}`, unit: "kcal" },
    { label: "Protein", value: perServing.protein.toFixed(0), unit: "g" },
    { label: "Carbs", value: perServing.carbohydrates.toFixed(0), unit: "g" },
    { label: "Fat", value: perServing.fat.toFixed(0), unit: "g" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 text-center">
        {headline.map((h) => (
          <div key={h.label} className="rounded-lg bg-emerald-50 p-3">
            <div className="text-xl font-semibold text-emerald-900">
              {h.value}
              <span className="ml-0.5 text-xs font-normal">{h.unit}</span>
            </div>
            <div className="text-xs text-emerald-800">{h.label}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-stone-600">{nutrition.summary}</p>

      {NUTRIENT_GROUPS.filter((g) => g.group !== "energy").map((g) => (
        <div key={g.group}>
          <h3 className="mb-1 text-sm font-semibold text-stone-700">{g.label}</h3>
          <table className="w-full text-sm">
            <tbody>
              {NUTRIENTS.filter((n) => n.group === g.group).map((n) => {
                const value = perServing[n.key] ?? 0;
                const dv = "dailyValue" in n ? n.dailyValue : undefined;
                const pct = dv ? Math.round((value / dv) * 100) : null;
                return (
                  <tr key={n.key} className="border-t border-stone-100">
                    <td className="py-1.5">{n.label}</td>
                    <td className="py-1.5 text-right tabular-nums">{fmt(value, n.unit)}</td>
                    <td className="w-32 py-1.5 pl-3">
                      {pct !== null && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded bg-stone-100">
                            <div
                              className="h-1.5 rounded bg-emerald-600"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-stone-500">{pct}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {nutrition.assumptions.length > 0 && (
        <details className="text-sm text-stone-600">
          <summary className="cursor-pointer font-medium">Assumptions ({nutrition.assumptions.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {nutrition.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs text-stone-400">
        AI estimate per serving, {nutrition.confidence} confidence. % of adult daily value. Not medical advice.
      </p>
    </div>
  );
}
