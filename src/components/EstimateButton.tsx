"use client";

import { useActionState } from "react";
import { estimateMealNutrition } from "@/app/actions/meals";

export function EstimateButton({ mealId, hasEstimate }: { mealId: number; hasEstimate: boolean }) {
  const [state, action, pending] = useActionState(estimateMealNutrition.bind(null, mealId), null);
  return (
    <form action={action} className="flex items-center gap-3">
      <button type="submit" className={hasEstimate ? "btn" : "btn-primary"} disabled={pending}>
        {pending ? "Estimating…" : hasEstimate ? "Re-estimate" : "Estimate nutrition with AI"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
