import Link from "next/link";
import { chf } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import type { MealWithCategories } from "@/lib/queries";
import { Dish, ScoreChip } from "./Dish";

const firstName = (name: string | undefined) => name?.split(" ")[0];

/** Grid of recipe tiles, two across on phones. */
export function RecipeGrid({ meals, showAuthor = false, preload = 0 }: { meals: MealWithCategories[]; showAuthor?: boolean; preload?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {meals.map((m, i) => {
        const f = mealFacts(m);
        const meta = [showAuthor ? firstName(m.author?.name) : null, f.time, chf(f.chf)].filter(Boolean).join(" · ");
        return (
          <li key={m.id}>
            <Link href={`/meals/${m.id}`} className="group block">
              <div className="relative">
                <Dish meal={m} className="aspect-[4/3] rounded-[18px] transition group-hover:brightness-95" preload={i < preload} />
                <ScoreChip score={f.score} className="absolute top-2 left-2" />
              </div>
              <p className="mt-2 line-clamp-2 text-[15px] leading-snug font-bold">{m.name}</p>
              {meta && <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Big swipeable cards, used for "Otao suggests". */
export function RecipeCarousel({ meals, tileFor }: { meals: MealWithCategories[]; tileFor?: (m: MealWithCategories) => string | undefined }) {
  return (
    <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:scroll-px-0 sm:px-0">
      {meals.map((m, i) => {
        const f = mealFacts(m);
        return (
          <li key={m.id} className="w-60 shrink-0 snap-start">
            <Link href={`/meals/${m.id}`} className="group block">
              <div className="relative">
                <Dish meal={m} tile={tileFor?.(m)} className="h-[200px] rounded-[20px] transition group-hover:brightness-95" sizes="240px" preload={i < 2} />
                <ScoreChip score={f.score} className="absolute top-2.5 left-2.5" />
              </div>
              <p className="mt-2 line-clamp-2 text-[17px] leading-snug font-extrabold">{m.name}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted">{[firstName(m.author?.name), f.time, chf(f.chf)].filter(Boolean).join(" · ")}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
