import Link from "next/link";
import type { MealWithCategories } from "@/lib/queries";
import { CostPanel } from "./CostPanel";
import { HealthSummary } from "./HealthSummary";
import { MealView } from "./MealView";
import { NutritionPanel } from "./NutritionPanel";
import { Fold } from "./v7/Fold";
import { Wordmark } from "./v7/Logo";

// Used by the public pages (shared links, the recipe collection). Nothing here may import server actions.

export function PublicHeader({ badge, short, href }: { badge: string; short: string; href?: string }) {
  const logo = <Wordmark size={22} />;
  return (
    <header className="border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
        {href ? (
          <Link href={href} aria-label="Otao" className="flex items-center gap-2">
            {logo}
          </Link>
        ) : (
          logo
        )}
        <span className="ml-auto rounded-full bg-sand px-3 py-1 text-xs font-bold text-muted">
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
        <Fold title="Otao score" open>
          <HealthSummary nutrition={meal.nutrition} />
        </Fold>
      )}
      {meal.cost && meal.cost.items.length > 0 && (
        <Fold title={`Cost at ${meal.cost.store}`}>
          <CostPanel cost={meal.cost} servings={meal.servings} />
        </Fold>
      )}
      {meal.nutrition && (
        <Fold title="Nutrition per serving">
          <NutritionPanel nutrition={meal.nutrition} />
        </Fold>
      )}
    </>
  );
}
