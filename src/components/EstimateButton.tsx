"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/meals";

export function EstimateButton({
  action,
  hasEstimate,
  label,
}: {
  action: (state: FormState) => Promise<FormState>;
  hasEstimate: boolean;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex items-center gap-3">
      <button type="submit" className={hasEstimate ? "btn" : "btn-primary"} disabled={pending}>
        {pending ? "Estimating…" : hasEstimate ? "Re-estimate" : label}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
