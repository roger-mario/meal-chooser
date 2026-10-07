"use client";

import { useActionState, useMemo, useState } from "react";
import { logMeal, type LabsState } from "@/app/actions/labs";

type Option = { id: number; name: string; kcal: number | null };

/** "+ Add" under a meal time: search your meals, or type anything else you ate. */
export function LogMealForm({ day, slot, meals, usual }: { day: string; slot: string; meals: Option[]; usual: Option[] }) {
  const [state, action, pending] = useActionState<LabsState, FormData>(logMeal, null);
  const [q, setQ] = useState("");
  const found = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return meals.filter((m) => words.every((w) => m.name.toLowerCase().includes(w))).slice(0, 8);
  }, [q, meals]);

  const pick = (m: Option, label: string) => (
    <form action={action} key={`${label}-${m.id}`}>
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="mealId" value={m.id} />
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-stone-100 disabled:opacity-50"
      >
        <span className="truncate">{m.name}</span>
        {m.kcal != null && <span className="shrink-0 text-xs text-stone-500">{Math.round(m.kcal)} kcal</span>}
      </button>
    </form>
  );

  return (
    <div className="space-y-2">
      {usual.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {usual.map((m) => (
            <form action={action} key={m.id}>
              <input type="hidden" name="day" value={day} />
              <input type="hidden" name="slot" value={slot} />
              <input type="hidden" name="mealId" value={m.id} />
              <button type="submit" disabled={pending} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200 hover:bg-violet-100 disabled:opacity-50">
                ＋ {m.name}
              </button>
            </form>
          ))}
        </div>
      )}
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-violet-700 hover:underline">
          ＋ Add
        </summary>
        <div className="mt-2 space-y-2 rounded-xl border border-stone-200 bg-white p-2">
          <input className="input" placeholder="Search your meals…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-64 overflow-y-auto">{found.map((m) => pick(m, "found"))}</div>
          <form action={action} className="flex gap-2 border-t border-stone-100 pt-2">
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="slot" value={slot} />
            <input className="input" name="label" placeholder="Something else, e.g. sandwich" maxLength={120} />
            <button type="submit" className="btn shrink-0" disabled={pending}>
              Add
            </button>
          </form>
          <p className="px-1 text-xs text-stone-400">Things typed in by hand have no nutrition values, so they don&apos;t count in the day&apos;s totals.</p>
        </div>
      </details>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
