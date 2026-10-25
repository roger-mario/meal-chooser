import Link from "next/link";
import type { MealWithCategories } from "@/lib/queries";
import { CostPanel } from "./CostPanel";
import { HealthSummary } from "./HealthSummary";
import { MealView } from "./MealView";
import { NutritionPanel } from "./NutritionPanel";

// Used by the public pages (shared links, the recipe collection). Nothing here may import server actions.

export function PublicHeader({ badge, short, href }: { badge: string; short: string; href?: string }) {
  const logo = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" /> Otao
    </>
  );
  return (
    <header className="border-b border-stone-200 bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 text-lg font-semibold tracking-tight">
        {href ? (
          <Link href={href} className="flex items-center gap-2">
            {logo}
          </Link>
        ) : (
          logo
        )}
        <span className="ml-auto rounded-full bg-stone-100 px-3 py-1 text-xs font-normal text-stone-500">
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{badge}</span>
        </span>
      </div>
    </header>
  );
}

/** A meal with its score, prices and nutrition, read-only. */
export function PublicMealSections({ meal }: { meal: MealWithCategories }) {
  return (
    <>
      <MealView meal={meal} />
      {meal.nutrition && (
        <section className="card space-y-3 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">✨ Otao score</h2>
          <HealthSummary nutrition={meal.nutrition} />
        </section>
      )}
      {meal.cost && meal.cost.items.length > 0 && (
        <section className="card space-y-4 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">💰 Cost at {meal.cost.store}</h2>
          <CostPanel cost={meal.cost} servings={meal.servings} />
        </section>
      )}
      {meal.nutrition && (
        <section className="card space-y-4 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">🥗 Nutrition per serving</h2>
          <NutritionPanel nutrition={meal.nutrition} />
        </section>
      )}
    </>
  );
}
