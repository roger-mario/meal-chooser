"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const pick = (ids: number[]) => ids[Math.floor(Math.random() * ids.length)];

/**
 * "Surprise me": the meal is picked from the ones on the page as soon as it loads and fetched
 * in the background, so tapping the dice opens it at once.
 */
export function RandomButton({ mealIds, fallbackHref }: { mealIds: number[]; fallbackHref: string }) {
  const [next, setNext] = useState<number | null>(null);
  const key = mealIds.join(",");
  // Picked in the browser after the first render, so server and browser render the same link,
  // and coming back to the page gives a new pick.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNext(key ? pick(key.split(",").map(Number)) : null), [key]);

  return (
    <Link
      href={next ? `/meals/${next}` : fallbackHref}
      prefetch={next ? true : false}
      className="btn h-11 w-11 shrink-0 rounded-full p-0 text-xl sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:text-sm"
      title="Surprise me"
    >
      🎲<span className="hidden sm:inline">Surprise me</span>
    </Link>
  );
}
