import Link from "next/link";
import { LogMealForm } from "@/components/labs/LogMealForm";
import { RowButton } from "@/components/labs/LabsButtons";
import { logDinner } from "@/app/actions/labs";
import { MealImage } from "@/components/MealImage";
import { formatDay, todayISO } from "@/lib/dates";
import { mealHealth, scoreColor } from "@/lib/health";
import {
  addDays,
  addUp,
  gaps,
  isDay,
  KCAL_TARGET,
  pctOf,
  SLOTS,
  suggestMeals,
  TARGETS,
  type SuggestFilters,
} from "@/lib/labs";
import { listLog, recentMealIds, usualMealIds } from "@/lib/labs-queries";
import { formatMinutes, totalMinutes } from "@/lib/meal-fields";
import { listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

function Bar({ pct, tone = "good" }: { pct: number; tone?: "good" | "watch" }) {
  return (
    <div className="h-1.5 flex-1 rounded bg-stone-100">
      <div className={`h-1.5 rounded ${tone === "good" ? "bg-violet-600" : "bg-amber-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default async function TodayPage({ searchParams }: PageProps<"/labs/today">) {
  const sp = await searchParams;
  const today = todayISO();
  const day = isDay(sp.day) ? sp.day : today;
  const filters: SuggestFilters = { quick: sp.quick === "1", baby: sp.baby === "1", veggie: sp.veggie === "1" };
  const me = await getCurrentUser();
  if (!me) {
    return <p className="card p-4 text-sm text-stone-600">Pick who you are at the top right first, so Otao knows whose day this is.</p>;
  }

  const [meals, entries, planned, recent, ...usual] = await Promise.all([
    listMeals(),
    listLog(day, day, { userId: me.id }),
    listLog(day, day, { planned: true }),
    recentMealIds(day),
    ...SLOTS.map((s) => usualMealIds(me.id, s.value)),
  ]);
  const byId = new Map(meals.map((m) => [m.id, m]));
  const rows = entries.map((e) => ({ ...e, meal: e.mealId ? (byId.get(e.mealId) ?? null) : null }));
  const totals = addUp(rows);
  const missing = gaps(totals);
  const dinnerLogged = rows.some((r) => r.slot === "dinner");
  const plannedDinner = planned.find((p) => p.slot === "dinner");
  // Nothing eaten in the last week, today included.
  for (const r of rows) if (r.mealId) recent.add(r.mealId);
  const suggestions = dinnerLogged ? [] : suggestMeals(meals, totals, { recent, filters });
  const options = meals.map((m) => ({ id: m.id, name: m.name, kcal: m.nutrition?.perServing.calories ?? null }));
  const kcal = totals.calories ?? 0;
  const href = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { day: day === today ? null : day, quick: sp.quick as string, baby: sp.baby as string, veggie: sp.veggie as string, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return p.size ? `/labs/today?${p}` : "/labs/today";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={href({ day: addDays(day, -1) })} className="btn px-3" aria-label="Day before">
          ‹
        </Link>
        <div className="text-center">
          <p className="font-semibold">{day === today ? "Today" : formatDay(day, { weekday: "long" })}</p>
          <p className="text-xs text-stone-500">
            {formatDay(day, { weekday: undefined, day: "numeric", month: "long" })} · {me.name}
          </p>
        </div>
        <Link href={href({ day: addDays(day, 1) === today ? null : addDays(day, 1) })} className="btn px-3" aria-label="Next day">
          ›
        </Link>
      </div>

      <section className="card space-y-3 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "kcal", value: Math.round(kcal), of: KCAL_TARGET },
            { label: "protein g", value: Math.round(totals.protein ?? 0), of: 50 },
            { label: "fibre g", value: Math.round(totals.fiber ?? 0), of: 28 },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-violet-50 p-2.5">
              <div className="text-lg font-semibold text-violet-900 tabular-nums">{s.value}</div>
              <div className="text-xs text-violet-800">
                {s.label} <span className="text-violet-500">/ {s.of}</span>
              </div>
            </div>
          ))}
        </div>
        {rows.some((r) => r.meal?.nutrition) ? (
          missing.length > 0 ? (
            <p className="text-sm text-stone-600">
              <span className="font-medium text-stone-800">Still low today: </span>
              {missing
                .slice(0, 6)
                .map((g) => `${g.def.label.replace(/ \(.*\)$/, "")} ${g.pct}%`)
                .join(" · ")}
            </p>
          ) : (
            <p className="text-sm text-emerald-700">🎉 Every vitamin and mineral is at 70%+ of the daily value.</p>
          )
        ) : (
          <p className="text-sm text-stone-500">Add what you ate and Otao shows what&apos;s still missing today.</p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-stone-600">All targets</summary>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {TARGETS.map((n) => {
              const pct = Math.round(pctOf(n.key, totals[n.key]));
              return (
                <li key={n.key} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-stone-600">{n.label.replace(/ \(.*\)$/, "")}</span>
                  <Bar pct={pct} />
                  <span className="w-9 text-right tabular-nums text-stone-500">{pct}%</span>
                </li>
              );
            })}
            {(["sodium", "saturatedFat", "addedSugars"] as const).map((k) => {
              const pct = Math.round(pctOf(k, totals[k]));
              return (
                <li key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-stone-600">{{ sodium: "Sodium (limit)", saturatedFat: "Sat. fat (limit)", addedSugars: "Added sugar (limit)" }[k]}</span>
                  <Bar pct={pct} tone="watch" />
                  <span className="w-9 text-right tabular-nums text-stone-500">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      <section className="space-y-3">
        {SLOTS.map((s, i) => {
          const inSlot = rows.filter((r) => r.slot === s.value);
          const usualOptions = usual[i].map((id) => options.find((o) => o.id === id)).filter((o) => o && !inSlot.some((r) => r.mealId === o.id)) as typeof options;
          return (
            <div key={s.value} className="card space-y-2 p-4">
              <h2 className="font-semibold">
                {s.emoji} {s.label}
              </h2>
              {inSlot.length > 0 && (
                <ul className="divide-y divide-stone-100">
                  {inSlot.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 py-1.5 text-sm">
                      {r.meal ? (
                        <Link href={`/meals/${r.meal.id}`} className="flex-1 truncate hover:underline">
                          {r.meal.name}
                        </Link>
                      ) : (
                        <span className="flex-1 truncate text-stone-600">{r.label}</span>
                      )}
                      {r.meal?.nutrition?.perServing.calories != null && (
                        <span className="text-xs text-stone-500">{Math.round(r.meal.nutrition.perServing.calories * r.portions)} kcal</span>
                      )}
                      <RowButton id={r.id} kind="remove" />
                    </li>
                  ))}
                </ul>
              )}
              {s.value === "dinner" && plannedDinner && !inSlot.length && (
                <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm">
                  <span className="flex-1">
                    Planned: <span className="font-medium">{byId.get(plannedDinner.mealId ?? -1)?.name ?? plannedDinner.label}</span>
                  </span>
                  <RowButton id={plannedDinner.id} kind="ate" />
                </div>
              )}
              <LogMealForm day={day} slot={s.value} meals={options} usual={usualOptions} />
            </div>
          );
        })}
      </section>

      {!dinnerLogged && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">🍽️ What&apos;s for dinner?</h2>
            <p className="text-sm text-stone-500">
              Your meals that best fill what today still misses, without too much salt or too many calories. Meals from the last 7
              days are skipped.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["quick", "⏱ 30 min or less"],
                ["baby", "👶 Baby-friendly"],
                ["veggie", "🥕 Veggie"],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                href={href({ [k]: filters[k] ? null : "1" })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                  filters[k] ? "bg-violet-700 text-white ring-violet-700" : "bg-white text-stone-700 ring-stone-200 hover:bg-stone-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          {suggestions.length === 0 ? (
            <p className="card p-4 text-sm text-stone-500">
              No meal fits. Try fewer filters, or estimate nutrition for more meals (only meals with nutrition values can be suggested).
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3">
              {suggestions.map(({ meal, fills }) => {
                const health = mealHealth(meal.nutrition);
                const minutes = totalMinutes(meal);
                return (
                  <li key={meal.id} className="card flex flex-col overflow-hidden">
                    <Link href={`/meals/${meal.id}`} className="relative block">
                      <MealImage src={meal.imageUrl} alt={meal.name} sizes="(min-width: 640px) 30vw, 100vw" />
                      {health && (
                        <span className={`absolute right-2 bottom-2 rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(health.score)}`}>
                          ♥ {health.score}
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <Link href={`/meals/${meal.id}`} className="font-semibold hover:underline">
                        {meal.name}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {Math.round(meal.nutrition!.perServing.calories!)} kcal
                        {minutes ? ` · ⏱ ${formatMinutes(minutes)}` : ""}
                      </p>
                      {fills.length > 0 && (
                        <p className="text-xs text-stone-600">
                          <span className="font-medium text-violet-800">Fills: </span>
                          {fills.map((f) => `${f.label} +${f.pct}%`).join(", ")}
                        </p>
                      )}
                      <form action={logDinner} className="mt-auto">
                        <input type="hidden" name="day" value={day} />
                        <input type="hidden" name="mealId" value={meal.id} />
                        <button type="submit" className="btn w-full">
                          ✓ We&apos;re having this
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

