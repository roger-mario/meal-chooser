import Link from "next/link";
import { chf } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import type { MealWithCategories } from "@/lib/queries";
import { Dish, ScoreChip } from "./v7/Dish";

/** One recipe tile in the v7 style, for lists that link somewhere other than the recipe page. */
export function MealCard({ meal, preload = false, href = `/meals/${meal.id}` }: { meal: MealWithCategories; preload?: boolean; href?: string }) {
  const f = mealFacts(meal);
  const meta = [meal.author?.name.split(" ")[0], f.time, chf(f.chf)].filter(Boolean).join(" · ");
  return (
    <Link href={href} className="group block">
      <div className="relative">
        <Dish meal={meal} className="aspect-[4/3] rounded-[18px] transition group-hover:brightness-95" preload={preload} />
        <ScoreChip score={f.score} className="absolute top-2 left-2" />
      </div>
      <p className="mt-2 line-clamp-2 text-[15px] leading-snug font-bold">{meal.name}</p>
      {meta && <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>}
    </Link>
  );
}
