"use client";

import { useOptimistic, useTransition } from "react";
import { setFavourite } from "@/app/actions/collection";
import { Icon } from "./Icons";

/** The heart: likes a recipe so it shows under "Liked" on Home. */
export function LikeButton({ mealId, on, variant = "round" }: { mealId: number; on: boolean; variant?: "round" | "pill" }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(on);
  const toggle = () =>
    start(async () => {
      setShown(!shown);
      await setFavourite(mealId, !shown);
    });
  if (variant === "pill")
    return (
      <button type="button" className="btn" aria-pressed={shown} disabled={pending} onClick={toggle}>
        <Icon.heart filled={shown} className={`h-[18px] w-[18px] ${shown ? "text-like" : ""}`} />
        {shown ? "Liked" : "Like"}
      </button>
    );
  return (
    <button
      type="button"
      aria-label={shown ? "Unlike" : "Like"}
      aria-pressed={shown}
      disabled={pending}
      onClick={toggle}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-sm transition active:scale-95"
    >
      <Icon.heart filled={shown} className={`h-6 w-6 ${shown ? "text-like" : "text-ink"}`} />
    </button>
  );
}
