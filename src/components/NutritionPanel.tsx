import { NUTRIENT_GROUPS, NUTRIENTS, type NutrientDef, type NutritionEstimate } from "@/lib/nutrients";

function fmt(value: number | undefined, unit: string) {
  if (value == null) return "–";
  const digits = value >= 100 ? 0 : value >= 1 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

/** Nutrients that are shown when they reach this share of the daily value in one serving. */
const RELEVANT_PCT = 10;
// Shown on their own at the top.
const HEADLINE = new Set(["calories", "protein", "carbohydrates", "fat"]);
// Worth knowing when high, even though they aren't "good" nutrients.
const LIMIT = new Set(["sodium", "saturatedFat", "addedSugars", "cholesterol"]);

type Row = { def: NutrientDef; value: number | undefined; pct: number | null };

function NutrientRow({ def, value, pct }: Row) {
  const limit = LIMIT.has(def.key);
  return (
    <tr className="border-t border-stone-100">
      <td className="py-1.5">{def.label}</td>
      <td className="py-1.5 text-right tabular-nums">{fmt(value, def.unit)}</td>
      <td className="w-28 py-1.5 pl-3 sm:w-36">
        {pct !== null && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded bg-stone-100">
              <div
                className={`h-1.5 rounded ${limit ? "bg-amber-500" : "bg-emerald-600"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-stone-500 tabular-nums">{pct}%</span>
          </div>
        )}
      </td>
    </tr>
  );
}

export function NutritionPanel({ nutrition }: { nutrition: NutritionEstimate }) {
  const { perServing } = nutrition;
  const headline = [
    { label: "Calories", value: perServing.calories, unit: "kcal" },
    { label: "Protein", value: perServing.protein, unit: "g" },
    { label: "Carbs", value: perServing.carbohydrates, unit: "g" },
    { label: "Fat", value: perServing.fat, unit: "g" },
  ].map((h) => ({ ...h, value: h.value == null ? "–" : Math.round(h.value).toString() }));
  const assumptions = nutrition.assumptions ?? [];

  const rows: Row[] = NUTRIENTS.filter((n) => !HEADLINE.has(n.key)).map((def) => {
    const value = perServing[def.key];
    const dv = "dailyValue" in def ? def.dailyValue : undefined;
    return { def, value, pct: dv && value != null ? Math.round((value / dv) * 100) : null };
  });
  // The nutrients this dish actually contributes, biggest first.
  const key = rows
    .filter((r) => r.pct !== null && r.pct >= RELEVANT_PCT && !LIMIT.has(r.def.key))
    .sort((a, b) => b.pct! - a.pct!);
  const watch = rows.filter((r) => LIMIT.has(r.def.key) && r.pct !== null && r.pct >= RELEVANT_PCT);
  const fiber = rows.find((r) => r.def.key === "fiber");
  const shown = new Set([...key, ...watch].map((r) => r.def.key));
  const rest = rows.filter((r) => !shown.has(r.def.key) && r.value != null);

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

      {nutrition.summary && <p className="text-sm text-stone-600">{nutrition.summary}</p>}

      <div>
        <h3 className="mb-1 text-sm font-semibold text-stone-700">Rich in</h3>
        {key.length ? (
          <table className="w-full text-sm">
            <tbody>
              {key.map((r) => (
                <NutrientRow key={r.def.key} {...r} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-stone-500">
            No vitamin or mineral reaches {RELEVANT_PCT}% of the daily value in one serving
            {fiber?.value != null ? ` (fiber: ${fmt(fiber.value, "g")})` : ""}.
          </p>
        )}
      </div>

      {watch.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-stone-700">Keep an eye on</h3>
          <table className="w-full text-sm">
            <tbody>
              {watch.map((r) => (
                <NutrientRow key={r.def.key} {...r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rest.length > 0 && (
        <details className="group text-sm">
          <summary className="cursor-pointer font-medium text-stone-600 hover:text-stone-900">
            All other nutrients ({rest.length})
          </summary>
          <div className="mt-2 space-y-3">
            {NUTRIENT_GROUPS.filter((g) => g.group !== "energy").map((g) => {
              const inGroup = rest.filter((r) => r.def.group === g.group);
              if (!inGroup.length) return null;
              return (
                <div key={g.group}>
                  <h4 className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">{g.label}</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {inGroup.map((r) => (
                        <NutrientRow key={r.def.key} {...r} />
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {(nutrition.ingredients?.length || assumptions.length > 0) && (
        <details className="text-sm text-stone-600">
          <summary className="cursor-pointer font-medium">How this was calculated</summary>
          {nutrition.ingredients && nutrition.ingredients.length > 0 && (
            <>
              <p className="mt-2 text-xs text-stone-500">
                Amounts used for the whole recipe, divided by {nutrition.servings} serving
                {nutrition.servings === 1 ? "" : "s"}:
              </p>
              <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
                {nutrition.ingredients.map((i, n) => (
                  <li key={n} className="flex justify-between border-b border-stone-100 py-1">
                    <span>{i.name}</span>
                    <span className="text-stone-500 tabular-nums">
                      {i.grams} g <span className="text-stone-400">({Math.round(i.grams / nutrition.servings)} g each)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {assumptions.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </details>
      )}
      <p className="text-xs text-stone-400">
        {nutrition.source === "manual"
          ? "Entered manually, per serving."
          : `AI estimate for one serving (1 of ${nutrition.servings})${nutrition.confidence ? `, ${nutrition.confidence} confidence` : ""}.`}{" "}
        % of adult daily value. Not medical advice.
      </p>
    </div>
  );
}
