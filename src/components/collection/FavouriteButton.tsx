"use client";

import { useOptimistic, useTransition } from "react";
import { setFavourite } from "@/app/actions/collection";

/** Stars a meal so it shows first in the person's quick picks. */
export function FavouriteButton({ mealId, on }: { mealId: number; on: boolean }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(on);
  return (
    <button
      type="button"
      className={`btn ${shown ? "border-amber-300 bg-amber-50 text-amber-900" : ""}`}
      aria-pressed={shown}
      disabled={pending}
      title={shown ? "Remove from your favourites" : "Add to your favourites (shows first in Quick picks)"}
      onClick={() =>
        start(async () => {
          setShown(!shown);
          await setFavourite(mealId, !shown);
        })
      }
    >
      {shown ? "★ Favourite" : "☆ Favourite"}
    </button>
  );
}
