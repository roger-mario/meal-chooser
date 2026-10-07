"use client";

import { useOptimistic, useTransition } from "react";
import { setLabsInApp } from "@/app/actions/labs";

/** Turns the Labs buttons inside the main app on or off, for this browser only. */
export function LabsToggle({ on }: { on: boolean }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(on);
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block font-medium text-stone-900">Show Labs buttons in the app</span>
        <span className="block text-xs text-stone-500">Adds &quot;Ate this&quot; to meal pages. Only on this device.</span>
      </span>
      <input
        type="checkbox"
        className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-stone-300 transition before:block before:h-5 before:w-5 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-violet-700 checked:before:translate-x-5 disabled:opacity-50"
        checked={shown}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            setShown(next);
            await setLabsInApp(next);
          });
        }}
      />
    </label>
  );
}
