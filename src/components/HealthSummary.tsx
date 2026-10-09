import { mealHealth, scoreColor } from "@/lib/health";
import type { NutritionEstimate } from "@/lib/nutrients";

/** Score, badges and what makes up the score. Display only, so the share page can use it too. */
export function HealthSummary({ nutrition }: { nutrition: NutritionEstimate }) {
  const health = mealHealth(nutrition);
  if (!health) return null;
  return (
    <div className="space-y-3 rounded-xl bg-stone-50 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full ${scoreColor(health.score)}`}>
          <span className="text-xl leading-none font-bold tabular-nums">{health.score}</span>
          <span className="text-[10px] leading-tight opacity-90">/ 100</span>
        </div>
        <p className="min-w-0 text-lg font-semibold text-stone-900">{health.label}</p>
      </div>
      {health.badges.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {health.badges.map((b) => (
            <li
              key={b.key}
              title={b.detail}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                b.tone === "good" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
              }`}
            >
              {b.emoji} {b.label} <span className="font-normal opacity-75">· {b.detail}</span>
            </li>
          ))}
        </ul>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-stone-600">How the score is made</summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          {health.parts
            .filter((p) => p.points !== 0)
            .map((p) => (
              <li key={p.label} className="flex justify-between gap-2">
                <span className="text-stone-600">{p.label}</span>
                <span className={`tabular-nums ${p.points > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                  {p.points > 0 ? "+" : ""}
                  {p.points}
                </span>
              </li>
            ))}
        </ul>
        <p className="mt-2 text-xs text-stone-400">
          How much good nutrition one serving brings, minus salt, saturated fat, added sugar and ultra-processed food.
          Starts at 20. Protein up to 30 g, fibre up to 10 g, plant variety up to 6 plants and omega-3 up to 1.5 g earn
          points, as do vitamins and minerals the dish is rich in for its calories. Sodium over 600 mg, saturated fat over
          5 g, added sugar over 5 g and ultra-processed ingredients cost points.
        </p>
      </details>
    </div>
  );
}
