import Link from "next/link";
import { addToPlanAndReturn, fillDay, removeFromPlan } from "@/app/actions/plan";
import { Dish } from "@/components/v7/Dish";
import { Icon } from "@/components/v7/Icons";
import { SubmitButton } from "@/components/SubmitButton";
import { isDay } from "@/lib/labs";
import { chf } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import { planDays } from "@/lib/plan-view";
import { listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan" };

const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

/** The household's shared plan for the coming week. */
export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const { add } = await searchParams;
  const all = await listMeals();
  const days = await planDays(all, 7);
  const addDay = isDay(add) ? days.find((d) => d.day === add) : undefined;
  const plannedIds = [...new Set(days.flatMap((d) => d.entries.map((e) => e.meal?.id).filter((id): id is number => !!id)))];
  const shopping = `/labs/shopping?${new URLSearchParams(plannedIds.map((id) => ["m", String(id)]))}`;

  if (addDay)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/plan" aria-label="Back to the plan" className="flex h-11 w-11 items-center justify-center rounded-full bg-sand">
            <Icon.back className="h-5 w-5" />
          </Link>
          <h1 className="text-[26px] font-extrabold tracking-tight">Add to {addDay.isToday ? "today" : addDay.label}</h1>
        </div>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((m) => {
            const f = mealFacts(m);
            return (
              <li key={m.id}>
                <form action={addToPlanAndReturn} className="card flex items-center gap-3 p-2.5">
                  <input type="hidden" name="mealId" value={m.id} />
                  <input type="hidden" name="day" value={addDay.day} />
                  <Dish meal={m} className="h-14 w-14 shrink-0 rounded-[14px]" sizes="56px" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 leading-snug font-bold">{m.name}</span>
                    <span className="block truncate text-[13px] text-muted">{[f.time, chf(f.chf)].filter(Boolean).join(" · ") || " "}</span>
                  </span>
                  <select name="slot" defaultValue="dinner" aria-label="Meal time" className="h-9 w-[92px] shrink-0 rounded-full border border-line-strong bg-white px-2 text-sm font-bold">
                    {Object.entries(SLOT_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <SubmitButton className="btn-primary h-9 min-h-9 shrink-0 px-3" pendingText="…">
                    Add
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-[26px] font-extrabold tracking-tight md:text-3xl">This week</h1>
        <Link href={shopping} className="btn">
          <Icon.cart className="h-[18px] w-[18px]" /> Shopping list
        </Link>
        <Link href="/labs/week" className="btn">
          <Icon.sparkle className="h-4 w-4 text-coral" /> Plan my week
        </Link>
      </div>
      <p className="text-sm text-muted">Everyone in your household sees the same plan.</p>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {days.map((d) => (
          <li key={d.day} className="card min-w-0 space-y-2.5 p-3.5">
            <div className="flex items-center gap-2">
              <p className={`flex-1 font-extrabold ${d.isToday ? "text-coral-ink" : ""}`}>
                {d.label}
                <span className="ml-2 text-sm font-semibold text-muted">{d.isToday || d.label === "Tomorrow" ? d.long.replace(/^\w+,?\s*/, "") : ""}</span>
              </p>
              <Link href={`/plan?add=${d.day}`} aria-label={`Add a recipe to ${d.label}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-sand hover:bg-line">
                <Icon.plus className="h-4 w-4" />
              </Link>
            </div>
            {d.entries.length ? (
              d.entries.map((e) => {
                const f = e.meal ? mealFacts(e.meal) : null;
                return (
                  <div key={e.id} className="flex items-center gap-3">
                    {e.meal ? <Dish meal={e.meal} className="h-14 w-14 shrink-0 rounded-[14px]" sizes="56px" /> : <span className="h-14 w-14 shrink-0 rounded-[14px] bg-sand" />}
                    <Link href={e.meal ? `/meals/${e.meal.id}` : "#"} className="min-w-0 flex-1">
                      <span className="block text-xs font-bold tracking-[0.06em] text-muted uppercase">{SLOT_LABEL[e.slot] ?? e.slot}</span>
                      <span className="block truncate font-bold">{e.meal?.name ?? e.label}</span>
                      {f && <span className="block truncate text-[13px] text-muted">{[f.time, f.kcal ? `${f.kcal} kcal` : null, chf(f.chf)].filter(Boolean).join(" · ")}</span>}
                    </Link>
                    <form action={removeFromPlan.bind(null, e.id)}>
                      <button aria-label="Remove from the plan" className="flex h-9 w-9 items-center justify-center rounded-full text-off hover:bg-sand hover:text-ink">
                        <Icon.close className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                );
              })
            ) : (
              <form action={fillDay.bind(null, d.day)} className="flex items-center gap-3 rounded-[14px] border border-dashed border-line-strong px-3 py-3">
                <span className="flex-1 text-sm text-off">Nothing planned yet</span>
                <SubmitButton className="btn h-9 min-h-9 px-3" pendingText="Filling…">
                  <Icon.sparkle className="h-4 w-4 text-coral" /> Fill for me
                </SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
