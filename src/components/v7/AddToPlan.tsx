"use client";

import { useActionState, useState } from "react";
import { addToPlan, type PlanState } from "@/app/actions/plan";
import { Icon } from "./Icons";

const SLOTS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

/** "Add to plan": pick a day of the coming week and a meal time. */
export function AddToPlan({ mealId, days, compact = false }: { mealId: number; days: { day: string; label: string }[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PlanState, FormData>(async (prev, fd) => {
    const res = await addToPlan(prev, fd);
    if (res?.ok) setOpen(false);
    return res;
  }, null);

  if (!open)
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={compact ? "btn h-12 bg-white/95" : "btn-dark"}>
          <Icon.plan className="h-[18px] w-[18px]" /> {state?.ok ? "Added to plan" : "Add to plan"}
        </button>
      </div>
    );
  return (
    <form action={action} className="card w-full space-y-3 p-4 text-ink">
      <input type="hidden" name="mealId" value={mealId} />
      <p className="text-sm font-bold">When do you want to cook it?</p>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {days.map((d, i) => (
          <label key={d.day} className="shrink-0">
            <input type="radio" name="day" value={d.day} defaultChecked={i === 0} className="peer sr-only" />
            <span className="chip peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">{d.label}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SLOTS.map((s) => (
          <label key={s.value}>
            <input type="radio" name="slot" value={s.value} defaultChecked={s.value === "dinner"} className="peer sr-only" />
            <span className="chip peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">{s.label}</span>
          </label>
        ))}
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
