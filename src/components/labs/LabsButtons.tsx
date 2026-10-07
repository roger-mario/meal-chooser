"use client";

import { useTransition } from "react";
import { atePlanned, removeLogEntry, swapPlanned } from "@/app/actions/labs";

const actions = { remove: removeLogEntry, swap: swapPlanned, ate: atePlanned };
const labels = { remove: "✕", swap: "🔄 Swap", ate: "✓ Ate it" };
const titles = { remove: "Remove", swap: "Pick another dinner", ate: "Log it as eaten by you" };

/** Small buttons on a logged or planned row. */
export function RowButton({ id, kind }: { id: number; kind: keyof typeof actions }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={titles[kind]}
      aria-label={titles[kind]}
      disabled={pending}
      onClick={() => start(() => actions[kind](id))}
      className={
        kind === "remove"
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40"
          : "btn min-h-9 shrink-0 px-2.5 py-1 text-xs"
      }
    >
      {pending ? "…" : labels[kind]}
    </button>
  );
}
