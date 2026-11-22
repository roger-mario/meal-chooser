import "server-only";
import { formatDay, todayISO } from "./dates";
import { addDays } from "./labs";
import { listLog } from "./labs-queries";
import type { MealWithCategories } from "./queries";

export type PlanEntry = { id: number; day: string; slot: string; meal: MealWithCategories | null; label: string | null };

const SLOT_ORDER = ["breakfast", "lunch", "snack", "dinner"];

/** The household's shared plan for `days` days from today, one list per day. */
export async function planDays(all: MealWithCategories[], days = 7, from = todayISO()) {
  const byId = new Map(all.map((m) => [m.id, m]));
  const rows = await listLog(from, addDays(from, days - 1), { planned: true });
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    const entries: PlanEntry[] = rows
      .filter((r) => r.day === day)
      .map((r) => ({ id: r.id, day, slot: r.slot, meal: r.mealId ? (byId.get(r.mealId) ?? null) : null, label: r.label }))
      .filter((e) => e.meal || e.label)
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
    return {
      day,
      isToday: i === 0,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDay(day, { weekday: "long", day: undefined, month: undefined }),
      long: formatDay(day, { weekday: "long", day: "numeric", month: "long" }),
      short: i === 0 ? "Today" : formatDay(day, { weekday: "short", day: undefined, month: undefined }),
      entries,
    };
  });
}
