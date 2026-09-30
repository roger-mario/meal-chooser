import Link from "next/link";
import { costPerServing, formatChf } from "@/lib/cost";
import { DIETS, DIFFICULTIES, formatMinutes, totalMinutes } from "@/lib/meal-fields";
import type { MealWithCategories } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { MealImage } from "./MealImage";

const DOTS = { easy: "●○○", medium: "●●○", hard: "●●●" } as const;

function shortDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: process.env.APP_TIMEZONE || "UTC" });
}

/** A meal in the home grid. Every card has the same layout, whatever details the meal has. */
export function MealCard({ meal, comments = 0 }: { meal: MealWithCategories; comments?: number }) {
  const minutes = totalMinutes(meal);
  const price = costPerServing(meal.cost, meal.servings);
  const kcal = meal.nutrition?.perServing.calories;
  const diet = DIETS.find((d) => d.value === meal.diet);
  const difficulty = DIFFICULTIES.find((d) => d.value === meal.difficulty);
  const pill = "rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-800 shadow-sm backdrop-blur";

  return (
    <Link
      href={`/meals/${meal.id}`}
      className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative">
        <MealImage src={meal.imageUrl} alt={meal.name} className="transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {meal.babyFriendly && (
            <span className={pill} title="Baby-friendly">
              👶<span className="ml-1 hidden sm:inline">Baby</span>
            </span>
          )}
          {diet && (
            <span className={pill} title={diet.label}>
              {diet.emoji}
              <span className="ml-1 hidden sm:inline">{diet.label}</span>
            </span>
          )}
        </div>
        {price != null && (
          <span className="absolute top-2 right-2 rounded-full bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur">
            {formatChf(price)}
            <span className="hidden font-normal text-white/70 sm:inline"> / portion</span>
          </span>
        )}
        {minutes && <span className={`absolute bottom-2 left-2 ${pill}`}>⏱ {formatMinutes(minutes)}</span>}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h2 className="line-clamp-2 text-[15px] leading-snug font-semibold text-stone-900 sm:text-base">{meal.name}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          {difficulty && (
            <span>
              <span className="tracking-tighter text-emerald-700">{DOTS[difficulty.value]}</span> {difficulty.label}
            </span>
          )}
          {kcal != null && <span>🔥 {Math.round(kcal)} kcal</span>}
          {meal.categories.length > 0 && (
            <span className="flex gap-0.5" title={meal.categories.map((c) => c.name).join(", ")}>
              {meal.categories.map((c) => (
                <span key={c.id}>{c.emoji}</span>
              ))}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center gap-1.5 border-t border-stone-100 pt-2.5 text-xs text-stone-500">
          {meal.author ? (
            <>
              <Avatar id={meal.author.id} name={meal.author.name} size="sm" />
              <span className="truncate font-medium text-stone-600">{meal.author.name}</span>
            </>
          ) : (
            <span className="text-stone-400">Added</span>
          )}
          <span className="hidden text-stone-300 sm:inline">·</span>
          <time dateTime={meal.createdAt.toISOString()} className="hidden shrink-0 sm:inline">
            {shortDate(meal.createdAt)}
          </time>
          {comments > 0 && (
            <span className="ml-auto shrink-0" title={`${comments} chat message${comments === 1 ? "" : "s"}`}>
              💬 {comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
