"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setMealPublic } from "@/app/actions/collection";

/** The author decides whether the meal is listed in the public collection. */
export function PublicToggle({ mealId, isPublic }: { mealId: number; isPublic: boolean }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(isPublic);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={`btn ${shown ? "border-sky-300 bg-sky-50 text-sky-900" : ""}`}
        aria-pressed={shown}
        disabled={pending}
        title={shown ? "Listed in the public collection. Tap to make it private." : "Only you and your household see it. Tap to add it to the public collection."}
        onClick={() =>
          start(async () => {
            setShown(!shown);
            const result = await setMealPublic(mealId, !shown);
            setError(result?.error ?? null);
          })
        }
      >
        {shown ? "🌍 Public" : "🔒 Private"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
