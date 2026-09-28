import Link from "next/link";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { generatePlan, removePlanEntry, setPlanEntry } from "@/app/actions/plan";
import { SubmitButton } from "@/components/SubmitButton";
import { db, MEAL_SLOTS, meals, planEntries } from "@/db";
import {
  dateRange,
  formatDay,
  formatMonth,
  rangeDates,
  shiftMonth,
  todayISO,
  weekdayIndex,
  type PlanRange,
} from "@/lib/dates";
import { formatQuantity, ingredientKey, normalizeIngredients, type Ingredient } from "@/lib/meal-fields";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RANGES: { key: PlanRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "Next 7 days" },
  { key: "month", label: "Month" },
];

export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const sp = await searchParams;
  const range = (RANGES.some((r) => r.key === sp.range) ? sp.range : "week") as PlanRange;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayISO().slice(0, 7);
  const { start, end } = rangeDates(range, month);
  const days = dateRange(start, end);

  const [entries, allMeals, categories] = await Promise.all([
    db()
      .select({ entry: planEntries, meal: meals })
      .from(planEntries)
      .innerJoin(meals, eq(meals.id, planEntries.mealId))
      .where(and(gte(planEntries.date, start), lte(planEntries.date, end)))
      .orderBy(asc(planEntries.date)),
    db().select({ id: meals.id, name: meals.name }).from(meals).orderBy(asc(meals.name)),
    listCategories(),
  ]);
  const byKey = new Map(entries.map((e) => [`${e.entry.date}|${e.entry.slot}`, e]));

  // Combined shopping list for everything planned in this range.
  // Same ingredient + unit is summed ("200 g" + "300 g" = "500 g").
  const shopping = new Map<string, Ingredient>();
  const basics = new Set<string>();
  for (const { meal } of entries) {
    for (const item of normalizeIngredients(meal.ingredients)) {
      if (item.staple) {
        basics.add(item.name.toLowerCase());
        continue;
      }
      const key = `${ingredientKey(item.name)}|${item.unit ?? ""}`;
      const prev = shopping.get(key);
      if (!prev) shopping.set(key, { ...item });
      else if (prev.quantity != null || item.quantity != null)
        prev.quantity = (prev.quantity ?? 0) + (item.quantity ?? 0);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-2xl font-semibold">Meal plan</h1>
        {RANGES.map((r) => (
          <Link key={r.key} href={`/plan?range=${r.key}`} className={range === r.key ? "btn-primary" : "btn"}>
            {r.label}
          </Link>
        ))}
      </div>

      <form action={generatePlan} className="card flex flex-wrap items-end gap-4 p-4">
        <input type="hidden" name="range" value={range} />
        <input type="hidden" name="month" value={month} />
        <div>
          <label className="label" htmlFor="categoryId">Suggest from</label>
          <select id="categoryId" name="categoryId" className="input">
            <option value="">All meals</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="label">Slots</legend>
          <div className="flex gap-3 py-2">
            {MEAL_SLOTS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm capitalize">
                <input type="checkbox" name="slots" value={s} defaultChecked={s === "dinner"} />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-1.5 py-2 text-sm">
          <input type="checkbox" name="replace" /> Replace existing
        </label>
        <SubmitButton pendingText="Planning…">Suggest plan</SubmitButton>
      </form>

      {range === "month" ? (
        <MonthGrid month={month} days={days} byKey={byKey} />
      ) : (
        <div className="space-y-4">
          {days.map((date) => (
            <section key={date} className="card p-4">
              <h2 className="mb-3 font-semibold">{formatDay(date, { weekday: "long" })}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {MEAL_SLOTS.map((slot) => {
                  const e = byKey.get(`${date}|${slot}`);
                  return (
                    <div key={slot} className="flex items-center gap-2 rounded-lg bg-stone-50 p-2 text-sm">
                      <span className="w-20 shrink-0 capitalize text-stone-500">{slot}</span>
                      {e ? (
                        <>
                          <Link href={`/meals/${e.meal.id}`} className="flex-1 font-medium hover:underline">
                            {e.meal.name}
                          </Link>
                          <form action={removePlanEntry.bind(null, e.entry.id)}>
                            <button className="text-stone-400 hover:text-red-600" aria-label="Remove">
                              ✕
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={setPlanEntry} className="flex flex-1 gap-2">
                          <input type="hidden" name="date" value={date} />
                          <input type="hidden" name="slot" value={slot} />
                          <select name="mealId" className="input py-1" defaultValue="" required>
                            <option value="" disabled>
                              Pick a meal…
                            </option>
                            {allMeals.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <SubmitButton className="btn py-1" pendingText="…">
                            Add
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="card p-6">
        <h2 className="mb-3 text-lg font-semibold">🛒 Shopping list for this plan</h2>
        {shopping.size === 0 ? (
          <p className="text-sm text-stone-500">Nothing planned yet.</p>
        ) : (
          <ul className="columns-1 gap-6 space-y-1.5 text-sm sm:columns-2">
            {[...shopping].map(([key, item]) => (
              <li key={key} className="break-inside-avoid">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="peer h-4 w-4 accent-emerald-700" />
                  <span className="flex-1 peer-checked:text-stone-400 peer-checked:line-through">{item.name}</span>
                  <span className="text-stone-500 tabular-nums">{formatQuantity(item)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {basics.size > 0 && (
          <p className="mt-4 text-sm text-stone-500">
            <span className="font-medium text-stone-600">🧂 Check you have:</span> {[...basics].join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}

type Entry = { entry: { id: number; slot: string }; meal: { id: number; name: string } };

function MonthGrid({ month, days, byKey }: { month: string; days: string[]; byKey: Map<string, Entry> }) {
  const lead = weekdayIndex(days[0]);
  const today = todayISO();
  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/plan?range=month&month=${shiftMonth(month, -1)}`} className="btn">
          ←
        </Link>
        <h2 className="font-semibold">{formatMonth(month)}</h2>
        <Link href={`/plan?range=month&month=${shiftMonth(month, 1)}`} className="btn">
          →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-1 text-center font-medium text-stone-500">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((date) => (
          <div
            key={date}
            className={`min-h-24 rounded-lg border p-1.5 ${date === today ? "border-emerald-600" : "border-stone-100"}`}
          >
            <div className="mb-1 text-stone-500">{Number(date.slice(8))}</div>
            <div className="space-y-0.5">
              {MEAL_SLOTS.map((slot) => {
                const e = byKey.get(`${date}|${slot}`);
                return e ? (
                  <Link
                    key={slot}
                    href={`/meals/${e.meal.id}`}
                    title={`${slot}: ${e.meal.name}`}
                    className="block truncate rounded bg-emerald-50 px-1 py-0.5 text-emerald-900 hover:bg-emerald-100"
                  >
                    {e.meal.name}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
