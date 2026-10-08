import type { ReactNode } from "react";
import { NUTRIENTS, POORLY_TABULATED, type NutrientDef, type NutrientKey, type NutritionEstimate } from "@/lib/nutrients";

function fmt(value: number | undefined, unit: string) {
  if (value == null) return "–";
  const digits = value >= 100 ? 0 : value >= 1 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

/** Nutrients listed when one serving gives at least this share of the daily value ("good source" on food labels). */
const RICH_PCT = 10;
/** Nutrients to limit are flagged when one serving uses this much of the day's budget (a third of the day). */
const WATCH_PCT = 30;
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

export function NutritionPanel({
  nutrition,
  details,
  detailsOpen = false,
}: {
  nutrition: NutritionEstimate;
  /** Extra content for the details section, e.g. the re-estimate button and the manual form. */
  details?: ReactNode;
  detailsOpen?: boolean;
}) {
  const { perServing } = nutrition;
  const headline = [
    { label: "Calories", value: perServing.calories, unit: "kcal" },
    { label: "Protein", value: perServing.protein, unit: "g" },
    { label: "Carbs", value: perServing.carbohydrates, unit: "g" },
    { label: "Fat", value: perServing.fat, unit: "g" },
  ].map((h) => ({ ...h, value: h.value == null ? "–" : Math.round(h.value).toString() }));
  const assumptions = nutrition.assumptions ?? [];
  const ingredients = nutrition.ingredients ?? [];

  const rows: Row[] = NUTRIENTS.filter((n) => !HEADLINE.has(n.key) && !POORLY_TABULATED.has(n.key)).map((def) => {
    const value = perServing[def.key];
    const dv = "dailyValue" in def ? def.dailyValue : undefined;
    return { def, value, pct: dv && value != null ? Math.round((value / dv) * 100) : null };
  });
  // Only what this dish really contributes, biggest first. Small amounts of common nutrients are left out.
  const rich = rows
    .filter((r) => r.pct !== null && r.pct >= RICH_PCT && !LIMIT.has(r.def.key))
    .sort((a, b) => b.pct! - a.pct!);
  const watch = rows.filter((r) => LIMIT.has(r.def.key) && r.pct !== null && r.pct >= WATCH_PCT);
  const fiber = perServing.fiber;

  // The ingredients that bring most of a nutrient, e.g. "salt 72%, pepperoni 15%".
  const sourcesOf = (key: NutrientKey) => {
    const total = perServing[key] ?? 0;
    if (!total) return [];
    return ingredients
      .map((i) => ({ name: i.name, share: ((i.perServing?.[key] ?? 0) / total) * 100 }))
      .filter((x) => x.share >= 10)
      .sort((a, b) => b.share - a.share)
      .slice(0, 3);
  };

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

      {nutrition.source === "manual" && nutrition.summary && <p className="text-sm text-stone-600">{nutrition.summary}</p>}

      <div>
        <h3 className="mb-1 text-sm font-semibold text-stone-700">
          Rich in <span className="font-normal text-stone-400">(10%+ of the daily value per serving)</span>
        </h3>
        {rich.length ? (
          <table className="w-full text-sm">
            <tbody>
              {rich.map((r) => (
                <NutrientRow key={r.def.key} {...r} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-stone-500">
            No vitamin or mineral reaches {RICH_PCT}% of the daily value in one serving
            {fiber != null ? ` (fiber: ${fmt(fiber, "g")})` : ""}.
          </p>
        )}
      </div>

      {watch.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-stone-700">Keep an eye on</h3>
          <table className="w-full text-sm">
            <tbody>
              {watch.map((r) => {
                const from = sourcesOf(r.def.key as NutrientKey);
                return [
                  <NutrientRow key={r.def.key} {...r} />,
                  from.length > 0 && (
                    <tr key={`${r.def.key}-from`}>
                      <td colSpan={3} className="pb-1.5 text-xs text-stone-500">
                        Mostly from {from.map((f) => `${f.name} (${Math.round(f.share)}%)`).join(", ")}
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      <details open={detailsOpen} className="group rounded-lg border border-stone-200 text-sm">
        <summary className="cursor-pointer px-4 py-3 font-medium text-stone-700">Details, sources and re-estimate</summary>
        <div className="space-y-4 border-t border-stone-200 p-4">
          {ingredients.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-stone-500">
                Per serving ({nutrition.servings === 1 ? "the whole recipe" : `1 of ${nutrition.servings}`}), from each ingredient:
              </p>
              <table className="w-full text-xs">
                <thead className="text-stone-500">
                  <tr>
                    <th className="py-1 text-left font-medium">Ingredient</th>
                    <th className="py-1 text-right font-medium">g</th>
                    <th className="py-1 text-right font-medium">kcal</th>
                    <th className="py-1 text-right font-medium">Protein</th>
                    <th className="py-1 text-right font-medium">Fibre</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((i, n) => (
                    <tr key={n} className="border-t border-stone-100 align-top">
                      <td className="py-1.5 pr-2">
                        {i.name}
                        {i.source && <span className="block text-[11px] text-stone-400">{i.source}</span>}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{Math.round(i.grams / nutrition.servings)}</td>
                      <td className="py-1.5 text-right tabular-nums">{i.perServing ? Math.round(i.perServing.calories ?? 0) : "–"}</td>
                      <td className="py-1.5 text-right tabular-nums">{i.perServing ? (i.perServing.protein ?? 0).toFixed(1) : "–"}</td>
                      <td className="py-1.5 text-right tabular-nums">{i.perServing ? (i.perServing.fiber ?? 0).toFixed(1) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {assumptions.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-stone-600">
              {assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-stone-500">
            {nutrition.source === "manual"
              ? "Entered manually, per serving. "
              : "Values per 100 g come from the USDA food table (FoodData Central); the AI only reads the amounts and picks the matching food. "}
            % is the share of the adult Daily Value used on food labels (US FDA 2020), e.g. calcium 1300 mg, fibre 28 g,
            protein 50 g, vitamin D 20 µg, sodium 2300 mg, on a 2000 kcal day. Not medical advice.
          </p>
          {details}
        </div>
      </details>
    </div>
  );
}
