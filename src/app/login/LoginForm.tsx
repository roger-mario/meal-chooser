"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          className="input"
        />
      </label>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Opening…" : "Open Otao"}
      </button>
    </form>
  );
}
