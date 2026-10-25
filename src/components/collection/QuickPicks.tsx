import Link from "next/link";
import type { QuickPick } from "@/lib/collection";
import { MealImage } from "../MealImage";

/** A swipeable row of someone's go-to meals. */
export function QuickPicks({ picks }: { picks: QuickPick[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">⭐ Quick picks</h2>
        <Link href="/labs/collection" className="text-sm font-medium text-violet-700 hover:underline">
          🧪 Labs
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {picks.map((m) => (
          <li key={m.id} className="w-36 shrink-0 snap-start sm:w-44">
            <Link href={`/meals/${m.id}`} className="card group block overflow-hidden transition hover:shadow-md">
              <div className="relative">
                <MealImage src={m.imageUrl} alt={m.name} className="transition duration-300 group-hover:scale-[1.03]" />
                {m.favourite && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-1.5 text-xs text-amber-600 shadow-sm" title="Favourite">
                    ★
                  </span>
                )}
              </div>
              <p className="line-clamp-2 p-2.5 text-sm leading-snug font-medium text-stone-900">{m.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
