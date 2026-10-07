"use client";

import { useActionState } from "react";
import { logMeal, type LabsState } from "@/app/actions/labs";
import { SLOTS } from "@/lib/labs";

/** Labs: logs this meal for today, at the meal time that fits the hour. */
export function AteThisButton({ mealId, day, hour }: { mealId: number; day: string; hour: number }) {
  const [state, action, pending] = useActionState<LabsState | { done: true }, FormData>(
    async (prev, formData) => (await logMeal(null, formData)) ?? { done: true },
    null,
  );
  const slot = hour < 11 ? "breakfast" : hour < 16 ? "lunch" : "dinner";
  if (state && "done" in state) {
    return <span className="btn border-violet-200 bg-violet-50 text-violet-800">✓ Logged for today</span>;
  }
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="mealId" value={mealId} />
      <input type="hidden" name="day" value={day} />
      <select name="slot" defaultValue={slot} className="input w-auto py-1.5" aria-label="Meal time">
        {SLOTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" className="btn border-violet-300 text-violet-800" disabled={pending} title="Labs: log this in today's meals">
        🧪 Ate this
      </button>
      {state && "error" in state && state.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  );
}
