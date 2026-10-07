import Link from "next/link";
import { planNextWeek } from "@/app/actions/labs";
import { RowButton } from "@/components/labs/LabsButtons";
import { SubmitButton } from "@/components/SubmitButton";
import { costPerServing, formatChf } from "@/lib/cost";
import { formatDay, todayISO } from "@/lib/dates";
import { mealHealth, scoreColor } from "@/lib/health";
import { addDays, addUp, gaps, isFishy, pctOf } from "@/lib/labs";
import { listLog, weekRules } from "@/lib/labs-queries";
import { formatMinutes, totalMinutes } from "@/lib/meal-fields";
import { listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const PLANT_GOAL = 30;

export default async function WeekPage() {
  const today = todayISO();
  const weekAgo = addDays(today, -6);
  const end = addDays(today, 7);
  const me = await getCurrentUser();
  const [meals, planned, eaten, rules] = await Promise.all([
    listMeals(),
    listLog(today, end, { planned: true }),
    me ? listLog(weekAgo, today, { userId: me.id }) : Promise.resolve([]),
    weekRules(),
  ]);
  const byId = new Map(meals.map((m) => [m.id, m]));
  const plan = planned.filter((p) => p.slot === "dinner");

  // The weekly check: the last 7 days of what this person logged.
  const eatenRows = eaten.map((e) => ({ ...e, meal: e.mealId ? (byId.get(e.mealId) ?? null) : null }));
  const loggedDays = new Set(eatenRows.map((e) => e.day)).size;
  const totals = addUp(eatenRows);
  const perDay = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / Math.max(1, loggedDays)]));
  const plantData = eatenRows.some((e) => e.meal?.nutrition?.ingredients?.some((i) => i.plant != null));
  const plants = new Set(
    eatenRows.flatMap((e) => e.meal?.nutrition?.ingredients?.filter((i) => i.plant).map((i) => i.name.toLowerCase().replace(/\s*\(.*\)/, "")) ?? []),
  );
  const fishMeals = eatenRows.filter((e) => e.meal && isFishy(e.meal)).length;
  const weekGaps = gaps(perDay, 70);

  const planIds = plan.map((p) => p.mealId).filter((id): id is number => id != null);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="card space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">🗓️ Week autopilot</h2>
          <p className="text-sm text-stone-500">
            Otao drafts dinners for the next 7 days from your meals: healthiest first, no repeats, following your rules. Swap any
            day you don&apos;t like.
          </p>
        </div>
        <form action={planNextWeek} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm">
              <span className="label">Weekdays max (min)</span>
              <input className="input" type="number" name="weekdayMinutes" min={0} max={240} step={5} defaultValue={rules.weekdayMinutes} inputMode="numeric" />
            </label>
            <label className="text-sm">
              <span className="label">🐟 Fish dinners</span>
              <input className="input" type="number" name="fishDinners" min={0} max={7} defaultValue={rules.fishDinners} inputMode="numeric" />
            </label>
            <label className="text-sm">
              <span className="label">👶 Baby-friendly</span>
              <input className="input" type="number" name="babyDinners" min={0} max={7} defaultValue={rules.babyDinners} inputMode="numeric" />
            </label>
            <label className="text-sm">
              <span className="label">Max CHF / portion</span>
              <input className="input" type="number" name="maxChf" min={0} max={100} step={0.5} defaultValue={rules.maxChf || ""} placeholder="any" inputMode="decimal" />
            </label>
          </div>
          <SubmitButton className="btn-primary w-full bg-violet-700 border-violet-700 hover:bg-violet-800 sm:w-auto" pendingText="Planning…">
            ✨ {plan.some((p) => p.day > today) ? "Plan the next 7 days again" : "Plan the next 7 days"}
          </SubmitButton>
          <p className="text-xs text-stone-400">0 means no limit. Rules are soft: with only a few meals saved, Otao picks the best it can.</p>
        </form>
      </section>

      {plan.length > 0 && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Dinners</h2>
            {planIds.length > 0 && (
              <Link href={`/labs/shopping?${planIds.map((id) => `m=${id}`).join("&")}`} className="btn">
                🛒 Shopping list for these
              </Link>
            )}
          </div>
          <ul className="card divide-y divide-stone-100">
            {plan.map((p) => {
              const meal = p.mealId ? byId.get(p.mealId) : undefined;
              const health = mealHealth(meal?.nutrition);
              const minutes = meal ? totalMinutes(meal) : null;
              const chf = meal ? costPerServing(meal.cost, meal.servings) : null;
              return (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-xs text-stone-500">{p.day === today ? "Today" : formatDay(p.day, { day: undefined, month: undefined })}</div>
                    <div className="text-lg leading-tight font-semibold">{Number(p.day.slice(8))}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    {meal ? (
                      <Link href={`/meals/${meal.id}`} className="block truncate font-medium hover:underline">
                        {meal.name}
                      </Link>
                    ) : (
                      <span className="text-stone-500">{p.label ?? "—"}</span>
                    )}
                    <div className="flex flex-wrap gap-x-2 text-xs text-stone-500">
                      {health && <span className={`rounded-full px-1.5 font-semibold ${scoreColor(health.score)}`}>♥ {health.score}</span>}
                      {minutes && <span>⏱ {formatMinutes(minutes)}</span>}
                      {chf != null && <span>{formatChf(chf)}</span>}
                      {meal?.babyFriendly && <span>👶</span>}
                      {meal && isFishy(meal) && <span>🐟</span>}
                    </div>
                  </div>
                  {p.day <= today && me ? <RowButton id={p.id} kind="ate" /> : <RowButton id={p.id} kind="swap" />}
                  <RowButton id={p.id} kind="remove" />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card space-y-3 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">🔎 Weekly check{me ? ` for ${me.name}` : ""}</h2>
          <p className="text-sm text-stone-500">
            The last 7 days of what you logged in <Link href="/labs/today" className="text-violet-700 hover:underline">Today</Link>
            {loggedDays ? `, averaged over ${loggedDays} day${loggedDays === 1 ? "" : "s"} with entries.` : "."}
          </p>
        </div>
        {!me ? (
          <p className="text-sm text-stone-500">Pick who you are at the top right first.</p>
        ) : loggedDays === 0 ? (
          <p className="text-sm text-stone-500">Nothing logged yet. Log a few days and the check fills in.</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {[
                {
                  label: plantData ? "Different plants" : "Plants: estimate nutrition again",
                  value: plantData ? `${plants.size} / ${PLANT_GOAL}` : "–",
                  ok: plants.size >= PLANT_GOAL,
                },
                { label: "Fibre per day", value: `${Math.round(perDay.fiber ?? 0)} / 30 g`, ok: (perDay.fiber ?? 0) >= 30 },
                { label: "Fish meals", value: `${fishMeals} / 2`, ok: fishMeals >= 2 },
                { label: "Sodium per day", value: `${Math.round(pctOf("sodium", perDay.sodium))}%`, ok: pctOf("sodium", perDay.sodium) <= 100 },
              ].map((s) => (
                <li key={s.label} className={`rounded-lg p-2.5 ${s.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
                  <div className="text-lg font-semibold tabular-nums">{s.value}</div>
                  <div className="text-xs">{s.label}</div>
                </li>
              ))}
            </ul>
            {weekGaps.length > 0 ? (
              <p className="text-sm text-stone-600">
                <span className="font-medium text-stone-800">Often low: </span>
                {weekGaps
                  .slice(0, 6)
                  .map((g) => `${g.def.label.replace(/ \(.*\)$/, "")} ${g.pct}%`)
                  .join(" · ")}
              </p>
            ) : (
              <p className="text-sm text-emerald-700">🎉 On average every vitamin and mineral reached 70%+ of the daily value.</p>
            )}
            <p className="text-xs text-stone-400">
              Targets: 30 different plant foods a week, about 30 g fibre a day, fish twice a week, sodium within the daily value.
              Meals typed in by hand don&apos;t count.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
