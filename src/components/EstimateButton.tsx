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
    <form action={formAction} className="flex flex-col items-end gap-2">
      <button type="submit" className={hasEstimate ? "btn" : "btn-primary"} disabled={pending}>
        {pending ? "Estimating…" : hasEstimate ? "Re-estimate" : label}
      </button>
      {state?.error && (
        <p role="alert" className="max-w-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
