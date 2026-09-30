"use client";

import { useTransition } from "react";
import { deleteMeal } from "@/app/actions/meals";

/** Quiet delete link at the end of the meal page; asks before deleting. */
export function DeleteMealButton({ mealId, name }: { mealId: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete "${name}"? This can't be undone.`)) start(() => deleteMeal(mealId));
      }}
      className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "🗑 Delete this meal"}
    </button>
  );
}
